"use server";

import {
  actionError,
  actionFail,
  actionOk,
  type ActionResult,
} from "@/lib/actions/result";
import { enqueueJob, readJob, recordCorrection } from "@/lib/ai/jobs";
import { isLlmConfigured } from "@/lib/ai/config";
import { requireSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { createLogger, shortId } from "@/lib/logger";
import type { RecognizedPage, SearchHit } from "@/types";
import type { JobStatus, OcrStatus } from "@/types/rows";
import type {
  ExtractInput,
  JobState,
  OcrInput,
  TypedTask,
} from "@/lib/ai/types";

const log = createLogger("ai");

/**
 * Действия для форм, работающих с моделью.
 *
 * Все они тонкие и обязаны такими остаться: проверить права, положить строку в
 * очередь, вернуться. Ни одного вызова модели отсюда быть не должно — даже
 * быстрого. Сегодня операция укладывается в секунду, завтра в промпт добавили
 * примеров, и она падает по тайм-ауту у половины пользователей.
 */

/**
 * Что из работы с моделью настроено, а что нет.
 *
 * По операции, а не одним флагом: модели задаются по одной, и человек,
 * заполнивший `LLM_MODEL_VISION` и ничего больше, вправе пользоваться
 * распознаванием. Общая проверка закрывала бы ему и то, что работает.
 *
 * Интерфейс по этим двум флагам гасит пункты меню. Без них человек узнаёт об
 * отсутствующей переменной, только нажав кнопку и подождав, — а отказ, который
 * можно было показать заранее, показанный после, читается как поломка.
 */
export async function getAiCapabilitiesAction(): Promise<AiCapabilities> {
  return {
    // Распознавание держится на модели, читающей картинки.
    recognition: isLlmConfigured("vision"),
    // Извлечение работает с распознанным текстом — картинки ему не нужны.
    extraction: isLlmConfigured("fast"),
  };
}

export interface AiCapabilities {
  recognition: boolean;
  extraction: boolean;
}

/**
 * Распознавание документа — ровно одна операция на файл.
 *
 * Ставится сразу после загрузки. Всё остальное — извлечение реквизитов,
 * разбор по пунктам, ассистент — читает уже её результат, а не картинки:
 * страница картинкой стоит примерно как тысяча токенов текста, а один и тот
 * же договор открывают многократно.
 */
export async function recognizeDocumentAction(
  input: OcrInput
): Promise<ActionResult<{ jobId: string; fromCache: boolean }>> {
  if (!input.documentId) return actionFail("Не указан документ.");

  try {
    const result = await enqueueJob("ocr", input, {
      documentId: input.documentId,
    });

    log.info("recognize", {
      документ: shortId(input.documentId),
      задание: shortId(result.jobId),
      изЖурнала: result.fromCache,
    });

    return actionOk(result);
  } catch (caught) {
    return actionError(caught, "Не удалось поставить распознавание в очередь.");
  }
}

/** Разбор файла: реквизиты в карточку объекта. Требует распознанного текста. */
export async function extractFromDocumentAction(
  input: ExtractInput
): Promise<ActionResult<{ jobId: string; fromCache: boolean }>> {
  if (!input.documentId || !input.caseId || !input.typeId) {
    return actionFail("Не хватает данных для разбора: файл, дело или тип объекта.");
  }

  try {
    await requireSession();

    /*
     * Тип проверяем здесь, а файл и дело — в `enqueueJob`: там они нужны всем
     * задачам, а тип только этой. Проверка та же по сути — читаем под правами
     * вошедшего, и чужой тип просто не находится.
     *
     * Без неё исполнитель, работающий служебной ролью, собрал бы промпт из
     * описания чужого типа. Вставку карточки триггер всё равно отбил бы, но
     * задание к тому моменту уже сходило бы в модель — за деньги и впустую.
     */
    const supabase = createClient();
    const { data: type, error } = await supabase
      .from("entity_types")
      .select("id")
      .eq("id", input.typeId)
      .maybeSingle();

    if (error) return actionFail(error.message);
    if (!type) return actionFail("Тип объекта не найден или недоступен.");

    const result = await enqueueJob("extract", input, {
      caseId: input.caseId,
      documentId: input.documentId,
    });

    log.info("extract", {
      документ: shortId(input.documentId),
      дело: shortId(input.caseId),
      тип: shortId(input.typeId),
      задание: shortId(result.jobId),
      изЖурнала: result.fromCache,
    });

    return actionOk(result);
  } catch (caught) {
    return actionError(caught, "Не удалось поставить разбор в очередь.");
  }
}

/**
 * Состояние задания. Форма опрашивает его, пока работа идёт.
 *
 * Опрос, а не подписка: заданий у человека единицы, а живое соединение стоит
 * дороже и рвётся на мобильной сети. Когда операций станет много, здесь
 * появится realtime — интерфейсу это изменение не видно.
 */
export async function getJobStateAction<T extends TypedTask>(
  jobId: string
): Promise<ActionResult<JobState<T> | null>> {
  try {
    return actionOk(await readJob<T>(jobId));
  } catch (caught) {
    return actionError(caught, "Не удалось прочитать состояние задания.");
  }
}

/**
 * Состояние распознавания одного документа.
 *
 * Одним запросом, а не двумя: интерфейс опрашивает его, пока идёт работа, и
 * лишний круг до сервера на каждом опросе стоит дороже, чем чуть более широкая
 * выборка. Здесь и прогресс по страницам, и ошибка задания, если оно упало.
 */
export async function getRecognitionAction(
  documentId: string
): Promise<ActionResult<RecognitionState | null>> {
  try {
    await requireSession();
    const supabase = createClient();

    const { data: document, error } = await supabase
      .from("documents")
      .select("ocr_status, pages_done, page_count, text_source")
      .eq("id", documentId)
      .maybeSingle();

    if (error) return actionFail(error.message);
    if (!document) return actionOk(null);

    /*
     * Задание берём последнее по времени: у длинного документа их несколько —
     * первая попытка, возвраты в очередь после перерыва, повтор после сбоя.
     * Показывать надо то, что происходит сейчас.
     */
    const { data: job } = await supabase
      .from("ai_jobs")
      .select("id, status, progress, error")
      .eq("document_id", documentId)
      .eq("task", "ocr")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    log.debug("state", {
      документ: shortId(documentId),
      состояние: document.ocr_status,
      страниц: `${document.pages_done}/${document.page_count ?? "?"}`,
      задание: job ? `${shortId(job.id)}:${job.status}` : "нет",
    });

    return actionOk({
      ocrStatus: document.ocr_status,
      pagesDone: document.pages_done,
      pageCount: document.page_count,
      textSource: document.text_source,
      job: job
        ? {
            jobId: job.id,
            status: job.status,
            progress: job.progress,
            error: job.error,
          }
        : null,
    });
  } catch (caught) {
    return actionError(caught, "Не удалось узнать состояние распознавания.");
  }
}

export interface RecognitionState {
  ocrStatus: OcrStatus;
  pagesDone: number;
  pageCount: number | null;
  textSource: string | null;
  job: {
    jobId: string;
    status: JobStatus;
    progress: number;
    error: string | null;
  } | null;
}

/**
 * Распознанный текст документа.
 *
 * Читается под правами пользователя: чужой документ просто не найдётся. Нужен
 * человеку, чтобы убедиться своими глазами, что модель прочитала файл верно —
 * без этого доверять извлечённым реквизитам не за что.
 */
export async function getDocumentTextAction(
  documentId: string,
  range: { from?: number; to?: number } = {}
): Promise<ActionResult<string>> {
  try {
    await requireSession();
    const supabase = createClient();

    const { data, error } = await supabase.rpc("document_text", {
      target_document: documentId,
      from_page: range.from ?? 1,
      to_page: range.to ?? 10000,
    });

    if (error) return actionFail(error.message);

    log.debug("text", {
      документ: shortId(documentId),
      символов: (data ?? "").length,
    });

    return actionOk(data ?? "");
  } catch (caught) {
    return actionError(caught, "Не удалось прочитать распознанный текст.");
  }
}

/**
 * Распознанный текст постранично.
 *
 * `getDocumentTextAction` склеивает всё в одну простыню — это нужно тому, кто
 * будет текст читать. А тому, кто его проверяет, нужно обратное: увидеть
 * границы страниц и происхождение каждой. Страница, прочитанная моделью, и
 * страница, взятая из текстового слоя, — разного доверия: во второй ошибиться
 * попросту нечему, а первую стоит сверить с оригиналом.
 *
 * Отсюда же видно и дыры. Волна из десяти страниц может принести девять: одна
 * не получилась и ушла на второй заход. Пока она не вернулась, в списке видно,
 * какой именно страницы не хватает.
 */
export async function getDocumentPagesAction(
  documentId: string
): Promise<ActionResult<RecognizedPage[]>> {
  try {
    await requireSession();
    const supabase = createClient();

    const { data, error } = await supabase
      .from("document_pages")
      .select("page, text, source, model, confidence")
      .eq("document_id", documentId)
      .order("page", { ascending: true });

    if (error) return actionFail(error.message);

    return actionOk(
      (data ?? []).map((row) => ({
        page: row.page,
        text: row.text,
        source: row.source,
        model: row.model,
        confidence: row.confidence,
      }))
    );
  } catch (caught) {
    return actionError(caught, "Не удалось прочитать страницы документа.");
  }
}

/**
 * Поиск по распознанному тексту.
 *
 * Юрист ищет не документ, а условие: «где у нас про неустойку 0,1 %». Поэтому
 * ищем по страницам и возвращаем фрагмент — ответ «нашлось в договоре аренды»
 * бесполезен, если в договоре сорок страниц.
 *
 * Права проверяет база: функция объявлена `security invoker`, и политики
 * `document_pages` работают как обычно. Чужая страница не найдётся, даже если
 * слово в ней есть.
 */
export async function searchDocumentTextAction(
  query: string,
  documentId: string | null = null
): Promise<ActionResult<SearchHit[]>> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return actionOk([]);

  try {
    await requireSession();
    const supabase = createClient();

    const { data, error } = await supabase.rpc("search_document_text", {
      query: trimmed,
      target_document: documentId ?? undefined,
      limit_count: 40,
    });

    if (error) return actionFail(error.message);

    log.info("search", { запрос: trimmed, найдено: (data ?? []).length });

    return actionOk(
      (data ?? []).map((row) => ({
        documentId: row.document_id,
        documentTitle: row.document_title,
        page: row.page,
        fragment: row.fragment,
      }))
    );
  } catch (caught) {
    return actionError(caught, "Не удалось выполнить поиск.");
  }
}

/** Правка человека поверх ответа модели — она же разметка для обучения. */
export async function recordCorrectionAction(
  jobId: string,
  correction: unknown
): Promise<ActionResult<null>> {
  try {
    await recordCorrection(jobId, correction);
    return actionOk(null);
  } catch (caught) {
    return actionError(caught, "Не удалось сохранить правку.");
  }
}
