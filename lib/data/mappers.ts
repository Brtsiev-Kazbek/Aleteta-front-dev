import type {
  CaseRow,
  DocumentRow,
  EntityRow,
  EntityTypeRow,
} from "@/types/rows";
import type { Case, Document, Entity, EntitySchema } from "@/types";
import { readEntityData, readFieldDefinitions } from "./json";

/**
 * Перевод строк базы в типы интерфейса.
 *
 * Схема специально повторяет форму фронта, поэтому перевод сводится к смене
 * стиля имён. Держим его в одном месте: когда появится ещё одно поле, менять
 * придётся здесь, а не в каждом компоненте.
 */

export function toCase(row: CaseRow): Case {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    tags: row.tags,
    createdAt: row.created_at,
    description: row.description ?? "",
    // Контекстный файл вычисляется отдельно — в строке дела его нет.
    contextFile: "",
  };
}

export function toEntitySchema(row: EntityTypeRow): EntitySchema {
  return {
    id: row.id,
    label: row.label,
    hint: row.hint ?? "",
    isCustom: row.is_custom,
    /*
     * В базе часть описания реквизита необязательна, во фронте — обязательна.
     * Достраиваем недостающее здесь, чтобы компоненты не проверяли каждое поле
     * на существование. Регулярное выражение приходит строкой (POSIX), поэтому
     * собираем RegExp — база и браузер проверяют по одному и тому же шаблону.
     */
    fields: readFieldDefinitions(row.fields).map((field) => ({
      key: field.key,
      label: field.label,
      required: field.required,
      placeholder: field.placeholder ?? "",
      width: field.width ?? 220,
      ...(field.pattern ? { pattern: safeRegExp(field.pattern) } : {}),
      ...(field.patternError ? { patternError: field.patternError } : {}),
    })),
    templates: row.templates,
  };
}

/**
 * Шаблон из базы может оказаться несовместимым с движком регулярных выражений
 * браузера. Падать из-за этого нельзя: пропускаем проверку формата, обязательность
 * поля всё равно проверит база.
 */
function safeRegExp(source: string): RegExp | undefined {
  try {
    return new RegExp(source);
  } catch {
    return undefined;
  }
}

export function toEntity(row: EntityRow): Entity {
  return {
    id: row.id,
    caseId: row.case_id,
    type: row.type_id,
    data: readEntityData(row.data),
    validationErrors: row.validation_errors,
    uncertainFields: row.uncertain_fields ?? [],
  };
}

export function toDocument(row: DocumentRow): Document {
  return {
    id: row.id,
    caseId: row.case_id,
    title: row.title,
    type: row.kind ?? "Файл",
    status: row.status,
    // Ссылку собирает клиент из bucket/path — в базе полного адреса нет.
    url: row.path ?? "#",
    createdAt: row.created_at,
    sizeBytes: row.size_bytes,

    // Состояние распознавания показывается прямо в строке файла.
    ocrStatus: row.ocr_status,
    pagesDone: row.pages_done,
    pageCount: row.page_count,
    textSource: row.text_source,
  };
}
