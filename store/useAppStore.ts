import { create } from "zustand";

import { createCaseAction } from "@/app/actions/cases";
import {
  addEntityAction,
  archiveEntitySchemaAction,
  createEntitySchemaAction,
  deleteEntityAction,
  duplicateEntityAction,
  updateEntityDataAction,
  updateEntityFieldAction,
} from "@/app/actions/entities";
import {
  deleteDocumentAction,
  prepareDocumentUploadAction,
  registerDocumentAction,
} from "@/app/actions/documents";
import type { ActionResult } from "@/lib/actions/result";
import { createClient } from "@/lib/supabase/client";
import {
  ASSISTANT_CITATIONS,
  ASSISTANT_RISK_FINDINGS,
  EXTRACTION_RECIPES,
  INITIAL_CHAT_MESSAGES,
  INN_CITATION,
  MOCK_CASES,
  MOCK_DOCUMENTS,
  MOCK_ENTITIES,
} from "@/data/mock-data";
import { matchFreeformTemplate } from "@/lib/templates";
import { plural } from "@/lib/utils";
import { findSchema, withValidation } from "@/lib/validation";
import {
  CUSTOM_REQUEST_GROUP,
  EXTRACTION_STEPS,
  type BatchReviewResult,
  type Case,
  type ChatMessage,
  type Document,
  type Entity,
  type EntityFieldSchema,
  type EntitySchema,
  type ExtractionRecipe,
  type ExtractionState,
  type FreeformStage,
  type GeneratedDocument,
  type GenerationStatus,
  type TemplateMatch,
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
  /**
   * Само содержимое. Есть только у файла, выбранного человеком: на
   * демонстрационных примерах его нет, и в хранилище такой файл не уезжает.
   */
  file?: File;
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
  /** Стадия свободного запроса: поиск шаблона → составление → готово. */
  freeformStage: FreeformStage;
  /** Нашёлся ли готовый шаблон под последний свободный запрос. */
  templateMatch: TemplateMatch | null;

  /* --- Разбор загруженного файла --- */
  extraction: ExtractionState | null;
  isExtractionOpen: boolean;

  /* --- Разбор договора прямо из дела --- */
  reviewDocumentId: string | null;

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
  /** Очередь проверки: видно, какой документ разбирается прямо сейчас. */
  batchReviewQueue: { id: string; title: string }[];
  batchReviewCursor: number;

  /* --- Оболочка --- */
  isSidebarExpanded: boolean;
  isCreateCaseOpen: boolean;
  isCustomSchemaOpen: boolean;

  /* --- Обмен с базой --- */
  /**
   * Отказ последней записи. Правка в интерфейсе применяется сразу, не дожидаясь
   * ответа базы, — иначе таблица «залипает» на каждой ячейке. Плата за это:
   * если запись не прошла, человека нужно об этом известить, а изменение
   * откатить.
   */
  syncError: string | null;
  dismissSyncError: () => void;
  /** Сколько записей сейчас в полёте — для индикатора «сохраняется». */
  pendingWrites: number;

  /* --- Действия --- */
  updateEntityField: (entityId: string, field: string, value: string) => void;
  addEntity: (caseId: string, typeId: string) => void;
  deleteEntity: (entityId: string) => void;
  duplicateEntity: (entityId: string) => void;
  setEditingCell: (cell: EditingCell | null) => void;

  /**
   * Создаёт пользовательский тип объекта. Тип общий для всей рабочей
   * области: он появляется в списке типов любого дела. Если передан `caseId`,
   * в это дело дополнительно добавляется пустой объект нового типа.
   */
  createCustomSchema: (
    draft: CustomSchemaDraft,
    caseId?: string
  ) => Promise<void>;
  setCustomSchemaOpen: (open: boolean) => void;
  /** Удаляет пользовательский тип вместе с объектами этого типа. */
  deleteCustomSchema: (schemaId: string) => void;

  /**
   * Создаёт дело. Возвращает `null`, если база отказала: переходить на страницу
   * дела, которого нет, нельзя.
   */
  createCase: (title: string) => Promise<Case | null>;
  addDocument: (document: Omit<Document, "id" | "createdAt">) => Document;
  /** Загрузка готовых файлов во вкладку «Документы» дела. */
  addDocuments: (caseId: string, files: UploadedFile[]) => Promise<void>;
  deleteDocument: (documentId: string) => void;

  /** Разбирает файл и предлагает перенести реквизиты в карточку объекта. */
  startExtraction: (file: UploadedFile) => void;
  setExtractionOpen: (open: boolean) => void;
  /** Переносит распознанные реквизиты в новую сущность дела. */
  applyExtraction: (caseId: string) => void;

  /** Открывает разбор конкретного документа дела по пунктам. */
  openDocumentReview: (documentId: string) => void;
  closeDocumentReview: () => void;

  setActiveTab: (tab: CaseTab) => void;
  toggleAssistant: (open?: boolean) => void;
  sendChatMessage: (text: string, caseId: string) => void;
  fillEmptyFieldsWithAI: (caseId: string) => void;

  startGeneration: (caseId: string) => void;
  setGenerationSheetOpen: (open: boolean) => void;
  /** Документ по произвольному текстовому запросу, вне шаблонов. */
  generateCustomDocument: (caseId: string, prompt: string) => void;

  toggleDocumentSelection: (documentId: string) => void;
  /** Выделяет сразу набор документов — например, все файлы дела. */
  selectDocuments: (documentIds: string[]) => void;
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

  /**
   * Замена встроенного набора данными из базы.
   *
   * Интерфейс целиком построен вокруг этого стора, поэтому подключение базы
   * сделано подменой содержимого, а не переписыванием компонентов: серверная
   * страница читает данные и передаёт их сюда один раз при загрузке.
   */
  hydrate: (snapshot: StoreSnapshot) => void;
  /** Данные пришли из базы, а не из встроенного набора. */
  isBackedByDatabase: boolean;
  /** Вошедший пользователь. Пока данных нет — null, меню показывает заглушку. */
  viewer: Viewer | null;
}

/** Вошедший пользователь: имя в меню и название текущего пространства. */
export interface Viewer {
  fullName: string;
  email: string;
  workspaceName: string;
}

/** Срез данных, приходящий с сервера. Отсутствующие части остаются как есть. */
export interface StoreSnapshot {
  viewer?: Viewer;
  cases?: Case[];
  entities?: Entity[];
  documents?: Document[];
  customSchemas?: EntitySchema[];
}

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

/* ------------------------------------------------------------------ */
/*  ОБМЕН С БАЗОЙ                                                      */
/* ------------------------------------------------------------------ */

/**
 * Изменения применяются к состоянию сразу, а запись в базу идёт следом.
 *
 * Обратный порядок — ждать ответ и только потом рисовать — на таблице
 * реквизитов невыносим: каждое поле замирало бы на время круга до сервера.
 * Расплата за отзывчивость честная: если база отказала, изменение
 * откатывается, а человек видит причину.
 *
 * Когда базы нет (демонстрационный стенд, свежий клон без переменных
 * окружения), сюда просто не заходят: `isBackedByDatabase` остаётся false, и
 * стор работает как раньше — на встроенном наборе.
 */
async function sync<T>(
  request: Promise<ActionResult<T>>,
  handlers: {
    /** Что сделать с тем, что вернула база: обычно — подменить временный id. */
    onSuccess?: (data: T) => void;
    /** Откат: изменение, применённое до ответа, оказалось непринятым. */
    onFailure?: () => void;
    fallback: string;
  }
): Promise<T | null> {
  useAppStore.setState((state) => ({ pendingWrites: state.pendingWrites + 1 }));

  try {
    const result = await request;

    if (!result.ok) {
      handlers.onFailure?.();
      useAppStore.setState({ syncError: result.error || handlers.fallback });
      return null;
    }

    const data = (result.data ?? null) as T | null;
    if (data !== null) handlers.onSuccess?.(data);
    return data;
  } catch (caught) {
    handlers.onFailure?.();
    useAppStore.setState({
      syncError: caught instanceof Error ? caught.message : handlers.fallback,
    });
    return null;
  } finally {
    useAppStore.setState((state) => ({
      pendingWrites: Math.max(0, state.pendingWrites - 1),
    }));
  }
}

/** Работает ли стор поверх базы или показывает встроенный набор. */
function isRemote(): boolean {
  return useAppStore.getState().isBackedByDatabase;
}

/** Подменяет временный идентификатор на выданный базой — в каждом списке. */
function replaceEntityId(temporaryId: string, entity: Entity) {
  useAppStore.setState((state) => ({
    entities: state.entities.map((item) =>
      item.id === temporaryId ? entity : item
    ),
    editingCell:
      state.editingCell?.entityId === temporaryId
        ? { entityId: entity.id, field: state.editingCell.field }
        : state.editingCell,
  }));
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

/** Таймер разбора загруженного файла. */
let extractionTimerId: number | null = null;

function stopExtractionTimer() {
  if (extractionTimerId !== null) {
    window.clearInterval(extractionTimerId);
    extractionTimerId = null;
  }
}

/** Таймеры стадий свободного запроса — гасятся при закрытии шторки. */
let freeformTimers: number[] = [];

function stopFreeformTimers() {
  for (const id of freeformTimers) window.clearTimeout(id);
  freeformTimers = [];
}

/**
 * Подбирает рецепт разбора по имени файла. Если тип документа не узнан,
 * берём следующий рецепт по кругу: демонстрация должна показывать разные
 * карточки-приёмники, а не одну и ту же выписку.
 */
let recipeCursor = 0;

function pickRecipe(fileName: string): ExtractionRecipe {
  const lower = fileName.toLowerCase();
  const matched = EXTRACTION_RECIPES.find((recipe) =>
    recipe.match.some((keyword) => lower.includes(keyword))
  );
  if (matched) return matched;

  const fallback =
    EXTRACTION_RECIPES[recipeCursor % EXTRACTION_RECIPES.length] ??
    EXTRACTION_RECIPES[0]!;
  recipeCursor += 1;
  return fallback;
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

  isBackedByDatabase: false,
  viewer: null,
  syncError: null,
  pendingWrites: 0,

  isSidebarExpanded: false,
  isCreateCaseOpen: false,
  isCustomSchemaOpen: false,

  freeformStage: "idle",
  templateMatch: null,
  extraction: null,
  isExtractionOpen: false,
  reviewDocumentId: null,
  batchReviewQueue: [],
  batchReviewCursor: 0,

  dismissSyncError: () => set({ syncError: null }),

  updateEntityField: (entityId, field, value) => {
    const custom = get().customSchemas;
    const previous = get().entities.find((entity) => entity.id === entityId);

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

    if (!isRemote() || !previous) return;

    void sync(updateEntityFieldAction(entityId, field, value), {
      /*
       * Ответ базы кладём целиком: список ошибок в нём пересчитан триггером,
       * и он главнее того, что насчитал браузер. Расхождение возможно — в базе
       * шаблон проверки хранится строкой POSIX, а не выражением JavaScript.
       */
      onSuccess: (entity) => replaceEntityId(entityId, entity),
      onFailure: () =>
        set({
          entities: get().entities.map((entity) =>
            entity.id === entityId ? previous : entity
          ),
        }),
      fallback: "Не удалось сохранить значение.",
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

    if (!isRemote()) return;

    void sync(addEntityAction(caseId, typeId), {
      onSuccess: (created) => replaceEntityId(entity.id, created),
      onFailure: () =>
        set({
          entities: get().entities.filter((item) => item.id !== entity.id),
          editingCell:
            get().editingCell?.entityId === entity.id
              ? null
              : get().editingCell,
        }),
      fallback: "Не удалось добавить объект.",
    });
  },

  createCustomSchema: async (draft, caseId) => {
    const label = draft.label.trim() || "Свой тип объекта";

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

    // Объект нового типа заводим только если тип создают внутри дела.
    const entity = caseId
      ? withValidation(
          {
            id: nextId("entity"),
            caseId,
            type: schema.id,
            data: {},
            validationErrors: [],
          },
          schema
        )
      : null;

    set({
      customSchemas: [...get().customSchemas, schema],
      entities: entity ? [...get().entities, entity] : get().entities,
      isCustomSchemaOpen: false,
      editingCell:
        entity && safeFields[0]
          ? { entityId: entity.id, field: safeFields[0].key }
          : get().editingCell,
    });

    if (!isRemote()) return;

    const created = await sync(
      createEntitySchemaAction(
        label,
        draft.fields.map(({ label: fieldLabel, required }) => ({
          label: fieldLabel,
          required,
        }))
      ),
      {
        /*
         * Тип получил настоящий идентификатор — переписываем его и у самого
         * типа, и у объектов, которые успели на него сослаться. Иначе объект
         * останется висеть на временном идентификаторе, и после перезагрузки
         * страницы схема для него не найдётся.
         */
        onSuccess: (saved) =>
          set({
            customSchemas: get().customSchemas.map((item) =>
              item.id === schema.id ? saved : item
            ),
            entities: get().entities.map((item) =>
              item.type === schema.id ? { ...item, type: saved.id } : item
            ),
          }),
        onFailure: () =>
          set({
            customSchemas: get().customSchemas.filter(
              (item) => item.id !== schema.id
            ),
            entities: get().entities.filter((item) => item.type !== schema.id),
          }),
        fallback: "Не удалось создать тип.",
      }
    );

    if (!created || !caseId || !entity) return;

    await sync(addEntityAction(caseId, created.id), {
      onSuccess: (saved) => replaceEntityId(entity.id, saved),
      onFailure: () =>
        set({
          entities: get().entities.filter((item) => item.id !== entity.id),
        }),
      fallback: "Тип создан, но объект добавить не удалось.",
    });
  },

  setCustomSchemaOpen: (open) => set({ isCustomSchemaOpen: open }),

  deleteCustomSchema: (schemaId) => {
    const schema = get().customSchemas.find((item) => item.id === schemaId);
    const orphaned = get().entities.filter((entity) => entity.type === schemaId);

    set({
      customSchemas: get().customSchemas.filter(
        (item) => item.id !== schemaId
      ),
      // Объекты осиротевшего типа держать негде — убираем вместе с типом.
      entities: get().entities.filter((entity) => entity.type !== schemaId),
    });

    if (!isRemote() || !schema) return;

    void sync(archiveEntitySchemaAction(schemaId), {
      onFailure: () =>
        set({
          customSchemas: [...get().customSchemas, schema],
          entities: [...get().entities, ...orphaned],
        }),
      fallback: "Не удалось удалить тип.",
    });
  },

  deleteEntity: (entityId) => {
    const removed = get().entities.find((entity) => entity.id === entityId);
    const position = get().entities.findIndex(
      (entity) => entity.id === entityId
    );

    set({
      entities: get().entities.filter((entity) => entity.id !== entityId),
      editingCell:
        get().editingCell?.entityId === entityId ? null : get().editingCell,
    });

    if (!isRemote() || !removed) return;

    void sync(deleteEntityAction(entityId), {
      onFailure: () => {
        // Возвращаем на то же место: строка, «перепрыгнувшая» в конец таблицы,
        // читается как ещё одна ошибка.
        const entities = [...get().entities];
        entities.splice(Math.max(0, position), 0, removed);
        set({ entities });
      },
      fallback: "Не удалось удалить объект.",
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

    if (!isRemote()) return;

    void sync(duplicateEntityAction(entityId), {
      onSuccess: (saved) => replaceEntityId(copy.id, saved),
      onFailure: () =>
        set({
          entities: get().entities.filter((entity) => entity.id !== copy.id),
        }),
      fallback: "Не удалось скопировать объект.",
    });
  },

  setEditingCell: (cell) => set({ editingCell: cell }),

  createCase: async (title) => {
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

    if (!isRemote()) return newCase;

    /*
     * Здесь ответ базы ждём, в отличие от правки ячейки: сразу после создания
     * дела человека переносит на его страницу, а идти на страницу дела с
     * временным идентификатором некуда — после перезагрузки его не найти.
     */
    const saved = await sync(createCaseAction(newCase.title), {
      onSuccess: (created) =>
        set({
          cases: get().cases.map((item) =>
            item.id === newCase.id ? created : item
          ),
        }),
      onFailure: () =>
        set({ cases: get().cases.filter((item) => item.id !== newCase.id) }),
      fallback: "Не удалось создать дело.",
    });

    return saved;
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

  addDocuments: async (caseId, files) => {
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

    if (!isRemote()) return;

    /*
     * Файл уезжает в хранилище прямо из браузера, минуя серверное действие:
     * предел на тело действия — мегабайты, а скан договора весит десятки.
     * Сервер выдаёт путь и заводит строку, содержимое идёт напрямую.
     */
    await Promise.all(
      files.map(async (picked, index) => {
        const placeholder = created[index];
        if (!placeholder) return;

        const drop = () =>
          set({
            documents: get().documents.filter(
              (item) => item.id !== placeholder.id
            ),
          });

        // У демонстрационного примера содержимого нет — грузить нечего.
        if (!picked.file) {
          drop();
          return;
        }

        const target = await sync(
          prepareDocumentUploadAction(caseId, picked.name),
          { onFailure: drop, fallback: "Не удалось подготовить загрузку." }
        );
        if (!target) return;

        const supabase = createClient();
        const { error } = await supabase.storage
          .from(target.bucket)
          .upload(target.path, picked.file, {
            contentType: picked.file.type || undefined,
            upsert: false,
          });

        if (error) {
          drop();
          set({ syncError: `Файл «${picked.name}» не загрузился: ${error.message}` });
          return;
        }

        await sync(
          registerDocumentAction({
            caseId,
            title: picked.name,
            kind: detectDocumentType(picked.name),
            path: target.path,
            mimeType: picked.file.type || undefined,
            sizeBytes: picked.sizeBytes,
          }),
          {
            onSuccess: (document) =>
              set({
                documents: get().documents.map((item) =>
                  item.id === placeholder.id ? document : item
                ),
              }),
            onFailure: drop,
            fallback: "Файл загружен, но запись о нём не сохранилась.",
          }
        );
      })
    );
  },

  deleteDocument: (documentId) => {
    const removed = get().documents.find((item) => item.id === documentId);

    set({
      documents: get().documents.filter((item) => item.id !== documentId),
      selectedDocumentIds: get().selectedDocumentIds.filter(
        (id) => id !== documentId
      ),
      reviewDocumentId:
        get().reviewDocumentId === documentId ? null : get().reviewDocumentId,
    });

    if (!isRemote() || !removed) return;

    void sync(deleteDocumentAction(documentId), {
      onFailure: () => set({ documents: [removed, ...get().documents] }),
      fallback: "Не удалось удалить документ.",
    });
  },

  startExtraction: (file) => {
    stopExtractionTimer();

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

    extractionTimerId = window.setInterval(() => {
      const current = get().extraction;
      if (!current) {
        stopExtractionTimer();
        return;
      }

      const nextStep = current.step + 1;

      if (nextStep < EXTRACTION_STEPS.length) {
        set({ extraction: { ...current, step: nextStep } });
        return;
      }

      stopExtractionTimer();
      set({
        extraction: {
          ...current,
          step: EXTRACTION_STEPS.length,
          status: "done",
        },
      });
    }, 850);
  },

  setExtractionOpen: (open) => {
    if (!open) {
      stopExtractionTimer();
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

    if (!isRemote()) return;

    /*
     * Двумя запросами, а не одним: объект сначала должен появиться в базе,
     * чтобы получить идентификатор, и только потом в него ложатся реквизиты.
     * Вставить всё разом мешает триггер — он считает валидность по типу, а тип
     * известен только после вставки.
     */
    void (async () => {
      const created = await sync(addEntityAction(caseId, schema.id), {
        onSuccess: (saved) => replaceEntityId(entity.id, saved),
        onFailure: () =>
          set({
            entities: get().entities.filter((item) => item.id !== entity.id),
          }),
        fallback: "Не удалось перенести реквизиты.",
      });

      if (!created) return;

      await sync(updateEntityDataAction(created.id, data), {
        onSuccess: (saved) => replaceEntityId(created.id, saved),
        fallback: "Объект создан, но реквизиты не сохранились.",
      });
    })();
  },

  openDocumentReview: (documentId) => set({ reviewDocumentId: documentId }),

  closeDocumentReview: () => set({ reviewDocumentId: null }),

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
          citations: [INN_CITATION],
          timestamp: new Date().toISOString(),
        };
      } else if (
        lower.includes("формулировк") ||
        lower.includes("найди") ||
        lower.includes("найти") ||
        lower.includes("где ")
      ) {
        // Поиск формулировки по всем файлам дела — ответ обязательно
        // сопровождается ссылкой на пункт и страницу источника.
        reply = {
          id: nextId("message"),
          role: "assistant",
          text: "Нашёл в материалах дела два фрагмента по вашему запросу. Формулировки привожу дословно — ниже указано, откуда они взяты.",
          citations: ASSISTANT_CITATIONS,
          timestamp: new Date().toISOString(),
        };
      } else if (lower.includes("заполн") || lower.includes("пуст")) {
        get().fillEmptyFieldsWithAI(caseId);
        reply = {
          id: nextId("message"),
          role: "assistant",
          text: "Заполнил пустые обязательные поля значениями из выписки ЕГРН. Проверьте подставленные данные в таблице — все строки готовы к генерации.",
          citations: ASSISTANT_CITATIONS.filter((item) =>
            item.document.includes("ЕГРН")
          ),
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
    // Что именно подставили — нужно и для отката, и для записи в базу.
    const patches = new Map<string, Record<string, string>>();

    set({
      entities: get().entities.map((entity) => {
        if (entity.caseId !== caseId) return entity;
        if (entity.validationErrors.length === 0) return entity;

        // Подставляем значения только в поля, которые есть в схеме этого типа.
        const schema = findSchema(get().customSchemas, entity.type);
        const patch: Record<string, string> = {};
        for (const field of schema.fields) {
          const suggestion = AI_SUGGESTED_VALUES[field.key];
          if (suggestion && !(entity.data[field.key] ?? "").trim()) {
            patch[field.key] = suggestion;
          }
        }

        if (Object.keys(patch).length === 0) return entity;
        patches.set(entity.id, patch);

        return withValidation(
          { ...entity, data: { ...entity.data, ...patch } },
          schema
        );
      }),
    });

    if (!isRemote()) return;

    for (const [entityId, patch] of patches) {
      void sync(updateEntityDataAction(entityId, patch), {
        onSuccess: (saved) => replaceEntityId(entityId, saved),
        fallback: "Не удалось сохранить подставленные реквизиты.",
      });
    }
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
    if (!open) {
      stopGenerationTimer();
      stopFreeformTimers();
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

    stopFreeformTimers();

    // Сначала показываем поиск шаблона: пользователю важно понимать,
    // подставились реквизиты в готовую форму или документ пишется с нуля.
    set({
      isCustomGenerating: true,
      freeformStage: "searching",
      templateMatch: null,
    });

    freeformTimers.push(
      window.setTimeout(() => {
        set({
          freeformStage: "composing",
          templateMatch: matchFreeformTemplate(request),
        });
      }, 900)
    );

    freeformTimers.push(
      window.setTimeout(() => {
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
      }, 2400)
    );
  },

  toggleDocumentSelection: (documentId) => {
    const selected = get().selectedDocumentIds;
    set({
      selectedDocumentIds: selected.includes(documentId)
        ? selected.filter((id) => id !== documentId)
        : [...selected, documentId],
    });
  },

  selectDocuments: (documentIds) =>
    set({ selectedDocumentIds: documentIds }),

  clearDocumentSelection: () => set({ selectedDocumentIds: [] }),

  setBatchReviewOpen: (open) => {
    if (!open) stopBatchReviewTimer();
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

    stopBatchReviewTimer();
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
    batchReviewTimerId = window.setInterval(() => {
      const cursor = get().batchReviewCursor;
      const document = targets[cursor];

      if (!document) {
        stopBatchReviewTimer();
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

      if (isLast) stopBatchReviewTimer();

      set({
        batchReviewResults: [...get().batchReviewResults, result],
        batchReviewCursor: nextCursor,
        batchReviewProgress: (nextCursor / targets.length) * 100,
        batchReviewStatus: isLast ? "done" : "running",
      });
    }, 780);
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

  hydrate: (snapshot) =>
    set((state) => ({
      viewer: snapshot.viewer ?? state.viewer,
      cases: snapshot.cases ?? state.cases,
      entities: snapshot.entities ?? state.entities,
      documents: snapshot.documents ?? state.documents,
      customSchemas: snapshot.customSchemas ?? state.customSchemas,
      isBackedByDatabase: true,
    })),
}));
