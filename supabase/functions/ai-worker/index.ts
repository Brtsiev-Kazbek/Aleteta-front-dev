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
import { isTransient } from "../_shared/llm.ts";

/** Сколько заданий берём за один запуск. */
const BATCH = 3;

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
  (job: Job, supabase: SupabaseClient) => Promise<HandlerResult>
> = {
  extract: runExtract,
};

export interface HandlerResult {
  output: unknown;
  tokensIn?: number;
  tokensOut?: number;
  costUsd?: number | null;
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

  const processed: string[] = [];

  for (let i = 0; i < BATCH; i += 1) {
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
      const result = await handler(typed, supabase);

      await supabase.rpc("finish_job", {
        job_id: typed.id,
        result: result.output,
        tokens_in: result.tokensIn ?? null,
        tokens_out: result.tokensOut ?? null,
        cost: result.costUsd ?? null,
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

  return new Response(
    JSON.stringify({ worker: WORKER, processed: processed.length }),
    { headers: { "content-type": "application/json" } }
  );
});
