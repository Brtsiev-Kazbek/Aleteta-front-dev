import "server-only";

import { createHash } from "node:crypto";

import { requireSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { getModel, isLlmConfigured, type ModelTier } from "@/lib/ai/config";
import { promptVersion } from "@/lib/ai/prompts";
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
  if (!isLlmConfigured()) {
    throw new Error(
      "Модель не настроена: заполните LLM_BASE_URL и имена моделей в переменных окружения."
    );
  }

  const session = await requireSession();
  const supabase = createClient();

  const model = getModel(TASK_TIER[task]);
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
    return { jobId: cached.id, fromCache: true };
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
      cost_usd: null,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Не удалось поставить задание: ${error.message}`);

  return { jobId: data.id, fromCache: false };
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
