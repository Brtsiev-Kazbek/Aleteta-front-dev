import {
  addEntityAction,
  updateEntityDataAction,
} from "@/app/actions/entities";
import { findSchema, withValidation } from "@/lib/validation";
import { EXTRACTION_STEPS, type BatchReviewResult } from "@/types";

import { pickRecipe, startInterval, stopTimer } from "../demo";
import { createSync, isRemote, nextId, replaceEntityId } from "../sync";
import type { ReviewSlice, SliceCreator } from "../types";

/**
 * Разбор документов: перенос реквизитов и проверка на риски.
 *
 * ЭТО ПОКА ИМИТАЦИЯ в той части, где работает модель. Реквизиты берутся из
 * заготовленного рецепта, подобранного по имени файла; число замечаний
 * выводится из длины названия. Настоящие операции — задания `extract` и
 * `review`; первое уже умеет читать распознанный текст, второе ждёт очереди.
 *
 * А вот перенос реквизитов в объект дела настоящий: объект создаётся в базе
 * двумя запросами и живёт там же, где созданный руками. Заменить предстоит
 * источник значений, а не путь до базы.
 */
export const createReviewSlice: SliceCreator<ReviewSlice> = (set, get) => {
  const sync = createSync(set);

  return {
    extraction: null,
    isExtractionOpen: false,
    reviewDocumentId: null,

    isBatchReviewOpen: false,
    batchReviewStatus: "idle",
    batchReviewProgress: 0,
    batchReviewResults: [],
    batchReviewQueue: [],
    batchReviewCursor: 0,

    startExtraction: (file) => {
      set({
        isExtractionOpen: true,
        extraction: {
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
          const current = get().extraction;
          if (!current) {
            stopTimer("extraction");
            return;
          }

          const nextStep = current.step + 1;

          if (nextStep < EXTRACTION_STEPS.length) {
            set({ extraction: { ...current, step: nextStep } });
            return;
          }

          stopTimer("extraction");
          set({
            extraction: {
              ...current,
              step: EXTRACTION_STEPS.length,
              status: "done",
            },
          });
        },
        850
      );
    },

    setExtractionOpen: (open) => {
      if (!open) {
        stopTimer("extraction");
        set({ isExtractionOpen: false, extraction: null });
        return;
      }
      set({ isExtractionOpen: true });
    },

    applyExtraction: (caseId) => {
      const current = get().extraction;
      if (!current || current.status !== "done" || current.applied) return;

      const schema = findSchema(get().customSchemas, current.recipe.schemaId);

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
        },
        schema
      );

      set({
        entities: [...get().entities, entity],
        extraction: { ...current, applied: true },
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
