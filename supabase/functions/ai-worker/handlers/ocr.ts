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

/**
 * Сколько страниц уходит в модель одновременно.
 *
 * Здесь всё и ускоряется. Ожидание ответа не тратит процессор: пока модель
 * читает одну страницу, ничто не мешает ей читать ещё девять. Сто страниц по
 * пятьдесят пять секунд последовательно — это полтора часа; волнами по
 * десять — четверть от этого.
 *
 * Ограничение двойное, и второе оказалось жёстче первого.
 *
 * Со стороны поставщика: слишком широкая волна упирается в предел частоты и
 * возвращается отказами.
 *
 * Со стороны площадки: у Edge Function есть предел процессорного времени, а не
 * только общего. Замер «пятьдесят миллисекунд на страницу», из которого раньше
 * выводилась десятка, не учитывал самого дорогого — отрисовки страницы PDF в
 * картинку. На боевом проекте это стоило ста пятидесяти пяти вызовов подряд,
 * каждый из которых площадка убивала через четыре секунды с «CPU Time
 * exceeded», а задание оставалось висеть в работе с нулём готовых страниц.
 *
 * Отсюда двойка по умолчанию: волна должна успеть отрисоваться и отчитаться.
 * Значение поднимается переменной `OCR_CONCURRENCY`, но поднимать его стоит,
 * только глядя в журнал функции: там сразу видно, добирается ли она до конца.
 */
const CONCURRENCY = Number(Deno.env.get("OCR_CONCURRENCY") ?? 2);

/**
 * Сколько времени должно остаться, чтобы начинать новую волну.
 *
 * Страница читается около пятидесяти пяти секунд. Начать волну и оборваться
 * посередине — худший из исходов: за прерванный запрос поставщик деньги
 * возьмёт, а текста мы не получим.
 */
const MIN_WAVE_MS = 70_000;

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
      cost: 0,
    };
  }

  /* --- 2. Файл ---------------------------------------------------- */

  const { data: document } = await supabase
    .from("documents")
    .select("bucket, path, title, mime_type")
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
      ? await recognizePdf(bytes, job, supabase, run, input.documentId)
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
  documentId: string
): Promise<HandlerResult> {
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
     * Что уже прочитано — спрашиваем у базы списком, а не считаем по числу
     * готовых страниц.
     *
     * Разница принципиальная. Страницы уходят в модель пачкой, и в пачке одна
     * может не получиться, а соседние — получиться. Тогда в прочитанном
     * образуется дыра, и «сколько готово» перестаёт отвечать на вопрос
     * «с какой продолжать». Список отвечает на него всегда.
     */
    const { data: savedRows } = await supabase
      .from("document_pages")
      .select("page")
      .eq("document_id", documentId);

    const saved = new Set<number>((savedRows ?? []).map((row) => row.page));

    let reported = -1;

    /*
     * Прогресс честный: «страница 34 из 80», а не полоска, ползущая по
     * таймеру. Записываем только когда изменился процент — у документа в
     * триста страниц, читаемых из текстового слоя, обновление на каждой
     * удвоило бы число обращений к базе ради одной и той же цифры.
     */
    const reportProgress = async () => {
      const percent = Math.round((saved.size / total) * 100);
      if (percent === reported) return;
      reported = percent;
      await supabase
        .from("ai_jobs")
        .update({ progress: percent })
        .eq("id", job.id);
    };

    /** Сколько осталось до того, как исполнителя погасят. */
    const remaining = () => run.hardStop - Date.now();

    let page = 1;
    let failures = 0;

    while (page <= total) {
      /*
       * Новую волну начинаем, только если на неё заведомо хватит времени.
       * Начать и оборваться посередине — худший исход: за прерванный запрос
       * поставщик всё равно возьмёт деньги, а текста мы не получим.
       */
      if (run.pages <= 0 || remaining() < MIN_WAVE_MS) break;

      /* --- набираем волну ------------------------------------------ */

      const wave: { page: number; dataUrl: string }[] = [];

      while (page <= total && wave.length < CONCURRENCY && run.pages > 0) {
        const current = page;
        page += 1;

        // Страница уже прочитана: либо этим запуском, либо предыдущим.
        if (saved.has(current)) continue;

        const layer = pdf.text(current);

        if (layer.length >= TEXT_LAYER_MIN_CHARS) {
          // Ни рисования, ни модели — волну эта страница не занимает.
          await savePage(supabase, documentId, current, layer, null, "embedded");
          saved.add(current);
          continue;
        }

        run.pages -= 1;
        const image = await pdf.render(current);

        if (image.ink < BLANK_INK) {
          // Чистый лист. Спрашивать у модели, что на нём написано, незачем.
          await savePage(supabase, documentId, current, "", null, "blank");
          saved.add(current);
          continue;
        }

        wave.push({ page: current, dataUrl: image.dataUrl });
      }

      await reportProgress();

      if (wave.length === 0) continue;

      /* --- волна уходит в модель разом ----------------------------- */

      /*
       * Здесь всё и ускоряется. Ожидание ответа процессор не тратит: пока
       * модель читает одну страницу, ничто не мешает ей читать ещё девять.
       * Последовательно сто страниц по пятьдесят секунд — это полтора часа;
       * волнами по десять — четверть от этого.
       *
       * Срок каждого запроса подрезан по остатку времени: ответ, который
       * придёт после того, как исполнителя погасят, никому не нужен.
       */
      const deadline = Math.min(PAGE_TIMEOUT_MS, Math.max(remaining() - 5_000, 1_000));

      const answers = await Promise.allSettled(
        wave.map((item) =>
          complete(
            model,
            [
              { role: "system", content: OCR_PROMPT },
              {
                role: "user",
                content: [
                  { type: "text", text: `Страница ${item.page} из ${total}` },
                  { type: "image_url", image_url: { url: item.dataUrl } },
                ],
              },
            ],
            { temperature: 0, timeoutMs: deadline, sessionId: job.id }
          )
        )
      );

      /* --- записываем, что получилось ------------------------------ */

      for (const [index, answer] of answers.entries()) {
        const item = wave[index];
        if (!item) continue;

        if (answer.status === "rejected") {
          /*
           * Одна страница не далась — остальные из волны не виноваты. Дыру
           * закроет следующий запуск: он спросит у базы, чего не хватает.
           */
          failures += 1;
          console.error(`страница ${item.page} не распознана:`, answer.reason);
          continue;
        }

        await savePage(
          supabase,
          documentId,
          item.page,
          answer.value.text,
          model,
          "vision"
        );
        saved.add(item.page);

        /*
         * Расход записываем сразу, а не в конце задания: деньги за эту
         * страницу потрачены независимо от того, чем кончится следующая.
         */
        await supabase.rpc("record_job_spend", {
          job_id: job.id,
          tokens_in: answer.value.tokensIn,
          tokens_out: answer.value.tokensOut,
          cost: answer.value.cost,
        });
      }

      await reportProgress();

      /*
       * Волна не дала ни одной страницы — дело не в отдельном файле, а в
       * поставщике: кончились деньги, отозван ключ, лежит модель. Продолжать
       * значит методично оплачивать неудачи, поэтому отдаём ошибку наверх, и
       * очередь решит, повторять ли.
       */
      if (!answers.some((answer) => answer.status === "fulfilled")) {
        const first = answers[0];
        throw new Error(
          first && first.status === "rejected"
            ? String(first.reason)
            : "Ни одна страница волны не распознана"
        );
      }
    }

    const done = saved.size >= total;

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
    const source = paid === 0 ? "embedded" : paid === saved.size ? "vision" : "mixed";

    if (done) {
      await supabase
        .from("documents")
        .update({ ocr_status: "done", text_source: source })
        .eq("id", documentId);
    }

    /*
     * Незакрытые страницы — не повод объявлять задание неудачным: оно
     * вернётся в очередь и доберёт их следующим запуском. Неудачным его
     * сделает только полностью провалившаяся волна, а это уже другой случай.
     */
    if (failures > 0) {
      console.error(`страниц не далось: ${failures}, вернёмся к ним следующим запуском`);
    }

    return {
      output: { pages: saved.size, billedPages: paid, source },
      unfinished: !done,
      progress: Math.round((saved.size / total) * 100),
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
    { temperature: 0, timeoutMs: PAGE_TIMEOUT_MS, sessionId: job.id }
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
    cost: answer.cost,
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

