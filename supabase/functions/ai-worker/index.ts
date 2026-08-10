/**
 * Исполнитель заданий к модели.
 *
 * Забирает задание из очереди, выполняет и записывает результат. Всё, что
 * связано с очередью — блокировка, повторы, учёт расхода, — живёт здесь и
 * одинаково для всех задач. Обработчики про очередь не знают ничего: получают
 * вход, возвращают выход.
 *
 * Запускается двумя способами. Раз в минуту его дёргает pg_cron — чтобы
 * ничего не потерялось. И сразу после постановки задания его зовёт серверное
 * действие — чтобы человек не ждал минуту на пустом месте.
 *
 * Выкладка:
 *   supabase functions deploy ai-worker
 *   supabase secrets set LLM_API_KEY=... LLM_BASE_URL=... LLM_MODEL_VISION=...
 */

import { createClient } from "jsr:@supabase/supabase-js@2";

import { runExtract } from "./handlers/extract.ts";
import { runOcr } from "./handlers/ocr.ts";
import { isTransient } from "../_shared/llm.ts";

/** Сколько заданий берём за один запуск. */
const BATCH = 3;

/**
 * Бюджет запуска.
 *
 * Edge Function живёт полторы минуты и получает две секунды процессорного
 * времени. Страница PDF рисуется примерно за десятую долю секунды процессора,
 * а ответа модели по ней приходится ждать секунд двадцать — то есть упираемся
 * мы не в вычисления, а в ожидание. Отсюда две границы: сколько страниц
 * рисовать и до какого момента вообще начинать новую.
 *
 * Незаконченное задание не пропадает: оно возвращается в очередь, и следующий
 * запуск продолжает с той же страницы.
 */
const PAGE_BUDGET = Number(Deno.env.get("OCR_PAGES_PER_RUN") ?? 4);
const RUN_MS = Number(Deno.env.get("WORKER_RUN_MS") ?? 45_000);

/** Имя процесса в `locked_by`: по нему видно, чей запуск завис. */
const WORKER = `edge-${crypto.randomUUID().slice(0, 8)}`;

/**
 * Соответствие задачи и обработчика.
 *
 * ДОБАВЛЕНИЕ НОВОЙ ОПЕРАЦИИ: написать файл в handlers/ и вписать его сюда.
 * Больше в этом файле менять нечего.
 */
const HANDLERS: Record<
  string,
  (job: Job, supabase: SupabaseClient, run: Run) => Promise<HandlerResult>
> = {
  ocr: runOcr,
  extract: runExtract,
};

/** Что осталось от бюджета запуска. Обработчик уменьшает его по ходу работы. */
export interface Run {
  /** Сколько страниц ещё можно нарисовать. */
  pages: number;
  /** Момент, после которого новую страницу начинать нельзя. */
  deadline: number;
}

export interface HandlerResult {
  output: unknown;
  /**
   * Работа не доведена до конца — бюджет запуска исчерпан. Задание вернётся в
   * очередь, а не будет объявлено выполненным или неудачным.
   */
  unfinished?: boolean;
  /** Сколько процентов сделано. Имеет смысл вместе с `unfinished`. */
  progress?: number;
  tokensIn?: number;
  tokensOut?: number;
  cost?: number | null;
}

export interface Job {
  id: string;
  workspace_id: string;
  case_id: string | null;
  document_id: string | null;
  task: string;
  model: string | null;
  prompt_version: string | null;
  input: Record<string, unknown>;
  attempts: number;
}

type SupabaseClient = ReturnType<typeof createClient>;

function serviceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

Deno.serve(async () => {
  const supabase = serviceClient();

  // Задания, брошенные упавшим исполнителем, возвращаем в очередь.
  await supabase.rpc("release_stale_jobs");

  const run: Run = { pages: PAGE_BUDGET, deadline: Date.now() + RUN_MS };
  const processed: string[] = [];
  let unfinished = 0;

  for (let i = 0; i < BATCH; i += 1) {
    // Бюджет кончился — следующее задание достанется следующему запуску.
    if (run.pages <= 0 || Date.now() >= run.deadline) break;

    const { data: job, error } = await supabase.rpc("claim_job", {
      worker: WORKER,
    });

    if (error) {
      console.error("не удалось взять задание", error.message);
      break;
    }
    if (!job) break; // Очередь пуста.

    const typed = job as unknown as Job;
    processed.push(typed.id);

    const handler = HANDLERS[typed.task];

    if (!handler) {
      /*
       * Задача без обработчика — не временная ошибка, повторять бессмысленно.
       * Гасим сразу, чтобы она не крутилась в очереди до исчерпания попыток.
       */
      await supabase.rpc("fail_job", {
        job_id: typed.id,
        reason: `Нет обработчика для задачи «${typed.task}»`,
        max_attempts: 0,
      });
      continue;
    }

    try {
      const result = await handler(typed, supabase, run);

      if (result.unfinished) {
        /*
         * Сделано столько, сколько влезло в запуск. Это не ошибка и не успех:
         * задание возвращается в очередь и продолжится с того же места.
         */
        unfinished += 1;
        await supabase.rpc("requeue_job", {
          job_id: typed.id,
          progress_value: result.progress ?? null,
        });
        continue;
      }

      await supabase.rpc("finish_job", {
        job_id: typed.id,
        result: result.output,
        tokens_in: result.tokensIn ?? null,
        tokens_out: result.tokensOut ?? null,
        cost: result.cost ?? null,
      });
    } catch (caught) {
      const reason = caught instanceof Error ? caught.message : String(caught);

      /*
       * Временную ошибку — 429 от перегруженной модели, обрыв сети — повторяем
       * с растущей паузой. Постоянную гасим сразу: три попытки одного и того же
       * неверного запроса стоят втрое дороже и приводят туда же.
       */
      await supabase.rpc("fail_job", {
        job_id: typed.id,
        reason,
        max_attempts: isTransient(caught) ? 3 : 1,
      });

      console.error(`задание ${typed.id} не выполнено:`, reason);
    }
  }

  /*
   * Если что-то осталось недоделанным, будим себя сами, не дожидаясь минутного
   * тика pg_cron. Это цепочка, а не веер: один запуск порождает не более
   * одного следующего, и обрывается она, как только очередь опустеет.
   */
  if (unfinished > 0) keepGoing();

  return new Response(
    JSON.stringify({
      worker: WORKER,
      processed: processed.length,
      unfinished,
    }),
    { headers: { "content-type": "application/json" } }
  );
});

function keepGoing(): void {
  const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/ai-worker`;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  const next = fetch(url, {
    method: "POST",
    headers: { authorization: `Bearer ${key}` },
  }).catch((error) => {
    // Не беда: через минуту то же самое сделает pg_cron.
    console.error("не удалось разбудить следующий запуск:", error);
  });

  /*
   * Ответ мы уже отдали, и без этой строчки исполнителя погасят раньше, чем
   * запрос уйдёт. Ждать ответа при этом нельзя: следующий запуск живёт свои
   * полторы минуты, а наши на это время не рассчитаны.
   */
  const runtime = (globalThis as { EdgeRuntime?: { waitUntil(p: Promise<unknown>): void } })
    .EdgeRuntime;
  runtime?.waitUntil(next);
}
