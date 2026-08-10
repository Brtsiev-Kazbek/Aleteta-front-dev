import {
  getDocumentPagesAction,
  getDocumentTextAction,
  getRecognitionAction,
  isAiAvailableAction,
  recognizeDocumentAction,
  searchDocumentTextAction,
  type RecognitionState,
} from "@/app/actions/ai";

import { createSync, isRemote } from "../sync";
import type { RecognitionSlice, SliceCreator } from "../types";

/**
 * Распознавание документов — первая операция модели, работающая по-настоящему.
 *
 * Остальное в приложении пока изображают таймеры из `store/demo.ts`. Здесь
 * ничего не изображается: задание ложится в очередь, его выполняет исполнитель
 * в Edge Function, а браузер лишь спрашивает, как идут дела.
 *
 * Отсюда два следствия, которых не бывает у имитации. Работа продолжается,
 * когда вкладка закрыта, — значит, вернувшись, надо не начинать заново, а
 * снова начать смотреть. И работа может не получиться — значит, у ошибки
 * должно быть место, где её видно.
 */

/** Как часто спрашиваем о ходе дела. */
const POLL_MS = 2_500;

/**
 * Сколько всего ждём одно распознавание.
 *
 * Восемнадцать страниц скана проходят несколькими заходами исполнителя, между
 * которыми задание ждёт в очереди, — четверть часа тут не предел. Но и ждать
 * вечно нельзя: подвисшее задание иначе оставит вкладку опрашивать сервер до
 * конца рабочего дня.
 */
const GIVE_UP_AFTER_MS = 30 * 60 * 1000;

/** Наблюдатели по документам. Вне состояния: их надо гасить, а не рисовать. */
const watchers = new Map<string, number>();

function stopWatching(documentId: string): void {
  const handle = watchers.get(documentId);
  if (handle !== undefined) window.clearInterval(handle);
  watchers.delete(documentId);
}

/** Дочитан ли документ: дальше следить не за чем. */
function isSettled(state: RecognitionState): boolean {
  return (
    state.ocrStatus === "done" ||
    state.ocrStatus === "failed" ||
    state.ocrStatus === "skipped"
  );
}

export const createRecognitionSlice: SliceCreator<RecognitionSlice> = (
  set,
  get
) => {
  const sync = createSync(set);

  /** Переносит ответ сервера в состояние: и в документ, и в задание. */
  function apply(documentId: string, state: RecognitionState): void {
    set((current) => ({
      documents: current.documents.map((document) =>
        document.id === documentId
          ? {
              ...document,
              ocrStatus: state.ocrStatus,
              pagesDone: state.pagesDone,
              pageCount: state.pageCount,
              textSource: state.textSource,
            }
          : document
      ),
      recognitionJobs: state.job
        ? { ...current.recognitionJobs, [documentId]: state.job }
        : current.recognitionJobs,
    }));
  }

  /**
   * Начинает следить за документом.
   *
   * Повторный вызов для того же файла ничего не портит: старый наблюдатель
   * гасится. Это важно — за один документ легко взяться дважды, открыв дело в
   * двух вкладках или нажав «распознать» повторно.
   */
  function watch(documentId: string): void {
    stopWatching(documentId);

    const startedAt = Date.now();

    const handle = window.setInterval(() => {
      void (async () => {
        if (Date.now() - startedAt > GIVE_UP_AFTER_MS) {
          stopWatching(documentId);
          set({
            syncError: `Распознавание «${
              get().documents.find((item) => item.id === documentId)?.title ??
              "документа"
            }» идёт слишком долго. Загляните в журнал заданий.`,
          });
          return;
        }

        const result = await getRecognitionAction(documentId);
        if (!result.ok || !result.data) return;

        apply(documentId, result.data);

        if (isSettled(result.data)) stopWatching(documentId);
      })();
    }, POLL_MS);

    watchers.set(documentId, handle);
  }

  return {
    recognitionJobs: {},
    isRecognitionAvailable: false,

    recognizeDocument: async (documentId) => {
      if (!isRemote(get)) return;

      /*
       * Состояние переводим в «в очереди» сразу, не дожидаясь ответа сервера.
       * Распознавание запускают руками, когда предыдущая попытка не удалась, —
       * и если строка после нажатия не меняется, человек нажимает ещё раз.
       */
      set((current) => ({
        documents: current.documents.map((document) =>
          document.id === documentId
            ? { ...document, ocrStatus: "pending", pagesDone: 0 }
            : document
        ),
      }));

      const enqueued = await sync(
        recognizeDocumentAction({ documentId }),
        { fallback: "Не удалось поставить распознавание в очередь." }
      );

      /*
       * Задание не создалось — чаще всего потому, что модель не настроена.
       * Оставить документ в «в очереди» было бы враньём: очереди никакой нет,
       * ждать нечего, а интерфейс при этом закрывает кнопку повтора. Поэтому
       * честно помечаем неудачей — тогда видно и ошибку, и как попробовать
       * снова.
       */
      if (!enqueued) {
        set((current) => ({
          documents: current.documents.map((document) =>
            document.id === documentId
              ? { ...document, ocrStatus: "failed" }
              : document
          ),
        }));
        return;
      }

      set((current) => ({
        recognitionJobs: {
          ...current.recognitionJobs,
          [documentId]: {
            jobId: enqueued.jobId,
            status: "queued",
            progress: 0,
            error: null,
          },
        },
      }));

      /*
       * Ответ из журнала — тот же файл уже распознавали, и текст готов. Ждать
       * нечего, но состояние подтянуть надо: пользователь должен увидеть
       * готовый документ, а не вечное «в очереди».
       */
      const state = await getRecognitionAction(documentId);
      if (state.ok && state.data) {
        apply(documentId, state.data);
        if (isSettled(state.data)) return;
      }

      watch(documentId);
    },

    resumeRecognition: async () => {
      if (!isRemote(get)) return;

      const available = await isAiAvailableAction();
      set({ isRecognitionAvailable: available });

      for (const document of get().documents) {
        if (document.ocrStatus !== "pending" && document.ocrStatus !== "running") {
          continue;
        }

        /*
         * «В очереди» без задания — файл, который загрузился, но поставить его
         * не вышло: в тот момент не была настроена модель или отказала сеть.
         * Очереди у него никакой нет, и сам он из этого состояния не выйдет.
         *
         * Ставим заново — молча, потому что для человека это не событие: он
         * файл загрузил, он вправе ожидать, что тот читается. Если и сейчас не
         * выйдет, документ пометится неудачей и покажет причину.
         */
        const state = await getRecognitionAction(document.id);

        if (
          available &&
          state.ok &&
          state.data &&
          state.data.ocrStatus === "pending" &&
          state.data.job === null
        ) {
          void get().recognizeDocument(document.id);
          continue;
        }

        watch(document.id);
      }
    },

    readDocumentText: async (documentId) => {
      if (!isRemote(get)) return null;

      const result = await getDocumentTextAction(documentId);
      if (!result.ok) {
        set({ syncError: result.error });
        return null;
      }

      return result.data ?? "";
    },

    readDocumentPages: async (documentId) => {
      if (!isRemote(get)) return [];

      const result = await getDocumentPagesAction(documentId);
      if (!result.ok) {
        set({ syncError: result.error });
        return [];
      }

      return result.data ?? [];
    },

    searchDocumentText: async (query, documentId = null) => {
      if (!isRemote(get)) return [];

      const result = await searchDocumentTextAction(query, documentId);
      if (!result.ok) {
        set({ syncError: result.error });
        return [];
      }

      return result.data ?? [];
    },
  };
};

/**
 * Гасит всех наблюдателей.
 *
 * Нужен на выходе из приложения и в тестах: интервал, переживший размонтирование,
 * продолжает ходить на сервер и писать в стор, которого уже никто не читает.
 */
export function stopAllRecognitionWatchers(): void {
  for (const documentId of [...watchers.keys()]) stopWatching(documentId);
}

/**
 * Отложенный запуск возобновления.
 *
 * `hydrate` вызывают во время отрисовки страницы, а начинать оттуда запрос к
 * серверу нельзя: React справедливо ругается на изменение состояния посреди
 * рендера. Откладываем на следующий тик — этого достаточно.
 */
export function scheduleResume(resume: () => Promise<void>): void {
  if (typeof window === "undefined") return;
  window.setTimeout(() => void resume(), 0);
}
