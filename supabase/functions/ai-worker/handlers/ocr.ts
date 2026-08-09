import { complete } from "../../_shared/llm.ts";
import type { HandlerResult, Job } from "../index.ts";

/**
 * Распознавание документа. Ровно одна операция на файл.
 *
 * Всё остальное — извлечение реквизитов, разбор по пунктам, ассистент, поиск —
 * работает с текстом из `document_pages`, а не с картинками. Страница
 * картинкой стоит примерно как тысяча токенов текста, а один и тот же договор
 * открывают многократно: сперва достают реквизиты, потом разбирают, потом
 * ищут в нём условие. Платить за это по разу — единственный разумный вариант.
 *
 * Порядок:
 *   1. тот же файл уже распознан в этом пространстве? — копируем текст;
 *   2. в файле есть текстовый слой? — берём его, модель не нужна;
 *   3. иначе постранично: картинка → vision-модель → строка в базе.
 *
 * Каждая страница пишется сразу после распознавания. Обрыв на семидесятой
 * странице из восьмидесяти не обесценивает работу: повтор начнёт с
 * семьдесят первой.
 */

interface OcrInput {
  documentId: string;
  /** Продолжить с конкретной страницы. Пусто — сначала или с места обрыва. */
  fromPage?: number;
}

/** Сколько страниц отправляем в модель за один вызов. */
const PAGES_PER_CALL = 1;

const OCR_PROMPT = `Перенеси в текст всё, что написано на странице документа.

Правила:
1. Сохраняй порядок и структуру: заголовки, нумерацию пунктов, таблицы строками.
2. Ничего не сокращай, не пересказывай и не исправляй — это не пересказ, а перенос.
3. Числа, номера и даты переноси посимвольно: именно они потом попадут в документы.
4. Печати, подписи и штампы отмечай как [печать], [подпись] с расшифровкой, если читается.
5. Если страница пустая или нечитаемая — верни пустую строку.

Верни только текст страницы, без пояснений и без обрамления.`;

export async function runOcr(
  job: Job,
  supabase: ReturnType<typeof import("jsr:@supabase/supabase-js@2").createClient>
): Promise<HandlerResult> {
  const input = job.input as unknown as OcrInput;

  /* --- 1. Тот же файл уже распознан ------------------------------- */

  const { data: reused } = await supabase.rpc("reuse_document_text", {
    target_document: input.documentId,
  });

  if (typeof reused === "number" && reused > 0) {
    /*
     * Совпадение по отпечатку содержимого. Ни одного вызова модели — и это
     * самый частый случай в жизни: типовой договор загружают в каждое дело.
     */
    return {
      output: { pages: reused, source: "reused", spent: false },
      tokensIn: 0,
      tokensOut: 0,
      costUsd: 0,
    };
  }

  /* --- 2. Файл ---------------------------------------------------- */

  const { data: document } = await supabase
    .from("documents")
    .select("bucket, path, title, mime_type, page_count, pages_done")
    .eq("id", input.documentId)
    .maybeSingle();

  if (!document?.path) {
    throw new Error("У документа нет файла — распознавать нечего");
  }

  await supabase
    .from("documents")
    .update({ ocr_status: "running" })
    .eq("id", input.documentId);

  const { data: signed, error: signError } = await supabase.storage
    .from(document.bucket ?? "case-documents")
    .createSignedUrl(document.path, 3600);

  if (signError || !signed) {
    throw new Error(`Не удалось получить файл: ${signError?.message}`);
  }

  /*
   * Число страниц и картинки страниц даёт рендер PDF. В Deno это внешняя
   * библиотека; пока она не подключена, работаем с одностраничными
   * изображениями — сканы выписок обычно именно такие.
   *
   * ЗАГЛУШКА: заменить на настоящий рендер при подключении библиотеки.
   */
  const totalPages = document.page_count ?? 1;
  const startPage = Math.max(input.fromPage ?? 1, (document.pages_done ?? 0) + 1);

  if (document.page_count === null) {
    await supabase
      .from("documents")
      .update({ page_count: totalPages })
      .eq("id", input.documentId);
  }

  /* --- 3. Постранично --------------------------------------------- */

  const model = job.model ?? Deno.env.get("LLM_MODEL_VISION") ?? "";
  let tokensIn = 0;
  let tokensOut = 0;
  let cost = 0;

  for (let page = startPage; page <= totalPages; page += PAGES_PER_CALL) {
    const result = await complete(
      model,
      [
        { role: "system", content: OCR_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: `Страница ${page} из ${totalPages}` },
            { type: "image_url", image_url: { url: signed.signedUrl } },
          ],
        },
      ],
      { temperature: 0 }
    );

    // Страница ложится в базу сразу: обрыв не обнуляет уже сделанное.
    await supabase.rpc("save_document_page", {
      target_document: input.documentId,
      page_number: page,
      page_text: result.text,
      used_model: model,
      page_confidence: null,
    });

    tokensIn += result.tokensIn;
    tokensOut += result.tokensOut;
    cost += result.costUsd ?? 0;

    // Прогресс честный: «страница 34 из 80», а не полоска по таймеру.
    await supabase
      .from("ai_jobs")
      .update({ progress: Math.round((page / totalPages) * 100) })
      .eq("id", job.id);
  }

  await supabase
    .from("documents")
    .update({ ocr_status: "done", text_source: "vision" })
    .eq("id", input.documentId);

  return {
    output: { pages: totalPages, source: "vision", spent: true },
    tokensIn,
    tokensOut,
    costUsd: cost || null,
  };
}
