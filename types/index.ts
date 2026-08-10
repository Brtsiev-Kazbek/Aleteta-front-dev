/* ------------------------------------------------------------------ */
/*  ДЕЛА                                                               */
/* ------------------------------------------------------------------ */

export type CaseStatus = "in_progress" | "collecting" | "active" | "archived";

export interface Case {
  id: string;
  title: string;
  status: CaseStatus;
  tags: string[];
  createdAt: string;
  description: string;
  /** Файл, который AI-ассистент держит в контексте этого дела. */
  contextFile: string;
}

/**
 * Статусы дела набираются как рубрики лендинга: моноширинная строка на
 * прозрачном фоне, цветом отмечена только точка. Плашки с заливкой на
 * продуктовых экранах спорят с содержимым таблиц.
 */
export const CASE_STATUS_META: Record<
  CaseStatus,
  { label: string; badgeClassName: string; dotClassName: string }
> = {
  in_progress: {
    label: "В работе",
    badgeClassName: "border-stone-200 text-stone-600",
    dotClassName: "bg-stone-900",
  },
  collecting: {
    label: "Сбор данных",
    badgeClassName: "border-stone-200 text-stone-600",
    dotClassName: "bg-amber-500",
  },
  active: {
    label: "Активно",
    badgeClassName: "border-stone-200 text-stone-600",
    dotClassName: "bg-emerald-500",
  },
  archived: {
    label: "В архиве",
    badgeClassName: "border-stone-200 text-stone-400",
    dotClassName: "bg-stone-300",
  },
};

/* ------------------------------------------------------------------ */
/*  СУЩНОСТИ ДЛЯ МАССОВОЙ ГЕНЕРАЦИИ                                    */
/* ------------------------------------------------------------------ */

export type BuiltinEntityType = "real_estate" | "legal_entity" | "individual";

/**
 * Значения реквизитов хранятся строками: грид редактирует их инлайн,
 * а шаблоны документов подставляют как есть.
 */
export interface Entity {
  id: string;
  caseId: string;
  /** Идентификатор схемы — встроенной или пользовательской. */
  type: string;
  data: Record<string, string>;
  /** Человекочитаемые ошибки валидации, пересчитываются при изменении. */
  validationErrors: string[];
  /**
   * Реквизиты, в которых модель не уверена при извлечении из файла.
   *
   * Не ошибка: значение подставлено и, скорее всего, верно. Но проверить его
   * должен человек, и он должен видеть — какое именно. Пометка снимается сама,
   * как только значение поправили руками: это делает триггер базы, любому пути
   * правки одинаково.
   */
  uncertainFields: string[];
}

export interface EntityFieldSchema {
  key: string;
  label: string;
  required: boolean;
  placeholder: string;
  width: number;
  /** Проверка формата — применяется только к непустому значению. */
  pattern?: RegExp;
  patternError?: string;
}

export interface EntitySchema {
  id: string;
  label: string;
  /** Пояснение в списке выбора типа. */
  hint: string;
  /** Создана пользователем, а не встроена в систему. */
  isCustom: boolean;
  fields: EntityFieldSchema[];
  /** Документы, которые формируются для сущностей этого типа. */
  templates: string[];
}

export const REAL_ESTATE_SCHEMA: EntitySchema = {
  id: "real_estate",
  label: "Земельный участок",
  hint: "Кадастровый номер, площадь, назначение земель",
  isCustom: false,
  templates: [
    "Договор купли-продажи земельного участка",
    "Акт приёма-передачи",
    "Заявление в Росреестр",
  ],
  fields: [
    {
      key: "name",
      label: "Название",
      required: true,
      placeholder: "Земельный участок №12",
      width: 280,
    },
    {
      key: "cadastralNumber",
      label: "Кадастровый номер",
      required: true,
      placeholder: "15:09:0000000:0000",
      width: 210,
      pattern: /^\d{2}:\d{2}:\d{6,7}:\d{1,4}$/,
      patternError: "Неверный формат. Пример: 15:09:0000000:0000",
    },
    {
      key: "area",
      label: "Площадь",
      required: true,
      placeholder: "440 кв.м.",
      width: 150,
      pattern: /\d/,
      patternError: "Площадь должна содержать число. Пример: 440 кв.м.",
    },
    {
      key: "owner",
      label: "Правообладатель",
      required: true,
      placeholder: "Брциев К. Р.",
      width: 220,
    },
    {
      key: "landUse",
      label: "Назначение земель",
      required: true,
      placeholder: "Для индивидуального жилищного строительства",
      width: 300,
    },
  ],
};

export const LEGAL_ENTITY_SCHEMA: EntitySchema = {
  id: "legal_entity",
  label: "Контрагент (юрлицо)",
  hint: "ИНН, КПП, адрес, директор",
  isCustom: false,
  templates: ["Договор оказания услуг", "Карточка контрагента"],
  fields: [
    {
      key: "name",
      label: "Наименование",
      required: true,
      placeholder: "ООО «Альфа-Консалт»",
      width: 280,
    },
    {
      key: "inn",
      label: "ИНН",
      required: true,
      placeholder: "1513000000",
      width: 170,
      pattern: /^\d{10}$/,
      patternError: "ИНН юрлица состоит из 10 цифр",
    },
    {
      key: "kpp",
      label: "КПП",
      required: true,
      placeholder: "151301001",
      width: 170,
      pattern: /^\d{9}$/,
      patternError: "КПП состоит из 9 цифр",
    },
    {
      key: "address",
      label: "Адрес",
      required: true,
      placeholder: "г. Владикавказ, ул. Мира, д. 10",
      width: 280,
    },
    {
      key: "director",
      label: "Директор",
      required: true,
      placeholder: "Иванов И. И.",
      width: 220,
    },
  ],
};

export const INDIVIDUAL_SCHEMA: EntitySchema = {
  id: "individual",
  label: "Правообладатель (физлицо)",
  hint: "Паспорт, СНИЛС, адрес регистрации",
  isCustom: false,
  templates: [
    "Трудовой договор",
    "Согласие на обработку персональных данных",
  ],
  fields: [
    {
      key: "name",
      label: "ФИО",
      required: true,
      placeholder: "Петров Сергей Сергеевич",
      width: 280,
    },
    {
      key: "passport",
      label: "Паспорт",
      required: true,
      placeholder: "90 12 345678",
      width: 190,
      pattern: /^\d{2} \d{2} \d{6}$/,
      patternError: "Формат паспорта: 90 12 345678",
    },
    {
      key: "snils",
      label: "СНИЛС",
      required: true,
      placeholder: "123-456-789 00",
      width: 190,
      pattern: /^\d{3}-\d{3}-\d{3} \d{2}$/,
      patternError: "Формат СНИЛС: 123-456-789 00",
    },
    {
      key: "registrationAddress",
      label: "Адрес регистрации",
      required: true,
      placeholder: "г. Москва, ул. Тверская, д. 4",
      width: 280,
    },
  ],
};

export const BUILTIN_SCHEMAS: EntitySchema[] = [
  REAL_ESTATE_SCHEMA,
  LEGAL_ENTITY_SCHEMA,
  INDIVIDUAL_SCHEMA,
];

/* ------------------------------------------------------------------ */
/*  ДОКУМЕНТЫ                                                          */
/* ------------------------------------------------------------------ */

export type DocumentStatus = "draft" | "ready" | "signed" | "generating";

/**
 * Состояние распознавания файла.
 *
 * Повторяет перечисление `ocr_status` в базе. Дублирование намеренное: этот
 * модуль описывает мир интерфейса и не должен зависеть от сгенерированных
 * типов схемы — иначе демонстрационный стенд без базы перестанет собираться.
 */
export type OcrStatus = "pending" | "running" | "done" | "failed" | "skipped";

export interface Document {
  id: string;
  /** Пусто — файл загружен вне дела, ради одного лишь распознавания. */
  caseId: string | null;
  title: string;
  type: string;
  status: DocumentStatus;
  url: string;
  createdAt: string;
  /** Размер файла в байтах. У встроенного набора его нет. */
  sizeBytes?: number | null;

  /*
   * Состояние распознавания. Заполняется только у документов из базы: на
   * встроенном наборе распознавать нечего.
   *
   * Держим его прямо на документе, а не отдельным списком, потому что
   * показывается оно там же, где сам файл — строкой в таблице документов. Так
   * не приходится держать два списка в согласии.
   */
  /** pending — ждёт очереди, running — идёт, skipped — текст взят из файла. */
  ocrStatus?: OcrStatus;
  /** Сколько страниц уже распознано: «страница 12 из 18». */
  pagesDone?: number;
  /** Сколько всего страниц. Пока файл не открыли — неизвестно. */
  pageCount?: number | null;
  /** Откуда взялся текст: embedded, vision, mixed, reused. */
  textSource?: string | null;
}

/**
 * Одна распознанная страница.
 *
 * Нужна там, где текст не читают, а проверяют. Происхождение здесь важнее
 * самого текста: страница из текстового слоя перенесена посимвольно и
 * ошибиться в ней нечему, а страницу, прочитанную моделью, стоит сверить с
 * оригиналом — особенно в номерах и датах.
 */
export interface RecognizedPage {
  page: number;
  text: string;
  /** vision — читала модель, embedded — текстовый слой, blank — пустой лист. */
  source: string | null;
  model: string | null;
  /** 0–1, если поставщик её вернул. Обычно не возвращает. */
  confidence: number | null;
}

/**
 * Найденное место в распознанном тексте.
 *
 * `fragment` приходит из базы уже с подсветкой — совпавшие слова обёрнуты в
 * `<mark>`. Разметку не вставляют в разметку: интерфейс режет строку по этим
 * меткам и собирает её из обычных элементов, поэтому текст документа никогда
 * не исполняется как HTML.
 */
export interface SearchHit {
  documentId: string;
  documentTitle: string;
  page: number;
  fragment: string;
}

export const DOCUMENT_STATUS_META: Record<
  DocumentStatus,
  { label: string; className: string }
> = {
  draft: {
    label: "Черновик",
    className: "border-stone-200 text-stone-400",
  },
  ready: {
    label: "Готов",
    className: "border-stone-200 text-stone-600",
  },
  signed: {
    label: "Подписан",
    className: "border-emerald-200 text-emerald-700",
  },
  generating: {
    label: "Генерируется",
    className: "border-amber-200 text-amber-700",
  },
};

/* ------------------------------------------------------------------ */
/*  AI-АССИСТЕНТ                                                       */
/* ------------------------------------------------------------------ */

export type RiskLevel = "critical" | "warning" | "info";

/** Карточка находки, которую ассистент рендерит вместо простого текста. */
export interface RiskFinding {
  id: string;
  level: RiskLevel;
  title: string;
  description: string;
  /** Пункт договора, к которому относится находка. */
  clause: string;
}

/**
 * Ссылка на источник ответа. Ассистент обязан показывать, откуда взял
 * формулировку: документ, пункт и страница — иначе ответ не проверить.
 */
export interface Citation {
  id: string;
  document: string;
  clause: string;
  page: number;
  quote: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  /** Если заполнено — сообщение рендерится как набор UI-карточек. */
  findings?: RiskFinding[];
  /** Источники ответа — пункт и страница конкретного файла дела. */
  citations?: Citation[];
  timestamp: string;
}

export const RISK_LEVEL_META: Record<
  RiskLevel,
  {
    label: string;
    cardClassName: string;
    badgeClassName: string;
    iconClassName: string;
  }
> = {
  critical: {
    label: "Критический риск",
    cardClassName: "border-red-200 bg-red-50/60",
    badgeClassName: "border-red-200 bg-red-50 text-red-700",
    iconClassName: "text-red-600",
  },
  warning: {
    label: "Предупреждение",
    cardClassName: "border-amber-200 bg-amber-50/60",
    badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
    iconClassName: "text-amber-600",
  },
  info: {
    label: "Замечание",
    cardClassName: "border-stone-200 bg-stone-50",
    badgeClassName: "border-stone-200 bg-white text-stone-600",
    iconClassName: "text-stone-500",
  },
};

/* ------------------------------------------------------------------ */
/*  AI-РЕВЬЮ ДОКУМЕНТА (Split-View)                                    */
/* ------------------------------------------------------------------ */

export interface ContractParagraph {
  id: string;
  clause: string;
  text: string;
}

/** Судебный акт, найденный по спорному пункту договора. */
export interface CourtPractice {
  id: string;
  court: string;
  number: string;
  year: string;
  holding: string;
  /** Трактует ли суд условие против вас или в вашу пользу. */
  side: "against" | "favor";
}

export interface DocumentRisk {
  id: string;
  level: RiskLevel;
  title: string;
  description: string;
  recommendation: string;
  /** id абзаца в левой панели, который подсвечивается при клике. */
  paragraphId: string;
  /** Практика по этому пункту — подбирается автоматически. */
  practice?: CourtPractice[];
}

/** Результат проверки одного документа в пакетном разборе. */
export interface BatchReviewResult {
  documentId: string;
  title: string;
  critical: number;
  warning: number;
}

/* ------------------------------------------------------------------ */
/*  РАЗБОР ЗАГРУЖЕННОГО ФАЙЛА (перенос реквизитов в карточку)          */
/* ------------------------------------------------------------------ */

export interface ExtractedField {
  /** Ключ поля в схеме сущности — по нему значение попадает в карточку. */
  key: string;
  label: string;
  value: string;
  /**
   * Значение распознано неуверенно: подставляется, но помечается на
   * проверку — как и обещано на лендинге.
   */
  uncertain: boolean;
  /** Страница файла, откуда взято значение. У витрины её нет. */
  page?: number | null;
}

/**
 * Разбор файла, который идёт на самом деле.
 *
 * Задание живёт на сервере и продолжается, пока вкладка закрыта, — поэтому у
 * состояния есть номер задания, а не только «сколько процентов нарисовать».
 * И поэтому у него есть `error`: работа может не получиться, и у неудачи
 * должно быть место, где её видно.
 */
export interface ExtractionState {
  documentId: string;
  caseId: string;
  /** Тип карточки, выбранный человеком до запуска. */
  typeId: string;
  file: { name: string; sizeBytes: number };
  /** Пока задание не поставлено — null; после этого по нему идёт опрос. */
  jobId: string | null;
  status: "queued" | "running" | "done" | "failed";
  /** 0–100, как его считает исполнитель. */
  progress: number;
  fields: ExtractedField[];
  /** Реквизиты, которых модель в документе не нашла. */
  missing: string[];
  /**
   * Сколько страниц просмотрено и сколько их всего. Длинный документ уходит в
   * модель не целиком, и умолчать об этом нельзя.
   */
  pagesLooked: number | null;
  pagesTotal: number | null;
  /** Созданная карточка: разбор кладёт реквизиты сразу, без подтверждения. */
  entityId: string | null;
  error: string | null;
}

/* ------------------------------------------------------------------ */
/*  ВИТРИНА НА РАБОЧЕМ СТОЛЕ                                           */
/* ------------------------------------------------------------------ */

/**
 * Разбор «как будто».
 *
 * На рабочем столе можно нажать «перенести реквизиты из файла», не загрузив
 * файл никуда: это витрина, показывающая, как работа выглядит. Настоящее
 * задание там поставить не из чего — документа в базе нет.
 *
 * Держим это отдельным состоянием нарочно. Одно поле на имитацию и на
 * настоящую работу означало бы, что где-то в интерфейсе они смешаются, и
 * отличить нарисованное от сделанного станет нельзя — ни человеку, ни нам.
 */

/** Шаги разбора — те же, что показаны на лендинге. */
export const EXTRACTION_STEPS = [
  "Распознавание текста",
  "Поиск реквизитов",
  "Сверка форматов",
] as const;

/** Правило разбора: какой файл во что превращается. */
export interface ExtractionRecipe {
  id: string;
  /** Подстроки в имени файла, по которым узнаём тип документа. */
  match: string[];
  /** Тип сущности, в карточку которого переносятся реквизиты. */
  schemaId: BuiltinEntityType;
  /** Как называется карточка-приёмник в интерфейсе. */
  targetLabel: string;
  fields: ExtractedField[];
}

export interface DemoExtractionState {
  file: { name: string; sizeBytes: number };
  recipe: ExtractionRecipe;
  /** −1 — ещё не начали, далее индекс текущего шага, 3 — разбор закончен. */
  step: number;
  status: GenerationStatus;
  /** Реквизиты уже перенесены в карточку. */
  applied: boolean;
}

/* ------------------------------------------------------------------ */
/*  ГЕНЕРАЦИЯ ПАКЕТА                                                   */
/* ------------------------------------------------------------------ */

export type GenerationStatus = "idle" | "running" | "done";

/** Псевдо-группа для документов, созданных свободным запросом. */
export const CUSTOM_REQUEST_GROUP = "custom-request";

export interface GeneratedDocument {
  id: string;
  name: string;
  /** id сущности либо CUSTOM_REQUEST_GROUP для свободного запроса. */
  entityId: string;
  entityName: string;
}

/* ------------------------------------------------------------------ */
/*  ДОКУМЕНТ ПО СВОБОДНОМУ ЗАПРОСУ                                     */
/* ------------------------------------------------------------------ */

/**
 * Свободный запрос проходит две видимые стадии: сначала система ищет
 * подходящий шаблон, потом составляет документ. Пользователю важно знать,
 * подставились реквизиты в готовую форму или документ собран с нуля.
 */
export type FreeformStage = "idle" | "searching" | "composing" | "done";

export interface TemplateMatch {
  /** Нашёлся ли готовый шаблон под запрос. */
  found: boolean;
  /** Название шаблона, если нашёлся. */
  name: string;
}
