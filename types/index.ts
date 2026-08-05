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

export const CASE_STATUS_META: Record<
  CaseStatus,
  { label: string; badgeClassName: string; dotClassName: string }
> = {
  in_progress: {
    label: "В работе",
    badgeClassName: "border-indigo-200/70 bg-indigo-50 text-indigo-700",
    dotClassName: "bg-indigo-500",
  },
  collecting: {
    label: "Сбор данных",
    badgeClassName: "border-amber-200/70 bg-amber-50 text-amber-700",
    dotClassName: "bg-amber-500",
  },
  active: {
    label: "Активно",
    badgeClassName: "border-emerald-200/70 bg-emerald-50 text-emerald-700",
    dotClassName: "bg-emerald-500",
  },
  archived: {
    label: "В архиве",
    badgeClassName: "border-zinc-200 bg-zinc-100 text-zinc-600",
    dotClassName: "bg-zinc-400",
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

export interface Document {
  id: string;
  caseId: string;
  title: string;
  type: string;
  status: DocumentStatus;
  url: string;
  createdAt: string;
}

export const DOCUMENT_STATUS_META: Record<
  DocumentStatus,
  { label: string; className: string }
> = {
  draft: {
    label: "Черновик",
    className: "border-zinc-200 bg-zinc-100 text-zinc-600",
  },
  ready: {
    label: "Готов",
    className: "border-emerald-200/70 bg-emerald-50 text-emerald-700",
  },
  signed: {
    label: "Подписан",
    className: "border-indigo-200/70 bg-indigo-50 text-indigo-700",
  },
  generating: {
    label: "Генерируется",
    className: "border-amber-200/70 bg-amber-50 text-amber-700",
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

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  /** Если заполнено — сообщение рендерится как набор UI-карточек. */
  findings?: RiskFinding[];
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
    cardClassName: "border-red-200 bg-red-50/70",
    badgeClassName: "border-red-200 bg-red-100 text-red-700",
    iconClassName: "text-red-600",
  },
  warning: {
    label: "Предупреждение",
    cardClassName: "border-amber-200 bg-amber-50/70",
    badgeClassName: "border-amber-200 bg-amber-100 text-amber-700",
    iconClassName: "text-amber-600",
  },
  info: {
    label: "Замечание",
    cardClassName: "border-indigo-200 bg-indigo-50/70",
    badgeClassName: "border-indigo-200 bg-indigo-100 text-indigo-700",
    iconClassName: "text-indigo-600",
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
