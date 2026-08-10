import { matchFreeformTemplate } from "@/lib/templates";
import { findSchema } from "@/lib/validation";
import {
  CUSTOM_REQUEST_GROUP,
  type Document,
  type GeneratedDocument,
} from "@/types";

import { addTimeout, startInterval, stopTimer, titleFromPrompt } from "../demo";
import { nextId } from "../sync";
import type {
  BulkGenerationResult,
  GenerationSlice,
  SliceCreator,
} from "../types";

/**
 * Генерация документов: пакет по шаблонам, свободный запрос, массовая по делам.
 *
 * ЭТО ПОКА ИМИТАЦИЯ. Прогресс двигает `setInterval`, содержимое документов не
 * создаётся вовсе — в списке появляются имена файлов со ссылкой «#». Настоящие
 * операции описаны в docs/AI-BACKEND.md как задания `package`, `freeform` и
 * `bulk`; когда они появятся, отсюда уйдут таймеры, а форма состояния —
 * статус, прогресс, список готового — останется той же.
 *
 * Полосу прогресса менять не придётся: она уже читает проценты, а не тик
 * таймера. Так же устроено настоящее распознавание — там проценты приходят с
 * сервера и считаются по страницам.
 */
export const createGenerationSlice: SliceCreator<GenerationSlice> = (
  set,
  get
) => ({
  generationStatus: "idle",
  generationProgress: 0,
  generatedDocuments: [],
  isGenerationSheetOpen: false,
  isCustomGenerating: false,
  freeformStage: "idle",
  templateMatch: null,

  isBulkSheetOpen: false,
  bulkStatus: "idle",
  bulkProgress: 0,
  bulkResults: [],

  startGeneration: (caseId) => {
    if (get().generationStatus === "running") return;

    set({
      generationStatus: "running",
      generationProgress: 0,
      generatedDocuments: [],
      isGenerationSheetOpen: true,
    });

    startInterval(
      "generation",
      () => {
        const progress = get().generationProgress + 14;

        if (progress < 100) {
          set({ generationProgress: progress });
          return;
        }

        stopTimer("generation");

        const valid = get()
          .entities.filter((entity) => entity.caseId === caseId)
          .filter((entity) => entity.validationErrors.length === 0);

        const generated: GeneratedDocument[] = [];
        const created: Document[] = [];
        const createdAt = new Date().toISOString();

        const schemas = get().entitySchemas;

        for (const entity of valid) {
          const schema = findSchema(schemas, entity.type);
          // Имя берём из первого поля схемы: у своих типов ключа `name` нет.
          const firstKey = schema.fields[0]?.key ?? "name";
          const entityName = entity.data[firstKey]?.trim() || "Без наименования";

          for (const template of schema.templates) {
            const name = `${template}.docx`;
            const id = nextId("generated");

            generated.push({ id, name, entityId: entity.id, entityName });

            // Сгенерированные файлы должны появиться во вкладке «Документы».
            created.push({
              id,
              caseId,
              title: name,
              type: template,
              status: "ready",
              url: "#",
              createdAt,
            });
          }
        }

        set({
          generationProgress: 100,
          generationStatus: "done",
          generatedDocuments: generated,
          documents: [...created, ...get().documents],
        });
      },
      150
    );
  },

  setGenerationSheetOpen: (open) => {
    if (!open) {
      stopTimer("generation");
      stopTimer("freeform");
    }

    set({
      isGenerationSheetOpen: open,
      ...(open
        ? {}
        : {
            generationStatus: "idle",
            generationProgress: 0,
            isCustomGenerating: false,
            freeformStage: "idle",
            templateMatch: null,
          }),
    });
  },

  generateCustomDocument: (caseId, prompt) => {
    const request = prompt.trim();
    if (!request || get().isCustomGenerating) return;

    stopTimer("freeform");

    // Сначала показываем поиск шаблона: пользователю важно понимать,
    // подставились реквизиты в готовую форму или документ пишется с нуля.
    set({
      isCustomGenerating: true,
      freeformStage: "searching",
      templateMatch: null,
    });

    addTimeout(
      "freeform",
      () =>
        set({
          freeformStage: "composing",
          templateMatch: matchFreeformTemplate(request),
        }),
      900
    );

    addTimeout(
      "freeform",
      () => {
        const title = titleFromPrompt(request);
        const id = nextId("generated");
        const name = `${title}.docx`;
        const createdAt = new Date().toISOString();
        const match = get().templateMatch;

        set({
          isCustomGenerating: false,
          freeformStage: "done",
          generatedDocuments: [
            ...get().generatedDocuments,
            {
              id,
              name,
              entityId: CUSTOM_REQUEST_GROUP,
              entityName: "По вашему запросу",
            },
          ],
          documents: [
            {
              id,
              caseId,
              title: name,
              type: match?.found ? match.name : "Составлен с нуля",
              status: "ready",
              url: "#",
              createdAt,
            },
            ...get().documents,
          ],
        });
      },
      2400
    );
  },

  setBulkSheetOpen: (open) => {
    if (!open) stopTimer("bulk");
    set({
      isBulkSheetOpen: open,
      ...(open ? {} : { bulkStatus: "idle", bulkProgress: 0 }),
    });
  },

  generateForSelectedCases: (prompt) => {
    const request = prompt.trim();
    const targets = get().cases.filter((item) =>
      get().selectedCaseIds.includes(item.id)
    );
    if (!request || targets.length === 0) return;
    if (get().bulkStatus === "running") return;

    set({ bulkStatus: "running", bulkProgress: 0, bulkResults: [] });

    const title = titleFromPrompt(request);
    const name = `${title}.docx`;

    startInterval(
      "bulk",
      () => {
        const progress = get().bulkProgress + 12;

        if (progress < 100) {
          set({ bulkProgress: progress });
          return;
        }

        stopTimer("bulk");

        const createdAt = new Date().toISOString();
        const results: BulkGenerationResult[] = [];
        const documents: Document[] = [];

        for (const target of targets) {
          const id = nextId("bulk");
          results.push({ id, caseId: target.id, caseTitle: target.title, name });
          documents.push({
            id,
            caseId: target.id,
            title: name,
            type: "Массовая генерация",
            status: "ready",
            url: "#",
            createdAt,
          });
        }

        set({
          bulkProgress: 100,
          bulkStatus: "done",
          bulkResults: results,
          documents: [...documents, ...get().documents],
        });
      },
      130
    );
  },
});
