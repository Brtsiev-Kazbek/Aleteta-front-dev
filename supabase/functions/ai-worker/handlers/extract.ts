import { complete, parseJson } from "../../_shared/llm.ts";
import { buildExtractPrompt, type FieldSpec } from "../../_shared/prompts.ts";
import type { HandlerResult, Job, Run } from "../index.ts";

/**
 * Извлечение реквизитов из документа.
 *
 * Про очередь и повторы обработчик не знает ничего: получает задание,
 * возвращает результат. Упал — исполнитель сам решит, повторять или гасить.
 *
 * Порядок работы:
 *   1. распознанный текст первых страниц — картинок здесь нет;
 *   2. описание реквизитов типа объекта → в промпт;
 *   3. модель читает текст и возвращает значения с уверенностью;
 *   4. значения ложатся в новую карточку объекта;
 *   5. валидность считает триггер базы, а не мы.
 */

interface ExtractInput {
  documentId: string;
  caseId: string;
  typeId: string;
}

interface ModelAnswer {
  fields: { key: string; value: string; confidence: number; page?: number }[];
  missing: string[];
}

/** Ниже этого порога значение подставляется, но помечается как непроверенное. */
const CONFIDENCE_THRESHOLD = 0.75;

/**
 * Сколько знаков распознанного текста уходит в модель.
 *
 * Реквизиты живут в шапке и на первых листах — это свойство документов, а не
 * наша уступка: у выписки ЕГРН кадастровый номер на первой странице, у устава
 * реквизиты общества на первой же. Сорок листов приложений к договору не
 * добавляют к ним ничего, зато добавляют к счёту и к времени ответа.
 *
 * Шестьдесят тысяч знаков — это примерно двадцать тысяч токенов, то есть
 * двадцать-тридцать страниц плотного текста. Больше не нужно; меньше начинает
 * резать по живому у документов с длинной преамбулой.
 *
 * Сколько страниц уместилось, возвращаем наружу: человек должен видеть, что
 * модель смотрела не весь файл, а не догадываться об этом по пустым полям.
 */
const CHAR_BUDGET = 60_000;

/**
 * Запас на запись результата.
 *
 * Ожидание ответа модели обрываем раньше, чем исполнителя погасят по часам:
 * иначе задание останется в «выполняется» до `release_stale_jobs`, а человек
 * будет смотреть на бегунок, за которым уже никого нет.
 */
const WRITE_RESERVE_MS = 5_000;
const MIN_WAIT_MS = 15_000;

export async function runExtract(
  job: Job,
  supabase: ReturnType<typeof import("jsr:@supabase/supabase-js@2").createClient>,
  run: Run
): Promise<HandlerResult> {
  const input = job.input as unknown as ExtractInput;

  /* --- 1. Распознанный текст ------------------------------------- */

  /*
   * Картинок здесь больше нет: их прочитала задача `ocr`, ровно один раз на
   * файл. Если текста ещё нет — значит распознавание не прошло, и разбирать
   * нечего; повторять его отсюда нельзя, иначе платить будем дважды.
   */
  const { data: document } = await supabase
    .from("documents")
    .select("title, ocr_status, page_count")
    .eq("id", input.documentId)
    .maybeSingle();

  if (!document) throw new Error("Документ не найден");

  if (document.ocr_status !== "done") {
    throw new Error(
      `Документ ещё не распознан (${document.ocr_status}) — сначала задача ocr`
    );
  }

  /*
   * Страницы по одной, а не `document_text` целиком: только так видно, где
   * остановиться, и только так можно честно сказать, сколько просмотрено.
   */
  const { data: pages, error: pagesError } = await supabase
    .from("document_pages")
    .select("page, text")
    .eq("document_id", input.documentId)
    .order("page", { ascending: true });

  if (pagesError) {
    throw new Error(`Не удалось прочитать страницы: ${pagesError.message}`);
  }

  const rows = (pages ?? []) as { page: number; text: string | null }[];
  const pagesTotal = document.page_count ?? rows.length;

  const parts: string[] = [];
  let chars = 0;
  let pagesLooked = 0;

  for (const row of rows) {
    const text = (row.text ?? "").trim();
    pagesLooked += 1;

    // Пустая страница места не занимает, но в счёт просмотренных идёт: иначе
    // «просмотрено 3 из 20» на скане с тремя пустыми листами вводит в
    // заблуждение сильнее, чем молчание.
    if (text.length === 0) continue;

    parts.push(`--- Страница ${row.page} ---\n${text}`);
    chars += text.length;

    if (chars >= CHAR_BUDGET) break;
  }

  if (parts.length === 0) {
    throw new Error("В распознанном документе пусто — реквизиты брать неоткуда");
  }

  const text = parts.join("\n\n");

  /* --- 2. Описание реквизитов ------------------------------------ */

  const { data: type } = await supabase
    .from("entity_types")
    .select("label, fields")
    .eq("id", input.typeId)
    .maybeSingle();

  if (!type) throw new Error("Тип объекта не найден");

  const fields = (type.fields ?? []) as FieldSpec[];

  if (fields.length === 0) {
    throw new Error(
      `У типа «${type.label}» не описано ни одного реквизита — искать нечего`
    );
  }

  const prompt = buildExtractPrompt(String(type.label), fields, {
    looked: pagesLooked,
    total: pagesTotal,
  });

  /* --- 3. Модель -------------------------------------------------- */

  /*
   * Класс модели — обычный текстовый, а не vision: на входе строка. Это же
   * позволяет брать модель подешевле там, где документ короткий.
   */
  const result = await complete(
    job.model ?? Deno.env.get("LLM_MODEL_FAST") ?? "",
    [
      { role: "system", content: prompt },
      {
        role: "user",
        content: `Документ «${document.title}», распознанный текст:\n\n${text}`,
      },
    ],
    {
      json: true,
      sessionId: job.id,
      timeoutMs: Math.max(
        MIN_WAIT_MS,
        run.hardStop - Date.now() - WRITE_RESERVE_MS
      ),
    }
  );

  const answer = parseJson<ModelAnswer>(result.text);

  /* --- 4. Карточка объекта ---------------------------------------- */

  const known = new Map(fields.map((field) => [field.key, field]));

  const data: Record<string, string> = {};
  const uncertain: string[] = [];
  const accepted: {
    key: string;
    label: string;
    value: string;
    uncertain: boolean;
    page: number | null;
  }[] = [];

  for (const field of answer.fields ?? []) {
    // Ключи, которых нет в схеме, отбрасываем: модель могла придумать своё.
    const spec = known.get(field.key);
    if (!spec) continue;

    const value = String(field.value ?? "").trim();
    if (value.length === 0) continue;

    const isUncertain = (field.confidence ?? 0) < CONFIDENCE_THRESHOLD;

    data[field.key] = value;
    if (isUncertain) uncertain.push(field.key);

    accepted.push({
      key: field.key,
      label: spec.label,
      value,
      uncertain: isUncertain,
      page: typeof field.page === "number" ? field.page : null,
    });
  }

  /*
   * Объект создаётся с проставленными реквизитами. Список ошибок валидации
   * пересчитает триггер `entities_validate` — мы его не пишем и не можем:
   * иначе модель получила бы возможность объявить объект валидным.
   */
  const { data: created, error: insertError } = await supabase
    .from("entities")
    .insert({
      workspace_id: job.workspace_id,
      case_id: input.caseId,
      type_id: input.typeId,
      data,
      uncertain_fields: uncertain,
      created_by: null,
    })
    .select("id")
    .single();

  if (insertError || !created) {
    throw new Error(
      `Не удалось создать объект: ${insertError?.message ?? "ответа нет"}`
    );
  }

  await supabase.from("activity").insert({
    workspace_id: job.workspace_id,
    case_id: input.caseId,
    kind: "ai",
    text: `Реквизиты извлечены из «${document.title}»`,
    actor_id: null,
    meta: { job_id: job.id, entity_id: created.id, uncertain },
  });

  /*
   * Наружу отдаём то, что действительно легло в карточку, а не сырой ответ
   * модели: интерфейс показывает именно это, и расхождение между показанным и
   * сохранённым — худший вид неправды, какой тут можно допустить.
   *
   * `entityId` обязателен: без него шторке некуда вести человека.
   */
  const missing = (answer.missing ?? []).filter((key) => known.has(key));

  return {
    output: {
      entityId: created.id,
      fields: accepted,
      missing,
      pagesLooked,
      pagesTotal,
    },
    tokensIn: result.tokensIn,
    tokensOut: result.tokensOut,
    cost: result.cost,
  };
}
