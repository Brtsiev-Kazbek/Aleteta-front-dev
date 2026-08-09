import { complete, PAGE_TIMEOUT_MS } from "../../_shared/llm.ts";
import { imageDataUrl, looksLikePdf, openPdf } from "../../_shared/pdf.ts";
import type { HandlerResult, Job, Run } from "../index.ts";

/**
 * Распознавание документа. Ровно одна операция на файл.
 *
 * Всё остальное — извлечение реквизитов, разбор по пунктам, ассистент, поиск —
 * работает с текстом из `document_pages`, а не с картинками. Страница
 * картинкой стоит примерно как тысяча токенов текста, а один и тот же договор
 * открывают многократно: сперва достают реквизиты, потом разбирают, потом
 * ищут в нём условие. Платить за это по разу — единственный разумный вариант.
 *
 * Порядок — от самого дешёвого к самому дорогому:
 *   1. тот же файл уже распознан в этом пространстве — копируем текст;
 *   2. у страницы есть текстовый слой — читаем его, модель не нужна;
 *   3. страница пустая — записываем пустоту, модель тоже не нужна;
 *   4. и только скан уходит в vision-модель.
 *
 * На практике так выглядит экономия: договор из системы документооборота
 * обходится в ноль, у сшитого дела платными оказываются приложения-сканы, а не
 * весь том целиком.
 *
 * Каждая страница пишется сразу после распознавания. Обрыв на семидесятой
 * странице из восьмидесяти не обесценивает работу: следующий запуск начнёт с
 * семьдесят первой.
 */

interface OcrInput {
  documentId: string;
}

/**
 * Сколько символов текстового слоя считаем настоящим текстом.
 *
 * У скана слоя нет вовсе или в нём остаётся мелочь: колонтитул, штамп
 * сканера, номер страницы. Полтораста символов — примерно абзац, меньше
 * которого на странице делового документа не бывает.
 */
const TEXT_LAYER_MIN_CHARS = 150;

/**
 * Ниже этой доли закрашенных точек страница считается пустой.
 *
 * Порог намеренно почти нулевой, потому что ошибки здесь неравноценны.
 * Отправить пустой лист в модель — потерять стоимость одной страницы. Принять
 * непустой за пустой — молча потерять его содержимое, и никто об этом не
 * узнает. Для сравнения: строка текста на листе A4 — это около четверти
 * процента краски, то есть почти в десять раз больше порога.
 */
const BLANK_INK = 0.0003;

const OCR_PROMPT = `Перенеси в текст всё, что написано на странице документа.

Правила:
1. Сохраняй порядок и структуру: заголовки, нумерацию пунктов, таблицы строками.
2. Ничего не сокращай, не пересказывай и не исправляй — это не пересказ, а перенос.
3. Числа, номера и даты переноси посимвольно: именно они потом попадут в документы.
4. Печати, подписи и штампы отмечай как [печать], [подпись] с расшифровкой, если читается.
5. Если страница пустая или нечитаемая — верни пустую строку.

Верни только текст страницы, без пояснений и без обрамления.`;

type SupabaseClient = ReturnType<
  typeof import("jsr:@supabase/supabase-js@2").createClient
>;

export async function runOcr(
  job: Job,
  supabase: SupabaseClient,
  run: Run
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
      output: { pages: reused, billedPages: 0, source: "reused" },
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

  try {
    /*
     * Файл забираем целиком, а не подписанной ссылкой: рисовать страницы будем
     * здесь же, а движку нужны байты. Подписанная ссылка осталась бы нужна,
     * если бы картинку разбирала чужая сторона.
     */
    const { data: blob, error: downloadError } = await supabase.storage
      .from(document.bucket ?? "case-documents")
      .download(document.path);

    if (downloadError || !blob) {
      throw new Error(`Не удалось получить файл: ${downloadError?.message}`);
    }

    const bytes = new Uint8Array(await blob.arrayBuffer());

    return looksLikePdf(bytes)
      ? await recognizePdf(bytes, job, supabase, run, {
          documentId: input.documentId,
          pagesDone: document.pages_done ?? 0,
        })
      : await recognizeImage(
          bytes,
          job,
          supabase,
          document.mime_type,
          input.documentId
        );
  } catch (caught) {
    /*
     * Метка на документе, а не только в задании: интерфейс показывает её
     * рядом с файлом, и человек видит, что распознать не удалось, не заходя в
     * журнал. Следующая попытка вернёт состояние в `running`.
     */
    await supabase
      .from("documents")
      .update({ ocr_status: "failed" })
      .eq("id", input.documentId);

    throw caught;
  }
}

/* ------------------------------------------------------------------ */
/*  PDF                                                                */
/* ------------------------------------------------------------------ */

async function recognizePdf(
  bytes: Uint8Array,
  job: Job,
  supabase: SupabaseClient,
  run: Run,
  document: { documentId: string; pagesDone: number }
): Promise<HandlerResult> {
  const { documentId } = document;

  const pdf = await openPdf(bytes, {
    wasmUrl: Deno.env.get("PDFIUM_WASM_URL") ?? undefined,
  });

  try {
    const total = pdf.pageCount;

    await supabase
      .from("documents")
      .update({ page_count: total })
      .eq("id", documentId);

    const model = job.model ?? Deno.env.get("LLM_MODEL_VISION") ?? "";

    /*
     * Откуда продолжать, спрашивать не нужно: страницы пишутся по одной и по
     * порядку, поэтому сколько записано — оттуда и продолжаем. Это же чинит
     * повтор после падения: заново платить за уже разобранное не придётся.
     */
    let page = document.pagesDone + 1;
    let reported = -1;

    /*
     * Прогресс честный: «страница 34 из 80», а не полоска, ползущая по
     * таймеру. Записываем только когда изменился процент — у документа в
     * триста страниц, читаемых из текстового слоя, обновление на каждой
     * удвоило бы число обращений к базе ради одной и той же цифры.
     */
    const reportProgress = async (done: number) => {
      const percent = Math.round((done / total) * 100);
      if (percent === reported) return;
      reported = percent;
      await supabase
        .from("ai_jobs")
        .update({ progress: percent })
        .eq("id", job.id);
    };

    for (; page <= total; page += 1) {
      // Проверка в начале круга: тогда `page` всегда указывает на первую
      // несделанную страницу, и следующий запуск возьмёт ровно её.
      if (Date.now() >= run.deadline) break;

      /* --- текстовый слой: даром --------------------------------- */

      const layer = pdf.text(page);

      if (layer.length >= TEXT_LAYER_MIN_CHARS) {
        // Ни рисования, ни модели — бюджет страниц эта страница не тратит.
        await savePage(supabase, documentId, page, layer, null, "embedded");
        await reportProgress(page);
        continue;
      }

      /* --- дальше платно: сверяемся с бюджетом -------------------- */

      if (run.pages <= 0) break;
      run.pages -= 1;

      const image = await pdf.render(page);

      if (image.ink < BLANK_INK) {
        // Чистый лист. Спрашивать у модели, что на нём написано, незачем.
        await savePage(supabase, documentId, page, "", null, "blank");
        await reportProgress(page);
        continue;
      }

      const answer = await complete(
        model,
        [
          { role: "system", content: OCR_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: `Страница ${page} из ${total}` },
              { type: "image_url", image_url: { url: image.dataUrl } },
            ],
          },
        ],
        { temperature: 0, timeoutMs: PAGE_TIMEOUT_MS }
      );

      await savePage(supabase, documentId, page, answer.text, model, "vision");

      /*
       * Расход записываем сразу, а не в конце задания: деньги за эту страницу
       * потрачены независимо от того, чем кончится следующая.
       */
      await supabase.rpc("record_job_spend", {
        job_id: job.id,
        tokens_in: answer.tokensIn,
        tokens_out: answer.tokensOut,
        cost: answer.costUsd,
      });

      await reportProgress(page);
    }

    const recognized = page - 1;
    const done = page > total;

    /*
     * Сколько страниц в итоге ушло в модель, считаем по базе, а не по этому
     * запуску: длинный документ проходит через несколько запусков, и каждый из
     * них видит только свой кусок.
     */
    const { count: billed } = await supabase
      .from("document_pages")
      .select("*", { count: "exact", head: true })
      .eq("document_id", documentId)
      .eq("source", "vision");

    const paid = billed ?? 0;
    const source = paid === 0 ? "embedded" : paid === recognized ? "vision" : "mixed";

    if (done) {
      await supabase
        .from("documents")
        .update({ ocr_status: "done", text_source: source })
        .eq("id", documentId);
    }

    return {
      output: { pages: recognized, billedPages: paid, source },
      unfinished: !done,
      progress: Math.round((recognized / total) * 100),
    };
  } finally {
    // Память движка не освобождается сама: следующий документ придёт в тот же
    // процесс и лёг бы поверх этого.
    pdf.close();
  }
}

/* ------------------------------------------------------------------ */
/*  КАРТИНКА                                                           */
/* ------------------------------------------------------------------ */

/**
 * Снимок или фотография — всегда одна страница.
 *
 * Ни текстового слоя, ни разбивки: файл уходит в модель как есть. Проверять
 * пустоту здесь нечем и незачем — сфотографировать чистый лист специально
 * никто не станет.
 */
async function recognizeImage(
  bytes: Uint8Array,
  job: Job,
  supabase: SupabaseClient,
  mimeType: string | null,
  documentId: string
): Promise<HandlerResult> {
  if (mimeType && !mimeType.startsWith("image/")) {
    throw new Error(
      `Файл «${mimeType}» распознать пока нельзя: поддерживаются PDF и изображения`
    );
  }

  await supabase
    .from("documents")
    .update({ page_count: 1 })
    .eq("id", documentId);

  const model = job.model ?? Deno.env.get("LLM_MODEL_VISION") ?? "";

  const answer = await complete(
    model,
    [
      { role: "system", content: OCR_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: "Страница 1 из 1" },
          {
            type: "image_url",
            image_url: { url: imageDataUrl(bytes, mimeType ?? "image/jpeg") },
          },
        ],
      },
    ],
    { temperature: 0, timeoutMs: PAGE_TIMEOUT_MS }
  );

  await savePage(supabase, documentId, 1, answer.text, model, "vision");

  await supabase
    .from("documents")
    .update({ ocr_status: "done", text_source: "vision" })
    .eq("id", documentId);

  return {
    output: { pages: 1, billedPages: 1, source: "vision" },
    tokensIn: answer.tokensIn,
    tokensOut: answer.tokensOut,
    costUsd: answer.costUsd,
  };
}

/* ------------------------------------------------------------------ */
/*  МЕЛОЧИ                                                             */
/* ------------------------------------------------------------------ */

function savePage(
  supabase: SupabaseClient,
  documentId: string,
  page: number,
  text: string,
  model: string | null,
  source: "embedded" | "vision" | "blank"
) {
  return supabase.rpc("save_document_page", {
    target_document: documentId,
    page_number: page,
    page_text: text,
    used_model: model,
    page_confidence: null,
    page_source: source,
  });
}

