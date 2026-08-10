import type { Json } from "@/types/database";
import type { EntityFieldDefinition } from "@/types/rows";

/**
 * Чтение колонок `jsonb`.
 *
 * Генератор типов знает про такую колонку одно: там лежит какой-то JSON. Это
 * честно — база действительно позволит записать туда что угодно, — но работать
 * с этим в коде невозможно.
 *
 * Здесь единственное место, где «какой-то JSON» становится нашей формой. Не
 * приведением типа вслепую, а проверкой: строка, оказавшаяся не тем, чем
 * должна быть, превращается в пустое значение, а не роняет страницу дела.
 * Данные в этих колонках старше любого нашего кода — миграция, ручная правка
 * или ответ модели могли оставить там что угодно.
 */

/** Реквизиты объекта: словарь строк. */
export function readEntityData(value: Json | null): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const data: Record<string, string> = {};
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === "string") data[key] = item;
    else if (typeof item === "number" || typeof item === "boolean") {
      data[key] = String(item);
    }
  }

  return data;
}

/** Описание реквизитов типа объекта. */
export function readFieldDefinitions(value: Json | null): EntityFieldDefinition[] {
  if (!Array.isArray(value)) return [];

  const fields: EntityFieldDefinition[] = [];

  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;

    const field = item as Record<string, Json | undefined>;
    if (typeof field.key !== "string" || typeof field.label !== "string") {
      continue;
    }

    fields.push({
      key: field.key,
      label: field.label,
      required: field.required === true,
      ...(typeof field.placeholder === "string"
        ? { placeholder: field.placeholder }
        : {}),
      ...(typeof field.width === "number" ? { width: field.width } : {}),
      ...(typeof field.pattern === "string" ? { pattern: field.pattern } : {}),
      ...(typeof field.patternError === "string"
        ? { patternError: field.patternError }
        : {}),
    });
  }

  return fields;
}
