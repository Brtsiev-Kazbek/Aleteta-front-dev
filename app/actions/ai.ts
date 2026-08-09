"use server";

import {
  actionError,
  actionFail,
  actionOk,
  type ActionResult,
} from "@/lib/actions/result";
import { enqueueJob, readJob, recordCorrection } from "@/lib/ai/jobs";
import { isLlmConfigured } from "@/lib/ai/config";
import type {
  ExtractInput,
  JobState,
  OcrInput,
  TypedTask,
} from "@/lib/ai/types";

/**
 * Действия для форм, работающих с моделью.
 *
 * Все они тонкие и обязаны такими остаться: проверить права, положить строку в
 * очередь, вернуться. Ни одного вызова модели отсюда быть не должно — даже
 * быстрого. Сегодня операция укладывается в секунду, завтра в промпт добавили
 * примеров, и она падает по тайм-ауту у половины пользователей.
 */

/** Настроена ли работа с моделью — интерфейс прячет кнопки, если нет. */
export async function isAiAvailableAction(): Promise<boolean> {
  return isLlmConfigured();
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
    const result = await enqueueJob("extract", input, {
      caseId: input.caseId,
      documentId: input.documentId,
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
