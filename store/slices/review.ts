import { extractFromDocumentAction, getJobStateAction } from "@/app/actions/ai";
import {
  addEntityAction,
  getEntityAction,
  updateEntityDataAction,
} from "@/app/actions/entities";
import { createLogger, shortId } from "@/lib/logger";
import { findSchema, withValidation } from "@/lib/validation";
import type { ExtractOutput } from "@/lib/ai/types";
import {
  EXTRACTION_STEPS,
  type BatchReviewResult,
  type ExtractionState,
} from "@/types";

import { pickRecipe, startInterval, stopTimer } from "../demo";
import { createSync, isRemote, nextId, replaceEntityId } from "../sync";
import type { ExtractionRequest, ReviewSlice, SliceCreator } from "../types";

/**
 * Разбор документов: извлечение реквизитов и проверка на риски.
 *
 * ИЗВЛЕЧЕНИЕ РЕКВИЗИТОВ РАБОТАЕТ ПО-НАСТОЯЩЕМУ. Задание ложится в очередь, его
 * выполняет исполнитель в Edge Function, модель читает распознанный текст, и
 * карточка объекта появляется в базе. Браузер только спрашивает, как идут дела.
 *
 * Отсюда всё устройство ниже. Работа продолжается, когда вкладка закрыта, —
 * значит, состояние держится вокруг номера задания, а не вокруг таймера. Работа
 * может не получиться — значит, у неудачи есть своё место, и показывается она
 * дословно. Карточка создаётся сразу, без подтверждения: подтверждать нечего,
 * пока не увидишь значения, а увидеть их толком можно только в самой карточке.
 *
 * ЧТО ЗДЕСЬ ЕЩЁ ИМИТАЦИЯ: разбор договора по пунктам, проверка пачкой и витрина
 * на рабочем столе. Первые два ждут задачу `review`, обработчика которой нет.
 * Витрина имитацией и останется — там нет загруженного файла, разбирать нечего.
 */

const log = createLogger("extract");

/*
 * Опрос: правила те же, что у распознавания, и по тем же причинам — подробный
 * разбор в `store/slices/recognition.ts`. Разница только в числах. Извлечение —
 * один вызов модели, а не сто двадцать страниц волнами: полчаса ждать нечего, а
 * спрашивать реже, чем раз в пятнадцать секунд, незачем.
 */
const POLL_MIN_MS = 2_000;
const POLL_MAX_MS = 15_000;
const POLL_GROWTH = 1.4;
const GIVE_UP_AFTER_MS = 5 * 60 * 1000;
const MAX_FAILURES = 3;

/**
 * Похож ли идентификатор на выданный базой.
 *
 * До того как файл сохранён, у него временный номер из `nextId`. Спрашивать
 * сервер про такой — гарантированная ошибка разбора uuid.
 */
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isPersisted(id: string): boolean {
  return UUID.test(id);
}

export const createReviewSlice: SliceCreator<ReviewSlice> = (set, get) => {
  const sync = createSync(set);

  /* ---------------------------------------------------------------- */
  /*  НАБЛЮДЕНИЕ ЗА ЗАДАНИЕМ                                           */
  /* ---------------------------------------------------------------- */

  /*
   * Наблюдатель один: разбор запускают кнопкой и по одному файлу за раз.
   * Держим его вне состояния — его надо гасить, а не рисовать.
   */
  let watcher: {
    jobId: string;
    handle: number;
    delay: number;
    startedAt: number;
    failures: number;
    seen: string;
  } | null = null;

  function stopWatching(reason: string): void {
    if (!watcher) return;

    window.clearTimeout(watcher.handle);
    log.debug("watch.stop", {
      задание: shortId(watcher.jobId),
      причина: reason,
    });
    watcher = null;
  }

  /** Правит текущий разбор, если он всё ещё тот самый. */
  function patch(jobId: string, change: Partial<ExtractionState>): void {
    const current = get().extraction;
    if (!current || current.jobId !== jobId) return;
    set({ extraction: { ...current, ...change } });
  }

  /** Помечает разбор неудачным и гасит наблюдателя. */
  function fail(jobId: string, message: string): void {
    log.error("failed", { задание: shortId(jobId), ошибка: message });
    patch(jobId, { status: "failed", error: message });
    stopWatching("неудача");
  }

  /** Неудача до того, как задание получило номер, — показать всё равно надо. */
  function failBeforeStart(message: string): void {
    set((state) =>
      state.extraction
        ? { extraction: { ...state.extraction, status: "failed", error: message } }
        : {}
    );
  }

  /**
   * Готовый разбор: раскладываем ответ и дотягиваем созданную карточку.
   *
   * Карточку читаем из базы, а не собираем из ответа модели: показывать надо
   * то, что действительно сохранено, вместе с пересчитанными там ошибками
   * валидации и пометками неуверенности.
   */
  async function settle(jobId: string, output: ExtractOutput): Promise<void> {
    log.info("done", {
      задание: shortId(jobId),
      карточка: shortId(output.entityId),
      реквизитов: output.fields.length,
      неНайдено: output.missing.length,
      страниц: `${output.pagesLooked}/${output.pagesTotal}`,
    });

    patch(jobId, {
      status: "done",
      progress: 100,
      fields: output.fields,
      missing: output.missing,
      pagesLooked: output.pagesLooked,
      pagesTotal: output.pagesTotal,
      entityId: output.entityId,
      error: null,
    });

    const created = await getEntityAction(output.entityId);

    if (!created.ok || !created.data) {
      /*
       * Карточка в базе есть — её создал исполнитель, — но прочитать её сейчас
       * не вышло. Разбор от этого неудачным не становится: на странице дела она
       * появится после обновления. Говорим об этом и состояние разбора не
       * трогаем: объявить неудачей сделанную работу было бы хуже всего.
       */
      log.warn("entity.read", {
        карточка: shortId(output.entityId),
        ошибка: created.ok ? "объект не найден" : created.error,
      });
      set({
        syncError:
          "Реквизиты сохранены, но карточка не подтянулась. Обновите страницу.",
      });
      return;
    }

    const entity = created.data;

    set((state) => ({
      entities: state.entities.some((item) => item.id === entity.id)
        ? state.entities.map((item) => (item.id === entity.id ? entity : item))
        : [...state.entities, entity],
      // Реквизиты уже в матрице — показываем её сразу.
      activeTab: "entities",
    }));
  }

  async function tick(): Promise<void> {
    if (!watcher) return;
    const { jobId } = watcher;

    if (Date.now() - watcher.startedAt > GIVE_UP_AFTER_MS) {
      log.warn("watch.timeout", {
        задание: shortId(jobId),
        ждали: `${Math.round(GIVE_UP_AFTER_MS / 60000)}мин`,
      });
      fail(
        jobId,
        "Разбор идёт слишком долго. Загляните в журнал заданий — возможно, исполнитель не отвечает."
      );
      return;
    }

    const result = await getJobStateAction<"extract">(jobId);

    // Наблюдателя могли погасить или перенаправить, пока ответ ехал.
    if (!watcher || watcher.jobId !== jobId) return;

    if (!result.ok || !result.data) {
      watcher.failures += 1;

      const reason = result.ok ? "задание не найдено" : result.error;
      log.warn("watch.error", {
        задание: shortId(jobId),
        попытка: watcher.failures,
        ошибка: reason,
      });

      if (watcher.failures >= MAX_FAILURES) {
        fail(jobId, `Не удалось узнать, чем кончился разбор: ${reason}`);
        return;
      }

      schedule(Math.min(watcher.delay * POLL_GROWTH, POLL_MAX_MS));
      return;
    }

    watcher.failures = 0;
    const job = result.data;

    if (job.status === "done") {
      stopWatching("готово");

      if (!job.output?.entityId) {
        fail(jobId, "Разбор закончился, но реквизиты не вернулись.");
        return;
      }

      await settle(jobId, job.output);
      return;
    }

    if (job.status === "failed") {
      fail(jobId, job.error ?? "Разбор не удался, причина не записана.");
      return;
    }

    patch(jobId, {
      status: job.status === "running" ? "running" : "queued",
      progress: job.progress,
    });

    /*
     * Движение есть — спрашиваем снова часто. Движения нет — реже. Так вкладка,
     * оставленная на задании в очереди, замолкает сама.
     */
    const now = `${job.status}:${job.progress}`;
    const moved = now !== watcher.seen;
    watcher.seen = now;

    log.debug("watch.tick", {
      задание: shortId(jobId),
      состояние: job.status,
      сделано: `${job.progress}%`,
      движение: moved,
    });

    schedule(
      moved ? POLL_MIN_MS : Math.min(watcher.delay * POLL_GROWTH, POLL_MAX_MS)
    );
  }

  function schedule(delay: number): void {
    if (!watcher) return;
    watcher.delay = delay;
    watcher.handle = window.setTimeout(() => void tick(), delay);
  }

  function watch(jobId: string): void {
    stopWatching("перезапуск");

    watcher = {
      jobId,
      handle: 0,
      delay: POLL_MIN_MS,
      startedAt: Date.now(),
      failures: 0,
      seen: "",
    };

    log.info("watch.start", { задание: shortId(jobId) });
    schedule(POLL_MIN_MS);
  }

  /** Ставит задание и начинает следить. Общая часть запуска и повтора. */
  async function launch(request: ExtractionRequest): Promise<void> {
    const done = log.timer("enqueue", {
      документ: shortId(request.documentId),
      файл: request.title,
      тип: shortId(request.typeId),
    });

    const enqueued = await sync(
      extractFromDocumentAction({
        documentId: request.documentId,
        caseId: request.caseId,
        typeId: request.typeId,
      }),
      { fallback: "Не удалось поставить разбор в очередь." }
    );

    if (!enqueued) {
      done({ ошибка: "задание не создано" });

      /*
       * Оставить разбор в «в очереди» было бы враньём: очереди никакой нет, и
       * ждать нечего. Причину `sync` уже положил в общее сообщение об ошибке —
       * повторяем её же в шторке, чтобы та не выглядела зависшей.
       */
      failBeforeStart(
        get().syncError ?? "Не удалось поставить разбор в очередь."
      );
      return;
    }

    done({ задание: shortId(enqueued.jobId), изЖурнала: enqueued.fromCache });

    set((state) =>
      state.extraction
        ? { extraction: { ...state.extraction, jobId: enqueued.jobId } }
        : {}
    );

    /*
     * Ответ из журнала — тот же файл с тем же типом уже разбирали. Ждать нечего,
     * но состояние подтянуть надо: иначе человек смотрит на «в очереди» при
     * готовом результате.
     */
    const state = await getJobStateAction<"extract">(enqueued.jobId);

    if (state.ok && state.data?.status === "done" && state.data.output) {
      log.info("already-done", { задание: shortId(enqueued.jobId) });
      await settle(enqueued.jobId, state.data.output);
      return;
    }

    watch(enqueued.jobId);
  }

  return {
    extraction: null,
    isExtractionOpen: false,
    demoExtraction: null,
    isDemoExtractionOpen: false,
    reviewDocumentId: null,

    isBatchReviewOpen: false,
    batchReviewStatus: "idle",
    batchReviewProgress: 0,
    batchReviewResults: [],
    batchReviewQueue: [],
    batchReviewCursor: 0,

    /* -------------------------------------------------------------- */
    /*  ИЗВЛЕЧЕНИЕ РЕКВИЗИТОВ — НАСТОЯЩЕЕ                              */
    /* -------------------------------------------------------------- */

    startExtraction: async (request) => {
      stopWatching("новый разбор");

      set({
        isExtractionOpen: true,
        extraction: {
          documentId: request.documentId,
          caseId: request.caseId,
          typeId: request.typeId,
          file: { name: request.title, sizeBytes: request.sizeBytes },
          jobId: null,
          status: "queued",
          progress: 0,
          fields: [],
          missing: [],
          pagesLooked: null,
          pagesTotal: null,
          entityId: null,
          error: null,
        },
      });

      if (!isRemote(get)) {
        failBeforeStart(
          "Разбор работает только с подключённой базой — сейчас показан встроенный набор."
        );
        return;
      }

      if (!isPersisted(request.documentId)) {
        log.warn("enqueue.skip", {
          документ: request.documentId,
          причина: "файл ещё не сохранён в базе",
        });
        failBeforeStart(
          "Файл ещё не сохранён. Дождитесь окончания загрузки и повторите."
        );
        return;
      }

      await launch(request);
    },

    retryExtraction: async () => {
      const current = get().extraction;
      if (!current) return;

      await get().startExtraction({
        documentId: current.documentId,
        caseId: current.caseId,
        typeId: current.typeId,
        title: current.file.name,
        sizeBytes: current.file.sizeBytes,
      });
    },

    setExtractionOpen: (open) => {
      if (!open) {
        /*
         * Закрытая шторка задание не отменяет: оно идёт на сервере и от
         * закрытия окна никуда не денется. Но следить за ним больше незачем —
         * показывать результат негде. Карточка появится в матрице сама.
         */
        stopWatching("шторка закрыта");
        set({ isExtractionOpen: false, extraction: null });
        return;
      }
      set({ isExtractionOpen: true });
    },

    /* -------------------------------------------------------------- */
    /*  ВИТРИНА: ТО ЖЕ САМОЕ «КАК БУДТО»                               */
    /* -------------------------------------------------------------- */

    startDemoExtraction: (file) => {
      set({
        isDemoExtractionOpen: true,
        demoExtraction: {
          file,
          recipe: pickRecipe(file.name),
          step: 0,
          status: "running",
          applied: false,
        },
      });

      startInterval(
        "extraction",
        () => {
          const current = get().demoExtraction;
          if (!current) {
            stopTimer("extraction");
            return;
          }

          const nextStep = current.step + 1;

          if (nextStep < EXTRACTION_STEPS.length) {
            set({ demoExtraction: { ...current, step: nextStep } });
            return;
          }

          stopTimer("extraction");
          set({
            demoExtraction: {
              ...current,
              step: EXTRACTION_STEPS.length,
              status: "done",
            },
          });
        },
        850
      );
    },

    setDemoExtractionOpen: (open) => {
      if (!open) {
        stopTimer("extraction");
        set({ isDemoExtractionOpen: false, demoExtraction: null });
        return;
      }
      set({ isDemoExtractionOpen: true });
    },

    applyDemoExtraction: (caseId) => {
      const current = get().demoExtraction;
      if (!current || current.status !== "done" || current.applied) return;

      const schema = findSchema(get().entitySchemas, current.recipe.schemaId);

      const data: Record<string, string> = {};
      for (const field of current.recipe.fields) {
        data[field.key] = field.value;
      }

      const entity = withValidation(
        {
          id: nextId("entity"),
          caseId,
          type: schema.id,
          data,
          validationErrors: [],
          uncertainFields: [],
        },
        schema
      );

      set({
        entities: [...get().entities, entity],
        demoExtraction: { ...current, applied: true },
        // Реквизиты переносятся в матрицу — показываем её сразу.
        activeTab: "entities",
      });

      if (!isRemote(get)) return;

      /*
       * Двумя запросами, а не одним: объект сначала должен появиться в базе,
       * чтобы получить идентификатор, и только потом в него ложатся реквизиты.
       * Вставить всё разом мешает триггер — он считает валидность по типу, а тип
       * известен только после вставки.
       */
      void (async () => {
        const created = await sync(addEntityAction(caseId, schema.id), {
          onSuccess: (saved) => replaceEntityId(set, entity.id, saved),
          onFailure: () =>
            set({
              entities: get().entities.filter((item) => item.id !== entity.id),
            }),
          fallback: "Не удалось перенести реквизиты.",
        });

        if (!created) return;

        await sync(updateEntityDataAction(created.id, data), {
          onSuccess: (saved) => replaceEntityId(set, created.id, saved),
          fallback: "Объект создан, но реквизиты не сохранились.",
        });
      })();
    },

    /* -------------------------------------------------------------- */
    /*  РАЗБОР ПО ПУНКТАМ — ПОКА ИМИТАЦИЯ                              */
    /* -------------------------------------------------------------- */

    openDocumentReview: (documentId) => set({ reviewDocumentId: documentId }),

    closeDocumentReview: () => set({ reviewDocumentId: null }),

    setBatchReviewOpen: (open) => {
      if (!open) stopTimer("batchReview");
      set({
        isBatchReviewOpen: open,
        ...(open
          ? {}
          : {
              batchReviewStatus: "idle",
              batchReviewProgress: 0,
              batchReviewCursor: 0,
              batchReviewQueue: [],
            }),
      });
    },

    startBatchReview: (caseId) => {
      if (get().batchReviewStatus === "running") return;

      const selected = get().selectedDocumentIds;
      const targets = get().documents.filter(
        (item) => item.caseId === caseId && selected.includes(item.id)
      );
      if (targets.length === 0) return;

      set({
        isBatchReviewOpen: true,
        batchReviewStatus: "running",
        batchReviewProgress: 0,
        batchReviewResults: [],
        batchReviewCursor: 0,
        batchReviewQueue: targets.map((item) => ({
          id: item.id,
          title: item.title,
        })),
      });

      /*
       * Документы проверяются по одному: очередь видно на экране, а замечания
       * прибавляются по мере разбора — так же, как в демонстрации на лендинге.
       * Количество замечаний выводится детерминированно из имени файла,
       * чтобы результат не «прыгал» при повторном запуске.
       */
      startInterval(
        "batchReview",
        () => {
          const cursor = get().batchReviewCursor;
          const document = targets[cursor];

          if (!document) {
            stopTimer("batchReview");
            set({ batchReviewStatus: "done", batchReviewProgress: 100 });
            return;
          }

          const seed = document.title.length + cursor;
          const result: BatchReviewResult = {
            documentId: document.id,
            title: document.title,
            critical: seed % 3 === 0 ? 1 : 0,
            warning: (seed % 3) + 1,
          };

          const nextCursor = cursor + 1;
          const isLast = nextCursor >= targets.length;

          if (isLast) stopTimer("batchReview");

          set({
            batchReviewResults: [...get().batchReviewResults, result],
            batchReviewCursor: nextCursor,
            batchReviewProgress: (nextCursor / targets.length) * 100,
            batchReviewStatus: isLast ? "done" : "running",
          });
        },
        780
      );
    },
  };
};
