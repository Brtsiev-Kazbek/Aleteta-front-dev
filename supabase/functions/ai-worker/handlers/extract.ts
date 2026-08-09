import { complete, parseJson } from "../../_shared/llm.ts";
import type { HandlerResult, Job } from "../index.ts";

/**
 * Извлечение реквизитов из документа.
 *
 * Про очередь и повторы обработчик не знает ничего: получает задание,
 * возвращает результат. Упал — исполнитель сам решит, повторять или гасить.
 *
 * Порядок работы:
 *   1. файл из хранилища → подписанная ссылка;
 *   2. описание реквизитов типа объекта → в промпт;
 *   3. vision-модель читает документ как картинку;
 *   4. ответ разбирается и ложится в карточку объекта;
 *   5. валидность считает триггер базы, а не мы.
 */

interface ExtractInput {
  documentId: string;
  caseId: string;
  typeId: string;
}

interface FieldSpec {
  key: string;
  label: string;
  required: boolean;
  pattern?: string;
  placeholder?: string;
}

interface ModelAnswer {
  fields: { key: string; value: string; confidence: number; page?: number }[];
  missing: string[];
}

/** Ниже этого порога значение подставляется, но помечается как непроверенное. */
const CONFIDENCE_THRESHOLD = 0.75;

export async function runExtract(
  job: Job,
  supabase: ReturnType<typeof import("jsr:@supabase/supabase-js@2").createClient>
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
    .select("title, ocr_status, pages_done")
    .eq("id", input.documentId)
    .maybeSingle();

  if (!document) throw new Error("Документ не найден");

  if (document.ocr_status !== "done") {
    throw new Error(
      `Документ ещё не распознан (${document.ocr_status}) — сначала задача ocr`
    );
  }

  const { data: text } = await supabase.rpc("document_text", {
    target_document: input.documentId,
  });

  if (!text || String(text).trim().length === 0) {
    throw new Error("В распознанном документе пусто — реквизиты брать неоткуда");
  }

  /* --- 2. Описание реквизитов ------------------------------------ */

  const { data: type } = await supabase
    .from("entity_types")
    .select("label, fields")
    .eq("id", input.typeId)
    .maybeSingle();

  if (!type) throw new Error("Тип объекта не найден");

  const fields = (type.fields ?? []) as FieldSpec[];

  /*
   * Промпт собирается из полей конкретного типа — поэтому пользовательские
   * типы работают без единой правки кода. Текст держим здесь же, а не тянем
   * из приложения: функция должна выполняться, даже когда приложение не
   * отвечает.
   */
  const fieldList = fields
    .map((field) => {
      const parts = [`- ${field.key} — ${field.label}`];
      if (field.required) parts.push("обязательное");
      if (field.pattern) parts.push(`формат: ${field.pattern}`);
      return parts.join("; ");
    })
    .join("\n");

  const prompt = `Ты извлекаешь реквизиты из российского документа в карточку объекта «${type.label}».

Нужно найти:
${fieldList}

Правила:
1. Бери только то, что действительно написано в документе. Ничего не додумывай —
   пустое поле лучше выдуманного.
2. Значение переноси дословно, сохраняя формат оригинала.
3. Для каждого поля укажи уверенность от 0 до 1 и номер страницы.
4. Поля, которого в документе нет, не включай в fields — впиши ключ в missing.

Ответ — JSON: {"fields":[{"key":"...","value":"...","confidence":0.0,"page":1}],"missing":["..."]}`;

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
    { json: true }
  );

  const answer = parseJson<ModelAnswer>(result.text);

  /* --- 4. Карточка объекта ---------------------------------------- */

  const known = new Set(fields.map((field) => field.key));

  const data: Record<string, string> = {};
  const uncertain: string[] = [];

  for (const field of answer.fields ?? []) {
    // Ключи, которых нет в схеме, отбрасываем: модель могла придумать своё.
    if (!known.has(field.key)) continue;

    data[field.key] = String(field.value ?? "").trim();
    if ((field.confidence ?? 0) < CONFIDENCE_THRESHOLD) {
      uncertain.push(field.key);
    }
  }

  /*
   * Объект создаётся с проставленными реквизитами. Список ошибок валидации
   * пересчитает триггер `entities_validate` — мы его не пишем и не можем:
   * иначе модель получила бы возможность объявить объект валидным.
   */
  const { error: insertError } = await supabase.from("entities").insert({
    workspace_id: job.workspace_id,
    case_id: input.caseId,
    type_id: input.typeId,
    data,
    uncertain_fields: uncertain,
    created_by: null,
  });

  if (insertError) {
    throw new Error(`Не удалось создать объект: ${insertError.message}`);
  }

  await supabase.from("activity").insert({
    workspace_id: job.workspace_id,
    case_id: input.caseId,
    kind: "ai",
    text: `Реквизиты извлечены из «${document.title}»`,
    actor_id: null,
    meta: { job_id: job.id, uncertain },
  });

  return {
    output: { fields: answer.fields ?? [], missing: answer.missing ?? [] },
    tokensIn: result.tokensIn,
    tokensOut: result.tokensOut,
    costUsd: result.costUsd,
  };
}
