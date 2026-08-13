import {
  getAiCapabilitiesAction,
  getDocumentPagesAction,
  getDocumentTextAction,
  getRecognitionAction,
  recognizeDocumentAction,
  searchDocumentTextAction,
  type RecognitionState,
} from "@/app/actions/ai";
import { createLogger, shortId } from "@/lib/logger";

import { isPersistedId } from "@/lib/ids";

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
 *
 * ОБ ОПРОСЕ. Опрос — приём грубый, и обращаться с ним надо осторожно, иначе он
 * превращается в поток запросов, который никого ни о чём не спрашивает. Всё,
 * что ниже, написано по следам ровно такого случая: браузер слал по запросу в
 * секунду, а сервер отвечал ошибкой разбора идентификатора, потому что
 * опрашивался файл, ещё не дошедший до базы.
 *
 * Поэтому здесь три правила, и каждое стоило отдельной неприятности.
 *
 *   1. Опрашиваем только то, что в базе есть. У файла, ещё не сохранённого,
 *      временный номер вида `doc-1786…`, и спрашивать про него бессмысленно.
 *   2. Пока ничего не меняется, спрашиваем всё реже. Задание может стоять в
 *      очереди часами — если исполнитель не развёрнут, оно простоит там до
 *      вечера, и все эти часы браузер долбил бы сервер дважды в минуту.
 *   3. Три ошибки подряд — останавливаемся и говорим об этом. Ошибка, которая
 *      повторяется, сама не пройдёт.
 */

const log = createLogger("ocr");

/**
 * Опрос начинается часто и замедляется.
 *
 * Первые секунды после постановки — самое интересное время: именно тогда
 * исполнитель берёт задание и появляется первая страница. Дальше смысл частых
 * вопросов падает: страница читается около минуты, и спрашивать про неё чаще
 * незачем.
 */
const POLL_MIN_MS = 2_000;
const POLL_MAX_MS = 30_000;
const POLL_GROWTH = 1.4;

/**
 * Сколько всего ждём одно распознавание.
 *
 * Восемнадцать страниц скана проходят несколькими заходами исполнителя, между
 * которыми задание ждёт в очереди, — четверть часа тут не предел. Но и ждать
 * вечно нельзя: подвисшее задание иначе оставит вкладку опрашивать сервер до
 * конца рабочего дня.
 */
const GIVE_UP_AFTER_MS = 30 * 60 * 1000;

/** Сколько ошибок подряд терпим, прежде чем прекратить. */
const MAX_FAILURES = 3;

/**
 * Похож ли идентификатор на выданный базой.
 *
 * До того как файл сохранён, у него временный номер из `nextId`. Спрашивать
 * сервер про такой — гарантированная ошибка разбора uuid, причём повторяемая
 * бесконечно: состояние не меняется, а значит, наблюдатель не остановится.
 */
const isPersisted = isPersistedId;

/** Наблюдатели по документам. Вне состояния: их надо гасить, а не рисовать. */
interface Watcher {
  handle: number;
  /** Текущая пауза между вопросами: растёт, пока ничего не меняется. */
  delay: number;
  startedAt: number;
  failures: number;
  /** Последнее увиденное состояние — по нему решаем, было ли движение. */
  seen: string;
}

const watchers = new Map<string, Watcher>();

function stopWatching(documentId: string, reason: string): void {
  const watcher = watchers.get(documentId);
  if (!watcher) return;

  window.clearTimeout(watcher.handle);
  watchers.delete(documentId);

  log.debug("watch.stop", {
    документ: shortId(documentId),
    причина: reason,
    осталось: watchers.size,
  });
}

/** Дочитан ли документ: дальше следить не за чем. */
function isSettled(state: RecognitionState): boolean {
  return (
    state.ocrStatus === "done" ||
    state.ocrStatus === "failed" ||
    state.ocrStatus === "skipped"
  );
}

/** Отпечаток состояния: изменился — значит, работа сдвинулась. */
function fingerprint(state: RecognitionState): string {
  return `${state.ocrStatus}:${state.pagesDone}:${state.job?.status ?? "—"}`;
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

  function title(documentId: string): string {
    return (
      get().documents.find((item) => item.id === documentId)?.title ??
      "документа"
    );
  }

  /**
   * Один вопрос к серверу и решение, что делать дальше.
   *
   * Вынесен отдельно от расписания намеренно: расписание должно оставаться
   * тривиальным, иначе в нём заводятся два таймера на один документ.
   */
  async function tick(documentId: string): Promise<void> {
    const watcher = watchers.get(documentId);
    if (!watcher) return;

    if (Date.now() - watcher.startedAt > GIVE_UP_AFTER_MS) {
      stopWatching(documentId, "истекло время ожидания");
      log.warn("watch.timeout", {
        документ: shortId(documentId),
        ждали: `${Math.round(GIVE_UP_AFTER_MS / 60000)}мин`,
      });
      set({
        syncError: `Распознавание «${title(documentId)}» идёт слишком долго. Загляните в журнал заданий.`,
      });
      return;
    }

    const result = await getRecognitionAction(documentId);

    // Наблюдателя могли погасить, пока ответ ехал.
    if (!watchers.has(documentId)) return;

    if (!result.ok || !result.data) {
      watcher.failures += 1;

      log.warn("watch.error", {
        документ: shortId(documentId),
        попытка: watcher.failures,
        ошибка: result.ok ? "документ не найден" : result.error,
      });

      if (watcher.failures >= MAX_FAILURES) {
        stopWatching(documentId, "ошибки подряд");
        set({
          syncError: `Не удалось узнать состояние «${title(documentId)}»: ${
            result.ok ? "документ не найден" : result.error
          }`,
        });
        return;
      }

      schedule(documentId, Math.min(watcher.delay * POLL_GROWTH, POLL_MAX_MS));
      return;
    }

    watcher.failures = 0;
    apply(documentId, result.data);

    if (isSettled(result.data)) {
      stopWatching(documentId, `состояние «${result.data.ocrStatus}»`);
      log.info("watch.settled", {
        документ: shortId(documentId),
        состояние: result.data.ocrStatus,
        страниц: result.data.pagesDone,
        источник: result.data.textSource,
      });
      return;
    }

    /*
     * Движение есть — спрашиваем снова часто. Движения нет — реже. Так вкладка,
     * оставленная открытой на задании, которое стоит в очереди, замолкает сама.
     */
    const now = fingerprint(result.data);
    const moved = now !== watcher.seen;
    watcher.seen = now;

    log.debug("watch.tick", {
      документ: shortId(documentId),
      состояние: result.data.ocrStatus,
      страниц: `${result.data.pagesDone}/${result.data.pageCount ?? "?"}`,
      движение: moved,
      пауза: watcher.delay,
    });

    schedule(
      documentId,
      moved ? POLL_MIN_MS : Math.min(watcher.delay * POLL_GROWTH, POLL_MAX_MS)
    );
  }

  /** Ставит следующий вопрос через `delay`. */
  function schedule(documentId: string, delay: number): void {
    const watcher = watchers.get(documentId);
    if (!watcher) return;

    watcher.delay = delay;
    watcher.handle = window.setTimeout(() => void tick(documentId), delay);
  }

  /**
   * Начинает следить за документом.
   *
   * Повторный вызов для того же файла ничего не портит: старый наблюдатель
   * гасится. Это важно — за один документ легко взяться дважды, открыв дело в
   * двух вкладках или нажав «распознать» повторно.
   */
  function watch(documentId: string): void {
    if (!isPersisted(documentId)) {
      log.debug("watch.skip", {
        документ: documentId,
        причина: "файл ещё не сохранён в базе",
      });
      return;
    }

    stopWatching(documentId, "перезапуск");

    watchers.set(documentId, {
      handle: 0,
      delay: POLL_MIN_MS,
      startedAt: Date.now(),
      failures: 0,
      seen: "",
    });

    log.info("watch.start", {
      документ: shortId(documentId),
      файл: title(documentId),
      наблюдателей: watchers.size,
    });

    schedule(documentId, POLL_MIN_MS);
  }

  return {
    recognitionJobs: {},
    isRecognitionAvailable: false,

    recognizeDocument: async (documentId) => {
      if (!isRemote(get)) return;

      if (!isPersisted(documentId)) {
        log.warn("enqueue.skip", {
          документ: documentId,
          причина: "файл ещё не сохранён в базе",
        });
        return;
      }

      const done = log.timer("enqueue", {
        документ: shortId(documentId),
        файл: title(documentId),
      });

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

      const enqueued = await sync(recognizeDocumentAction({ documentId }), {
        fallback: "Не удалось поставить распознавание в очередь.",
      });

      /*
       * Задание не создалось — чаще всего потому, что модель не настроена.
       * Оставить документ в «в очереди» было бы враньём: очереди никакой нет,
       * ждать нечего, а интерфейс при этом закрывает кнопку повтора. Поэтому
       * честно помечаем неудачей — тогда видно и ошибку, и как попробовать
       * снова.
       */
      if (!enqueued) {
        done({ ошибка: "задание не создано" });

        set((current) => ({
          documents: current.documents.map((document) =>
            document.id === documentId
              ? { ...document, ocrStatus: "failed" }
              : document
          ),
        }));
        return;
      }

      done({ задание: shortId(enqueued.jobId), изЖурнала: enqueued.fromCache });

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
        if (isSettled(state.data)) {
          log.info("enqueue.already-done", {
            документ: shortId(documentId),
            состояние: state.data.ocrStatus,
          });
          return;
        }
      }

      watch(documentId);
    },

    resumeRecognition: async () => {
      if (!isRemote(get)) return;

      /*
       * Заодно спрашиваем и про извлечение реквизитов: обе проверки — это одно
       * чтение переменных окружения, и делать ради второй ещё один круг до
       * сервера было бы расточительством. Поле живёт в слое разбора, но `set`
       * у стора общий.
       */
      const capabilities = await getAiCapabilitiesAction();
      const available = capabilities.recognition;
      set({
        isRecognitionAvailable: capabilities.recognition,
        isExtractionAvailable: capabilities.extraction,
      });

      const unfinished = get().documents.filter(
        (document) =>
          isPersisted(document.id) &&
          (document.ocrStatus === "pending" || document.ocrStatus === "running")
      );

      log.info("resume", {
        распознаваниеНастроено: capabilities.recognition,
        извлечениеНастроено: capabilities.extraction,
        незавершённых: unfinished.length,
        всегоФайлов: get().documents.length,
      });

      for (const document of unfinished) {
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
          log.info("resume.requeue", {
            документ: shortId(document.id),
            файл: document.title,
            причина: "задания в очереди нет",
          });
          void get().recognizeDocument(document.id);
          continue;
        }

        if (state.ok && state.data) {
          apply(document.id, state.data);
          if (isSettled(state.data)) continue;
        }

        watch(document.id);
      }
    },

    refreshRecognition: async (documentId) => {
      if (!isRemote(get) || !isPersisted(documentId)) return;

      const state = await getRecognitionAction(documentId);
      if (state.ok && state.data) apply(documentId, state.data);
    },

    readDocumentText: async (documentId) => {
      if (!isRemote(get) || !isPersisted(documentId)) return null;

      const result = await getDocumentTextAction(documentId);
      if (!result.ok) {
        log.error("text.read", {
          документ: shortId(documentId),
          ошибка: result.error,
        });
        set({ syncError: result.error });
        return null;
      }

      return result.data ?? "";
    },

    readDocumentPages: async (documentId) => {
      if (!isRemote(get) || !isPersisted(documentId)) return [];

      const result = await getDocumentPagesAction(documentId);
      if (!result.ok) {
        log.error("pages.read", {
          документ: shortId(documentId),
          ошибка: result.error,
        });
        set({ syncError: result.error });
        return [];
      }

      log.debug("pages.read", {
        документ: shortId(documentId),
        страниц: result.data?.length ?? 0,
      });

      return result.data ?? [];
    },

    searchDocumentText: async (query, documentId = null) => {
      if (!isRemote(get)) return [];

      const done = log.timer("search", { запрос: query });
      const result = await searchDocumentTextAction(query, documentId);

      if (!result.ok) {
        done({ ошибка: result.error });
        set({ syncError: result.error });
        return [];
      }

      done({ найдено: result.data?.length ?? 0 });
      return result.data ?? [];
    },
  };
};

/**
 * Гасит всех наблюдателей.
 *
 * Нужен на выходе из приложения и в тестах: таймер, переживший размонтирование,
 * продолжает ходить на сервер и писать в стор, которого уже никто не читает.
 */
export function stopAllRecognitionWatchers(): void {
  for (const documentId of [...watchers.keys()]) {
    stopWatching(documentId, "остановка приложения");
  }
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
