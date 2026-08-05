import { create } from "zustand";

import {
  ASSISTANT_RISK_FINDINGS,
  INITIAL_CHAT_MESSAGES,
  MOCK_CASES,
  MOCK_DOCUMENTS,
  MOCK_ENTITIES,
} from "@/data/mock-data";
import { plural } from "@/lib/utils";
import { findSchema, withValidation } from "@/lib/validation";
import {
  CUSTOM_REQUEST_GROUP,
  type BatchReviewResult,
  type Case,
  type ChatMessage,
  type Document,
  type Entity,
  type EntityFieldSchema,
  type EntitySchema,
  type GeneratedDocument,
  type GenerationStatus,
} from "@/types";

export type CaseTab = "overview" | "documents" | "entities";

export interface EditingCell {
  entityId: string;
  field: string;
}

/** Черновик пользовательской схемы из диалога создания типа. */
export interface CustomSchemaDraft {
  label: string;
  fields: { label: string; required: boolean }[];
}

/** Результат массовой генерации по нескольким делам сразу. */
export interface BulkGenerationResult {
  id: string;
  caseId: string;
  caseTitle: string;
  name: string;
}

/** Файл, добавляемый в документы дела. */
export interface UploadedFile {
  name: string;
  sizeBytes: number;
}

interface AppState {
  /* --- Данные --- */
  cases: Case[];
  entities: Entity[];
  documents: Document[];
  /** Типы сущностей, созданные пользователем. */
  customSchemas: EntitySchema[];

  /* --- Рабочее пространство дела --- */
  activeTab: CaseTab;
  editingCell: EditingCell | null;

  /* --- AI-ассистент --- */
  isAssistantOpen: boolean;
  isAssistantThinking: boolean;
  chatMessages: ChatMessage[];

  /* --- Генерация пакета --- */
  generationStatus: GenerationStatus;
  generationProgress: number;
  generatedDocuments: GeneratedDocument[];
  isGenerationSheetOpen: boolean;
  /** Идёт генерация документа по свободному запросу пользователя. */
  isCustomGenerating: boolean;

  /* --- Массовая генерация по выбранным делам --- */
  selectedCaseIds: string[];
  isBulkSheetOpen: boolean;
  bulkStatus: GenerationStatus;
  bulkProgress: number;
  bulkResults: BulkGenerationResult[];

  /* --- Пакетная проверка документов на риски --- */
  selectedDocumentIds: string[];
  isBatchReviewOpen: boolean;
  batchReviewStatus: GenerationStatus;
  batchReviewProgress: number;
  batchReviewResults: BatchReviewResult[];

  /* --- Оболочка --- */
  isSidebarExpanded: boolean;
  isCreateCaseOpen: boolean;
  isCustomSchemaOpen: boolean;

  /* --- Действия --- */
  updateEntityField: (entityId: string, field: string, value: string) => void;
  addEntity: (caseId: string, typeId: string) => void;
  deleteEntity: (entityId: string) => void;
  duplicateEntity: (entityId: string) => void;
  setEditingCell: (cell: EditingCell | null) => void;

  /** Создаёт пользовательский тип и сразу добавляет сущность этого типа. */
  createCustomSchema: (caseId: string, draft: CustomSchemaDraft) => void;
  setCustomSchemaOpen: (open: boolean) => void;

  createCase: (title: string) => Case;
  addDocument: (document: Omit<Document, "id" | "createdAt">) => Document;
  /** Загрузка готовых файлов во вкладку «Документы» дела. */
  addDocuments: (caseId: string, files: UploadedFile[]) => void;
  deleteDocument: (documentId: string) => void;

  setActiveTab: (tab: CaseTab) => void;
  toggleAssistant: (open?: boolean) => void;
  sendChatMessage: (text: string, caseId: string) => void;
  fillEmptyFieldsWithAI: (caseId: string) => void;

  startGeneration: (caseId: string) => void;
  setGenerationSheetOpen: (open: boolean) => void;
  /** Документ по произвольному текстовому запросу, вне шаблонов. */
  generateCustomDocument: (caseId: string, prompt: string) => void;

  toggleDocumentSelection: (documentId: string) => void;
  clearDocumentSelection: () => void;
  startBatchReview: (caseId: string) => void;
  setBatchReviewOpen: (open: boolean) => void;

  toggleCaseSelection: (caseId: string) => void;
  toggleAllCases: (caseIds: string[]) => void;
  clearCaseSelection: () => void;
  setBulkSheetOpen: (open: boolean) => void;
  /** Создаёт документ по свободному описанию сразу во всех выбранных делах. */
  generateForSelectedCases: (prompt: string) => void;

  toggleSidebar: (expanded?: boolean) => void;
  setCreateCaseOpen: (open: boolean) => void;
}

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

/** Значения, которые «AI» подставляет в пустые поля по запросу пользователя. */
const AI_SUGGESTED_VALUES: Record<string, string> = {
  landUse: "Для индивидуального жилищного строительства",
  owner: "Брциев К. Р.",
  cadastralNumber: "15:09:0000000:0002",
  area: "440 кв.м.",
  name: "Земельный участок (без наименования)",
  inn: "1513000000",
  kpp: "151301001",
  address: "г. Владикавказ, ул. Мира, д. 10",
  director: "Иванов И. И.",
  passport: "90 12 345678",
  snils: "123-456-789 00",
  registrationAddress: "г. Москва, ул. Тверская, д. 4",
};

const SEEDED_ENTITIES = MOCK_ENTITIES.map((entity) =>
  withValidation(entity, findSchema([], entity.type))
);

/**
 * Идентификатор интервала генерации хранится вне состояния: его нужно уметь
 * погасить при закрытии шторки, иначе таймер продолжает писать в стор.
 */
let generationTimerId: number | null = null;

function stopGenerationTimer() {
  if (generationTimerId !== null) {
    window.clearInterval(generationTimerId);
    generationTimerId = null;
  }
}

/** Таймер пакетной проверки документов на риски. */
let batchReviewTimerId: number | null = null;

function stopBatchReviewTimer() {
  if (batchReviewTimerId !== null) {
    window.clearInterval(batchReviewTimerId);
    batchReviewTimerId = null;
  }
}

/** Таймер массовой генерации по делам — гасится при закрытии шторки. */
let bulkTimerId: number | null = null;

function stopBulkTimer() {
  if (bulkTimerId !== null) {
    window.clearInterval(bulkTimerId);
    bulkTimerId = null;
  }
}

/** Тип документа по расширению — для колонки во вкладке «Документы». */
function detectDocumentType(fileName: string): string {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
  switch (extension) {
    case "pdf":
      return "PDF-документ";
    case "doc":
    case "docx":
      return "Документ Word";
    case "xls":
    case "xlsx":
      return "Таблица";
    case "jpg":
    case "jpeg":
    case "png":
    case "webp":
    case "tif":
    case "tiff":
      return "Скан";
    default:
      return "Файл";
  }
}

/** Имя документа из свободного запроса: первая строка, до 70 знаков. */
function titleFromPrompt(prompt: string): string {
  const firstLine = prompt.trim().split("\n")[0] ?? prompt.trim();
  const trimmed = firstLine.slice(0, 70).trim();
  return trimmed.length < firstLine.length ? `${trimmed}…` : trimmed;
}

export const useAppStore = create<AppState>((set, get) => ({
  cases: MOCK_CASES,
  entities: SEEDED_ENTITIES,
  documents: MOCK_DOCUMENTS,
  customSchemas: [],

  activeTab: "entities",
  editingCell: null,

  isAssistantOpen: false,
  isAssistantThinking: false,
  chatMessages: INITIAL_CHAT_MESSAGES,

  generationStatus: "idle",
  generationProgress: 0,
  generatedDocuments: [],
  isGenerationSheetOpen: false,
  isCustomGenerating: false,

  selectedCaseIds: [],
  isBulkSheetOpen: false,
  bulkStatus: "idle",
  bulkProgress: 0,
  bulkResults: [],

  selectedDocumentIds: [],
  isBatchReviewOpen: false,
  batchReviewStatus: "idle",
  batchReviewProgress: 0,
  batchReviewResults: [],

  isSidebarExpanded: false,
  isCreateCaseOpen: false,
  isCustomSchemaOpen: false,

  updateEntityField: (entityId, field, value) => {
    const custom = get().customSchemas;
    set({
      entities: get().entities.map((entity) =>
        entity.id === entityId
          ? withValidation(
              { ...entity, data: { ...entity.data, [field]: value } },
              findSchema(custom, entity.type)
            )
          : entity
      ),
    });
  },

  addEntity: (caseId, typeId) => {
    const schema = findSchema(get().customSchemas, typeId);
    const entity = withValidation(
      {
        id: nextId("entity"),
        caseId,
        type: schema.id,
        data: {},
        validationErrors: [],
      },
      schema
    );

    set({
      entities: [...get().entities, entity],
      // Сразу открываем первое поле новой сущности на редактирование.
      editingCell: schema.fields[0]
        ? { entityId: entity.id, field: schema.fields[0].key }
        : null,
    });
  },

  createCustomSchema: (caseId, draft) => {
    const label = draft.label.trim() || "Своя сущность";

    const fields: EntityFieldSchema[] = draft.fields
      .filter((field) => field.label.trim())
      .map((field, index) => ({
        key: `field_${index + 1}`,
        label: field.label.trim(),
        required: field.required,
        placeholder: `Значение поля «${field.label.trim()}»`,
        width: 240,
      }));

    // Без полей сущность бессмысленна — гарантируем хотя бы наименование.
    const safeFields: EntityFieldSchema[] =
      fields.length > 0
        ? fields
        : [
            {
              key: "field_1",
              label: "Наименование",
              required: true,
              placeholder: "Наименование",
              width: 280,
            },
          ];

    const schema: EntitySchema = {
      id: nextId("schema"),
      label,
      hint: `Свой тип: ${safeFields.length} ${plural(
        safeFields.length,
        "поле",
        "поля",
        "полей"
      )}`,
      isCustom: true,
      fields: safeFields,
      templates: [`Документ по сущности «${label}»`],
    };

    const entity = withValidation(
      {
        id: nextId("entity"),
        caseId,
        type: schema.id,
        data: {},
        validationErrors: [],
      },
      schema
    );

    set({
      customSchemas: [...get().customSchemas, schema],
      entities: [...get().entities, entity],
      isCustomSchemaOpen: false,
      editingCell: safeFields[0]
        ? { entityId: entity.id, field: safeFields[0].key }
        : null,
    });
  },

  setCustomSchemaOpen: (open) => set({ isCustomSchemaOpen: open }),

  deleteEntity: (entityId) => {
    set({
      entities: get().entities.filter((entity) => entity.id !== entityId),
      editingCell:
        get().editingCell?.entityId === entityId ? null : get().editingCell,
    });
  },

  duplicateEntity: (entityId) => {
    const source = get().entities.find((entity) => entity.id === entityId);
    if (!source) return;

    const schema = findSchema(get().customSchemas, source.type);
    // Имя берём из первого поля схемы: у своих типов ключа `name` нет.
    const nameKey = schema.fields[0]?.key;
    const data = { ...source.data };
    if (nameKey && data[nameKey]) {
      data[nameKey] = `${data[nameKey]} (копия)`;
    }

    const copy = withValidation(
      { ...source, id: nextId("entity"), data },
      schema
    );

    const index = get().entities.findIndex((entity) => entity.id === entityId);
    const entities = [...get().entities];
    entities.splice(index + 1, 0, copy);

    set({ entities });
  },

  setEditingCell: (cell) => set({ editingCell: cell }),

  createCase: (title) => {
    const newCase: Case = {
      id: nextId("case"),
      title: title.trim() || "Новое дело",
      status: "collecting",
      tags: ["Черновик"],
      createdAt: new Date().toISOString(),
      description:
        "Новое рабочее пространство. Загрузите документы — Алетейя извлечёт реквизиты и соберёт сущности автоматически.",
      contextFile: "Файлы не загружены",
    };
    set({ cases: [newCase, ...get().cases] });
    return newCase;
  },

  addDocument: (document) => {
    const created: Document = {
      ...document,
      id: nextId("doc"),
      createdAt: new Date().toISOString(),
    };
    set({ documents: [created, ...get().documents] });
    return created;
  },

  addDocuments: (caseId, files) => {
    if (files.length === 0) return;

    const createdAt = new Date().toISOString();
    const created: Document[] = files.map((file) => ({
      id: nextId("doc"),
      caseId,
      title: file.name,
      type: detectDocumentType(file.name),
      status: "ready",
      url: "#",
      createdAt,
    }));

    set({ documents: [...created, ...get().documents] });
  },

  deleteDocument: (documentId) =>
    set({
      documents: get().documents.filter((item) => item.id !== documentId),
    }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  toggleAssistant: (open) =>
    set((state) => ({ isAssistantOpen: open ?? !state.isAssistantOpen })),

  sendChatMessage: (text, caseId) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: nextId("message"),
      role: "user",
      text: trimmed,
      timestamp: new Date().toISOString(),
    };
    set({
      chatMessages: [...get().chatMessages, userMessage],
      isAssistantThinking: true,
    });

    window.setTimeout(() => {
      const lower = trimmed.toLowerCase();
      const caseEntities = get().entities.filter(
        (entity) => entity.caseId === caseId
      );
      const invalid = caseEntities.filter(
        (entity) => entity.validationErrors.length > 0
      );

      let reply: ChatMessage;

      if (lower.includes("риск")) {
        reply = {
          id: nextId("message"),
          role: "assistant",
          text: "Проверил договор по делу. Обнаружены следующие риски:",
          findings: ASSISTANT_RISK_FINDINGS,
          timestamp: new Date().toISOString(),
        };
      } else if (lower.includes("инн")) {
        reply = {
          id: nextId("message"),
          role: "assistant",
          text: "Просканировал файлы дела. ИНН найден в уставных документах: 1513000000 (ООО «Альфа-Консалт»). Значение подставлено в карточку контрагента.",
          timestamp: new Date().toISOString(),
        };
      } else if (lower.includes("заполн") || lower.includes("пуст")) {
        get().fillEmptyFieldsWithAI(caseId);
        reply = {
          id: nextId("message"),
          role: "assistant",
          text: "Заполнил пустые обязательные поля значениями из выписки ЕГРН. Проверьте подставленные данные в таблице — все строки готовы к генерации.",
          timestamp: new Date().toISOString(),
        };
      } else if (invalid.length > 0) {
        reply = {
          id: nextId("message"),
          role: "assistant",
          text: `В деле ${invalid.length} из ${caseEntities.length} записей не готовы к генерации. Незаполненные обязательные поля подсвечены красным — можно исправить прямо в таблице или попросить меня заполнить их из файлов.`,
          timestamp: new Date().toISOString(),
        };
      } else {
        reply = {
          id: nextId("message"),
          role: "assistant",
          text: "Все сущности заполнены корректно — пакет документов можно генерировать.",
          timestamp: new Date().toISOString(),
        };
      }

      set({
        chatMessages: [...get().chatMessages, reply],
        isAssistantThinking: false,
      });
    }, 900);
  },

  fillEmptyFieldsWithAI: (caseId) => {
    set({
      entities: get().entities.map((entity) => {
        if (entity.caseId !== caseId) return entity;
        if (entity.validationErrors.length === 0) return entity;

        // Подставляем значения только в поля, которые есть в схеме этого типа.
        const schema = findSchema(get().customSchemas, entity.type);
        const data = { ...entity.data };
        for (const field of schema.fields) {
          const suggestion = AI_SUGGESTED_VALUES[field.key];
          if (suggestion && !(data[field.key] ?? "").trim()) {
            data[field.key] = suggestion;
          }
        }
        return withValidation({ ...entity, data }, schema);
      }),
    });
  },

  startGeneration: (caseId) => {
    if (get().generationStatus === "running") return;

    stopGenerationTimer();

    set({
      generationStatus: "running",
      generationProgress: 0,
      generatedDocuments: [],
      isGenerationSheetOpen: true,
    });

    generationTimerId = window.setInterval(() => {
      const progress = get().generationProgress + 14;

      if (progress < 100) {
        set({ generationProgress: progress });
        return;
      }

      stopGenerationTimer();

      const valid = get()
        .entities.filter((entity) => entity.caseId === caseId)
        .filter((entity) => entity.validationErrors.length === 0);

      const generated: GeneratedDocument[] = [];
      const created: Document[] = [];
      const createdAt = new Date().toISOString();

      const custom = get().customSchemas;

      for (const entity of valid) {
        const schema = findSchema(custom, entity.type);
        // Имя берём из первого поля схемы: у своих типов ключа `name` нет.
        const firstKey = schema.fields[0]?.key ?? "name";
        const entityName =
          entity.data[firstKey]?.trim() || "Без наименования";

        for (const template of schema.templates) {
          const name = `${template}.docx`;
          const id = nextId("generated");

          generated.push({
            id,
            name,
            entityId: entity.id,
            entityName,
          });

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
    }, 150);
  },

  setGenerationSheetOpen: (open) => {
    if (!open) stopGenerationTimer();
    set({
      isGenerationSheetOpen: open,
      ...(open
        ? {}
        : {
            generationStatus: "idle",
            generationProgress: 0,
            isCustomGenerating: false,
          }),
    });
  },

  generateCustomDocument: (caseId, prompt) => {
    const request = prompt.trim();
    if (!request || get().isCustomGenerating) return;

    set({ isCustomGenerating: true });

    window.setTimeout(() => {
      const title = titleFromPrompt(request);
      const id = nextId("generated");
      const name = `${title}.docx`;
      const createdAt = new Date().toISOString();

      set({
        isCustomGenerating: false,
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
            type: "Свободный запрос",
            status: "ready",
            url: "#",
            createdAt,
          },
          ...get().documents,
        ],
      });
    }, 1400);
  },

  toggleDocumentSelection: (documentId) => {
    const selected = get().selectedDocumentIds;
    set({
      selectedDocumentIds: selected.includes(documentId)
        ? selected.filter((id) => id !== documentId)
        : [...selected, documentId],
    });
  },

  clearDocumentSelection: () => set({ selectedDocumentIds: [] }),

  setBatchReviewOpen: (open) => {
    if (!open) stopBatchReviewTimer();
    set({
      isBatchReviewOpen: open,
      ...(open ? {} : { batchReviewStatus: "idle", batchReviewProgress: 0 }),
    });
  },

  startBatchReview: (caseId) => {
    if (get().batchReviewStatus === "running") return;

    const selected = get().selectedDocumentIds;
    const targets = get().documents.filter(
      (item) => item.caseId === caseId && selected.includes(item.id)
    );
    if (targets.length === 0) return;

    stopBatchReviewTimer();
    set({
      isBatchReviewOpen: true,
      batchReviewStatus: "running",
      batchReviewProgress: 0,
      batchReviewResults: [],
    });

    batchReviewTimerId = window.setInterval(() => {
      const progress = get().batchReviewProgress + 13;

      if (progress < 100) {
        set({ batchReviewProgress: progress });
        return;
      }

      stopBatchReviewTimer();

      // Демо-разбор: количество замечаний выводится детерминированно из имени,
      // чтобы результат не «прыгал» при каждом повторном запуске.
      const results: BatchReviewResult[] = targets.map((document, index) => {
        const seed = document.title.length + index;
        return {
          documentId: document.id,
          title: document.title,
          critical: seed % 3 === 0 ? 1 : 0,
          warning: (seed % 3) + 1,
        };
      });

      set({
        batchReviewProgress: 100,
        batchReviewStatus: "done",
        batchReviewResults: results,
      });
    }, 140);
  },

  toggleCaseSelection: (caseId) => {
    const selected = get().selectedCaseIds;
    set({
      selectedCaseIds: selected.includes(caseId)
        ? selected.filter((id) => id !== caseId)
        : [...selected, caseId],
    });
  },

  toggleAllCases: (caseIds) => {
    const selected = get().selectedCaseIds;
    const allSelected =
      caseIds.length > 0 && caseIds.every((id) => selected.includes(id));
    set({ selectedCaseIds: allSelected ? [] : caseIds });
  },

  clearCaseSelection: () => set({ selectedCaseIds: [] }),

  setBulkSheetOpen: (open) => {
    if (!open) stopBulkTimer();
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

    stopBulkTimer();
    set({ bulkStatus: "running", bulkProgress: 0, bulkResults: [] });

    const title = titleFromPrompt(request);
    const name = `${title}.docx`;

    bulkTimerId = window.setInterval(() => {
      const progress = get().bulkProgress + 12;

      if (progress < 100) {
        set({ bulkProgress: progress });
        return;
      }

      stopBulkTimer();

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
    }, 130);
  },

  toggleSidebar: (expanded) =>
    set((state) => ({
      isSidebarExpanded: expanded ?? !state.isSidebarExpanded,
    })),

  setCreateCaseOpen: (open) => set({ isCreateCaseOpen: open }),
}));
