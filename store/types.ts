import type {
  BatchReviewResult,
  Case,
  ChatMessage,
  Document,
  Entity,
  EntitySchema,
  ExtractionState,
  FreeformStage,
  GeneratedDocument,
  GenerationStatus,
  RecognizedPage,
  SearchHit,
  TemplateMatch,
} from "@/types";

/**
 * Состояние приложения, разложенное по слоям.
 *
 * Раньше это был один файл на полторы тысячи строк, где вперемешку жили четыре
 * разные вещи: настоящие данные с записью в базу, состояние интерфейса,
 * имитация ответов модели на таймерах и служебный обмен с сервером. Хуже всего
 * было то, что имитация выглядела ровно как рабочий код — понять, что уже
 * работает, а что нарисовано, можно было только чтением построчно.
 *
 * Теперь каждый слой описан отдельно и собран в `useAppStore`. Форма стора для
 * компонентов не изменилась ни на поле: снаружи это по-прежнему один объект.
 */

/* ------------------------------------------------------------------ */
/*  ВСПОМОГАТЕЛЬНЫЕ ТИПЫ                                               */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  ОБМЕН С БАЗОЙ                                                      */
/* ------------------------------------------------------------------ */

export interface SyncSlice {
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
  /** Данные пришли из базы, а не из встроенного набора. */
  isBackedByDatabase: boolean;
  /** Вошедший пользователь. Пока данных нет — null, меню показывает заглушку. */
  viewer: Viewer | null;
  /**
   * Замена встроенного набора данными из базы.
   *
   * Интерфейс целиком построен вокруг этого стора, поэтому подключение базы
   * сделано подменой содержимого, а не переписыванием компонентов: серверная
   * страница читает данные и передаёт их сюда один раз при загрузке.
   */
  hydrate: (snapshot: StoreSnapshot) => void;
}

/* ------------------------------------------------------------------ */
/*  ДЕЛА                                                               */
/* ------------------------------------------------------------------ */

export interface CasesSlice {
  cases: Case[];
  /**
   * Создаёт дело. Возвращает `null`, если база отказала: переходить на страницу
   * дела, которого нет, нельзя.
   */
  createCase: (title: string) => Promise<Case | null>;
}

/* ------------------------------------------------------------------ */
/*  ОБЪЕКТЫ И ИХ ТИПЫ                                                  */
/* ------------------------------------------------------------------ */

export interface EntitiesSlice {
  entities: Entity[];
  /** Типы сущностей, созданные пользователем. */
  customSchemas: EntitySchema[];
  editingCell: EditingCell | null;

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
  isCustomSchemaOpen: boolean;
}

/* ------------------------------------------------------------------ */
/*  ДОКУМЕНТЫ                                                          */
/* ------------------------------------------------------------------ */

export interface DocumentsSlice {
  documents: Document[];
  addDocument: (document: Omit<Document, "id" | "createdAt">) => Document;
  /**
   * Загрузка готовых файлов.
   *
   * `null` вместо дела — файл сам по себе: его загрузили ради распознавания, и
   * в списке документов дела он не появится.
   */
  addDocuments: (
    caseId: string | null,
    files: UploadedFile[]
  ) => Promise<void>;
  deleteDocument: (documentId: string) => void;

  selectedDocumentIds: string[];
  toggleDocumentSelection: (documentId: string) => void;
  /** Выделяет сразу набор документов — например, все файлы дела. */
  selectDocuments: (documentIds: string[]) => void;
  clearDocumentSelection: () => void;
}

/* ------------------------------------------------------------------ */
/*  РАСПОЗНАВАНИЕ                                                      */
/* ------------------------------------------------------------------ */

export interface RecognitionSlice {
  /**
   * Документы, распознавание которых сейчас идёт, и их задания.
   *
   * Ключ — идентификатор документа. Само состояние распознавания живёт в
   * `documents`, здесь только связь с заданием, чтобы понимать, за чем следить
   * и что показывать при ошибке.
   */
  recognitionJobs: Record<string, RecognitionJob>;
  /** Ставит распознавание в очередь и начинает следить за ним. */
  recognizeDocument: (documentId: string) => Promise<void>;
  /** Распознанный текст документа — для просмотра человеком. */
  readDocumentText: (documentId: string) => Promise<string | null>;
  /** То же постранично: видно границы страниц и происхождение каждой. */
  readDocumentPages: (documentId: string) => Promise<RecognizedPage[]>;
  /**
   * Поиск по расшифровкам. Пустой `documentId` — по всем документам
   * пространства, иначе только внутри одного.
   */
  searchDocumentText: (
    query: string,
    documentId?: string | null
  ) => Promise<SearchHit[]>;
  /**
   * Перечитывает состояние одного документа.
   *
   * Нужно там, где документ уже дочитан или упал: наблюдателя за ним нет, а
   * текст ошибки живёт в задании, и без отдельного запроса его не показать.
   */
  refreshRecognition: (documentId: string) => Promise<void>;
  /** Настроена ли работа с моделью: без неё кнопки прячутся. */
  isRecognitionAvailable: boolean;
  /**
   * Возобновляет наблюдение после перезагрузки страницы.
   *
   * Распознавание идёт на сервере и продолжается, пока браузер закрыт. Значит,
   * вернувшись, надо не начинать заново, а снова начать смотреть за теми
   * файлами, которые ещё не дочитаны.
   */
  resumeRecognition: () => Promise<void>;
}

export interface RecognitionJob {
  jobId: string;
  status: "queued" | "running" | "done" | "failed" | "cancelled";
  /** 0–100. Считается по страницам, а не по таймеру. */
  progress: number;
  error: string | null;
}

/* ------------------------------------------------------------------ */
/*  РАБОЧЕЕ ПРОСТРАНСТВО И ОБОЛОЧКА                                    */
/* ------------------------------------------------------------------ */

export interface WorkspaceSlice {
  activeTab: CaseTab;
  setActiveTab: (tab: CaseTab) => void;

  selectedCaseIds: string[];
  toggleCaseSelection: (caseId: string) => void;
  toggleAllCases: (caseIds: string[]) => void;
  clearCaseSelection: () => void;

  isSidebarExpanded: boolean;
  toggleSidebar: (expanded?: boolean) => void;
  isCreateCaseOpen: boolean;
  setCreateCaseOpen: (open: boolean) => void;
}

/* ------------------------------------------------------------------ */
/*  АССИСТЕНТ                                                          */
/* ------------------------------------------------------------------ */

export interface AssistantSlice {
  isAssistantOpen: boolean;
  isAssistantThinking: boolean;
  chatMessages: ChatMessage[];
  toggleAssistant: (open?: boolean) => void;
  sendChatMessage: (text: string, caseId: string) => void;
  fillEmptyFieldsWithAI: (caseId: string) => void;
}

/* ------------------------------------------------------------------ */
/*  ГЕНЕРАЦИЯ ДОКУМЕНТОВ                                               */
/* ------------------------------------------------------------------ */

export interface GenerationSlice {
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

  startGeneration: (caseId: string) => void;
  setGenerationSheetOpen: (open: boolean) => void;
  /** Документ по произвольному текстовому запросу, вне шаблонов. */
  generateCustomDocument: (caseId: string, prompt: string) => void;

  /* Массовая генерация по выбранным делам. */
  isBulkSheetOpen: boolean;
  bulkStatus: GenerationStatus;
  bulkProgress: number;
  bulkResults: BulkGenerationResult[];
  setBulkSheetOpen: (open: boolean) => void;
  /** Создаёт документ по свободному описанию сразу во всех выбранных делах. */
  generateForSelectedCases: (prompt: string) => void;
}

/* ------------------------------------------------------------------ */
/*  РАЗБОР ДОКУМЕНТОВ                                                  */
/* ------------------------------------------------------------------ */

export interface ReviewSlice {
  /* Разбор загруженного файла с переносом реквизитов. */
  extraction: ExtractionState | null;
  isExtractionOpen: boolean;
  /** Разбирает файл и предлагает перенести реквизиты в карточку объекта. */
  startExtraction: (file: UploadedFile) => void;
  setExtractionOpen: (open: boolean) => void;
  /** Переносит распознанные реквизиты в новую сущность дела. */
  applyExtraction: (caseId: string) => void;

  /* Разбор договора прямо из дела. */
  reviewDocumentId: string | null;
  openDocumentReview: (documentId: string) => void;
  closeDocumentReview: () => void;

  /* Пакетная проверка документов на риски. */
  isBatchReviewOpen: boolean;
  batchReviewStatus: GenerationStatus;
  batchReviewProgress: number;
  batchReviewResults: BatchReviewResult[];
  /** Очередь проверки: видно, какой документ разбирается прямо сейчас. */
  batchReviewQueue: { id: string; title: string }[];
  batchReviewCursor: number;
  startBatchReview: (caseId: string) => void;
  setBatchReviewOpen: (open: boolean) => void;
}

/* ------------------------------------------------------------------ */

export type AppState = SyncSlice &
  CasesSlice &
  EntitiesSlice &
  DocumentsSlice &
  RecognitionSlice &
  WorkspaceSlice &
  AssistantSlice &
  GenerationSlice &
  ReviewSlice;

/** Как зовут `set` и `get` внутри слоёв. */
export type StoreSet = (
  partial:
    | Partial<AppState>
    | ((state: AppState) => Partial<AppState>)
) => void;

export type StoreGet = () => AppState;

/** Слой стора: получает те же `set` и `get`, что и обычный создатель zustand. */
export type SliceCreator<T> = (set: StoreSet, get: StoreGet) => T;
