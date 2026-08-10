import "server-only";

import { createHash } from "node:crypto";

import { requireSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { getModel, isLlmConfigured, type ModelTier } from "@/lib/ai/config";
import { promptVersion } from "@/lib/ai/prompts";
import { createLogger, shortId } from "@/lib/logger";
import type {
  JobState,
  TaskInput,
  TaskOutput,
  TypedTask,
} from "@/lib/ai/types";

/**
 * Постановка заданий и чтение результата.
 *
 * Это вся граница приложения с моделью. Ничего, кроме записи в `ai_jobs` и
 * чтения оттуда, здесь не происходит и происходить не должно: вызов модели
 * живёт в Edge Function, потому что разбор договора идёт минутами, а запрос к
 * Netlify — десять секунд.
 */

const log = createLogger("job");

/** Какой класс модели нужен задаче. Влияет на цену и на отпечаток. */
const TASK_TIER: Record<TypedTask, ModelTier> = {
  ocr: "vision",
  // Извлечение работает с распознанным текстом, картинки ему не нужны.
  extract: "fast",
  review: "smart",
  assistant: "smart",
  embed: "embedding",
};

/**
 * Отпечаток входа: по нему повторный запрос берётся из журнала вместо нового
 * вызова модели.
 *
 * В отпечаток входит не только сам вход, но и версия промпта с именем модели.
 * Иначе после правки промпта исполнитель отдал бы старый ответ, и правку
 * невозможно было бы проверить.
 */
export function fingerprint(
  task: TypedTask,
  input: unknown,
  model: string
): string {
  const payload = JSON.stringify({
    task,
    prompt: promptVersion(task),
    model,
    input,
  });
  return createHash("sha256").update(payload).digest("hex");
}

export interface EnqueueResult {
  jobId: string;
  /** Ответ нашёлся в журнале — задание уже готово, ждать нечего. */
  fromCache: boolean;
}

/**
 * Ставит задание в очередь.
 *
 * Возвращает управление сразу: считать будет исполнитель. Форма получает
 * идентификатор и опрашивает состояние, пока задание не закончится.
 */
export async function enqueueJob<T extends TypedTask>(
  task: T,
  input: TaskInput<T>,
  context: { caseId?: string; documentId?: string } = {}
): Promise<EnqueueResult> {
  /*
   * Проверяем ту модель, которая нужна этой задаче, а не все сразу.
   * Распознаванию нужна `vision`, извлечению — `smart`; человек, заполнивший
   * одну из них, вправе пользоваться тем, что заполнил.
   */
  const tier = TASK_TIER[task];
  const done = log.timer("enqueue", { задача: task, класс: tier });

  if (!isLlmConfigured(tier)) {
    log.error("enqueue.not-configured", {
      задача: task,
      класс: tier,
      нужно: `LLM_BASE_URL и LLM_MODEL_${tier.toUpperCase()}`,
    });
    throw new Error(
      `Не задана модель для этой операции. Заполните LLM_BASE_URL и ` +
        `LLM_MODEL_${tier.toUpperCase()} в переменных окружения приложения.`
    );
  }

  const session = await requireSession();
  const supabase = createClient();

  const model = getModel(tier);
  const hash = fingerprint(task, input, model);

  /*
   * Готовый ответ на такой же вход. Ищем среди своих: чужие задания закрыты
   * политиками, и это правильно — вход может содержать реквизиты из чужого
   * дела.
   */
  const { data: cached } = await supabase
    .from("ai_jobs")
    .select("id")
    .eq("workspace_id", session.workspaceId)
    .eq("task", task)
    .eq("model", model)
    .eq("input_hash", hash)
    .eq("status", "done")
    .limit(1)
    .maybeSingle();

  if (cached) {
    done({ задание: shortId(cached.id), источник: "журнал" });
    return { jobId: cached.id, fromCache: true };
  }

  /*
   * Такое же задание уже в работе. Заводить второе незачем и вредно: два
   * исполнителя прочитают один файл дважды, и это прямые деньги. Возвращаем то,
   * что уже есть, — для интерфейса разницы нет, а нажать «распознать» дважды
   * человек может запросто.
   */
  const { data: running } = await supabase
    .from("ai_jobs")
    .select("id")
    .eq("workspace_id", session.workspaceId)
    .eq("task", task)
    .eq("model", model)
    .eq("input_hash", hash)
    .in("status", ["queued", "running"])
    .limit(1)
    .maybeSingle();

  if (running) {
    done({ задание: shortId(running.id), источник: "уже в работе" });
    return { jobId: running.id, fromCache: false };
  }

  const { data, error } = await supabase
    .from("ai_jobs")
    .insert({
      workspace_id: session.workspaceId,
      case_id: context.caseId ?? null,
      document_id: context.documentId ?? null,
      task,
      status: "queued",
      provider: "router",
      model,
      prompt_version: promptVersion(task),
      input: input as never,
      input_hash: hash,
      created_by: session.userId,
      /*
       * Поля, которые заполняет исполнитель. Генератор типов требует их явно:
       * в базе у них нет значений по умолчанию, и это правильно — пустая
       * стоимость и пустой результат должны отличаться от нуля и от «{}».
       */
      output: null,
      error: null,
      correction: null,
      tokens_in: null,
      tokens_out: null,
      cost: null,
    })
    .select("id")
    .single();

  if (error) {
    log.error("enqueue.insert", { задача: task, ошибка: error.message });
    throw new Error(`Не удалось поставить задание: ${error.message}`);
  }

  done({ задание: shortId(data.id), источник: "новое", модель: model });

  await pokeWorker(data.id);

  return { jobId: data.id, fromCache: false };
}

/**
 * Будим исполнителя, не дожидаясь расписания.
 *
 * Очередь разбирает `pg_cron` раз в минуту, и без этого толчка человек, только
 * что загрузивший файл, целую минуту смотрел бы на надпись «в очереди» при
 * полностью свободном исполнителе. Минута ожидания на пустом месте выглядит как
 * поломка, а не как очередь.
 *
 * Ответа не ждём и ошибку глотаем намеренно: задание уже в базе, и расписание
 * заберёт его в любом случае. Провалить постановку из-за того, что не удалось
 * позвонить в дверь, было бы странно.
 */
async function pokeWorker(jobId: string): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  /*
   * Каким ключом стучаться.
   *
   * Служебный, если он задан. Но требовать его незачем: исполнитель ключом
   * вызывающего не пользуется вовсе — к базе он ходит своим, который Supabase
   * подставляет ему в окружение. От звонящего нужно одно: пройти проверку JWT
   * на входе, а публичный ключ проекта её проходит.
   *
   * Раньше без служебного ключа толчок просто не делался, и каждое задание
   * ждало минутного тика расписания. Минута ожидания на пустом месте выглядит
   * как поломка — при том, что всё настроено и работает.
   */
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    log.warn("poke.skip", {
      задание: shortId(jobId),
      причина: "нет адреса проекта или ключа",
      следствие: "исполнитель проснётся по расписанию, до минуты",
    });
    return;
  }

  const done = log.timer("poke", { задание: shortId(jobId) });

  try {
    const response = await fetch(`${url}/functions/v1/ai-worker`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ source: "action", jobId }),
      // Ответа ждать нечего: исполнитель работает минуту, а действие живёт
      // десять секунд. Нам важно только, чтобы запрос ушёл.
      signal: AbortSignal.timeout(2_000),
    });

    done({ код: response.status });

    /*
     * 404 значит, что исполнитель не выложен. Отдельная строка, потому что это
     * самая частая причина «файл висит в очереди», и по коду ответа она
     * опознаётся однозначно.
     */
    if (response.status === 404) {
      log.error("poke.not-deployed", {
        подсказка: "npx supabase functions deploy ai-worker — см. docs/START-OCR.md",
      });
    }
  } catch (caught) {
    /*
     * Обрыв по таймауту — не беда: запрос ушёл, исполнитель работает. Отличить
     * это от «не дозвонились» можно по имени ошибки.
     */
    const name = caught instanceof Error ? caught.name : "неизвестно";
    done({ ошибка: name === "TimeoutError" ? undefined : name, обрыв: name });
  }
}

/**
 * Состояние задания для опроса из формы.
 *
 * Читается под правами пользователя: чужое задание просто не найдётся.
 */
export async function readJob<T extends TypedTask>(
  jobId: string
): Promise<JobState<T> | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("ai_jobs")
    .select("id, task, status, progress, output, error")
    .eq("id", jobId)
    .maybeSingle();

  if (error) throw new Error(`Не удалось прочитать задание: ${error.message}`);
  if (!data) return null;

  return {
    id: data.id,
    task: data.task as T,
    status: data.status,
    progress: data.progress,
    output: (data.output ?? null) as TaskOutput<T> | null,
    error: data.error,
  };
}

/**
 * Правка человека поверх ответа модели.
 *
 * Самая ценная разметка, какая бывает: показывает, где именно модель ошиблась,
 * и достаётся бесплатно — человек всё равно исправляет ошибку, надо лишь
 * записать, что он исправил. Из этого потом собирается набор для сравнения
 * моделей.
 */
export async function recordCorrection(
  jobId: string,
  correction: unknown
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("ai_jobs")
    .update({ correction: correction as never })
    .eq("id", jobId);

  if (error) throw new Error(`Не удалось сохранить правку: ${error.message}`);
}
