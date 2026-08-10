import type { AiTask, JobStatus } from "@/types/rows";

/**
 * Задачи модели: что подаётся на вход и что ожидается на выходе.
 *
 * Файл общий для приложения и для исполнителя в Edge Function. Приложение по
 * этим типам ставит задание, исполнитель — разбирает. Разойтись они не могут:
 * тип один.
 *
 * ДОБАВЛЕНИЕ НОВОЙ ОПЕРАЦИИ начинается здесь. Порядок целиком описан в
 * docs/AI-BACKEND.md, раздел «Как добавить новую операцию».
 */

export type { AiTask, JobStatus };

/* ------------------------------------------------------------------ */
/*  РАСПОЗНАВАНИЕ                                                      */
/* ------------------------------------------------------------------ */

export interface OcrInput {
  documentId: string;
}

export interface OcrOutput {
  /** Сколько страниц распознано. */
  pages: number;
  /**
   * Сколько из них ушло в модель — за столько и заплачено.
   *
   * Разница с `pages` и есть смысл всей затеи: страницы с текстовым слоем,
   * пустые листы и повторно загруженный файл сюда не попадают.
   */
  billedPages: number;
  /**
   * Откуда взялся текст документа: embedded — из самого файла, vision — модель
   * читала картинки, mixed — и так и так, reused — копия файла с тем же
   * содержимым.
   */
  source: "vision" | "embedded" | "mixed" | "reused";
}

/* ------------------------------------------------------------------ */
/*  ИЗВЛЕЧЕНИЕ РЕКВИЗИТОВ                                              */
/* ------------------------------------------------------------------ */

export interface ExtractInput {
  /** Документ, из которого читаем. Файл исполнитель возьмёт из хранилища сам. */
  documentId: string;
  /** Дело, в которое ляжет объект. */
  caseId: string;
  /**
   * Тип объекта: его описание реквизитов уходит в промпт. Благодаря этому
   * пользовательские типы работают без единой правки кода.
   */
  typeId: string;
}

export interface ExtractedField {
  /** Ключ реквизита из `entity_types.fields`. */
  key: string;
  /** Название реквизита — чтобы интерфейсу не искать его по схеме заново. */
  label: string;
  value: string;
  /**
   * Модель не уверена в значении: оно подставлено, но помечено на проверку.
   * Порог считает исполнитель, наружу выходит уже готовое решение — иначе
   * интерфейс и база разошлись бы в том, что считать неуверенным.
   */
  uncertain: boolean;
  /** Страница исходного файла: по ней интерфейс показывает, откуда взято. */
  page: number | null;
}

export interface ExtractOutput {
  /** Созданная карточка объекта. Без неё интерфейсу некуда вести человека. */
  entityId: string;
  /** Реквизиты, которые действительно легли в карточку. */
  fields: ExtractedField[];
  /** Что модель прочитать не смогла — показываем человеку прямо. */
  missing: string[];
  /**
   * Сколько страниц просмотрено и сколько их всего.
   *
   * Длинный документ уходит в модель не целиком: реквизиты живут в начале, а
   * сорок листов приложений стоят денег и времени. Умолчать об этом нельзя —
   * человек должен понимать, почему поле осталось пустым.
   */
  pagesLooked: number;
  pagesTotal: number;
}

/* ------------------------------------------------------------------ */
/*  РАЗБОР ДОГОВОРА                                                    */
/* ------------------------------------------------------------------ */

export interface ReviewInput {
  documentId: string;
  caseId: string;
}

export interface ReviewFinding {
  level: "critical" | "warning" | "info";
  title: string;
  description: string;
  recommendation?: string;
  /** Номер пункта договора: по нему подсвечивается текст слева. */
  clause?: string;
  paragraphId?: string;
}

export interface ReviewOutput {
  paragraphs: { id: string; clause?: string; text: string }[];
  findings: ReviewFinding[];
}

/* ------------------------------------------------------------------ */
/*  АССИСТЕНТ ПО ДЕЛУ                                                  */
/* ------------------------------------------------------------------ */

export interface AssistantInput {
  caseId: string;
  question: string;
}

export interface AssistantOutput {
  answer: string;
  /** Фрагменты, на которых основан ответ. Без них ответу нельзя верить. */
  citations: { documentId: string; chunkId: string; quote: string }[];
}

/* ------------------------------------------------------------------ */
/*  ВЕКТОРИЗАЦИЯ ФРАГМЕНТОВ                                            */
/* ------------------------------------------------------------------ */

export interface EmbedInput {
  documentId: string;
  caseId: string;
}

export interface EmbedOutput {
  /** Сколько фрагментов проиндексировано. */
  chunks: number;
}

/* ------------------------------------------------------------------ */
/*  СООТВЕТСТВИЕ ЗАДАЧИ ЕЁ ВХОДУ И ВЫХОДУ                              */
/* ------------------------------------------------------------------ */

/**
 * Карта задач. Исполнитель по ней понимает, что разбирать, приложение — что
 * присылать. Задача без записи здесь не поставится: TypeScript не даст.
 */
export interface TaskShapes {
  ocr: { input: OcrInput; output: OcrOutput };
  extract: { input: ExtractInput; output: ExtractOutput };
  review: { input: ReviewInput; output: ReviewOutput };
  assistant: { input: AssistantInput; output: AssistantOutput };
  embed: { input: EmbedInput; output: EmbedOutput };
}

/** Задачи, для которых описан вход и выход. Остальные значения `ai_task` — заготовки. */
export type TypedTask = keyof TaskShapes;

export type TaskInput<T extends TypedTask> = TaskShapes[T]["input"];
export type TaskOutput<T extends TypedTask> = TaskShapes[T]["output"];

/** Состояние задания для интерфейса: форма опрашивает его, пока идёт работа. */
export interface JobState<T extends TypedTask = TypedTask> {
  id: string;
  task: T;
  status: JobStatus;
  /** 0–100. Обработчик обновляет по мере прохождения этапов. */
  progress: number;
  output: TaskOutput<T> | null;
  error: string | null;
}
