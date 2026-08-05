import {
  BUILTIN_SCHEMAS,
  REAL_ESTATE_SCHEMA,
  type Entity,
  type EntitySchema,
} from "@/types";

export interface EntityValidation {
  /** Человекочитаемые ошибки — попадают в Entity.validationErrors. */
  errors: string[];
  /** Ошибки по ключу поля — нужны гриду для красной подсветки ячейки. */
  fieldErrors: Record<string, string>;
  isValid: boolean;
}

/**
 * Находит схему по идентификатору среди встроенных и пользовательских.
 * Если тип неизвестен (например, схему удалили), откатываемся к участку,
 * чтобы грид не падал на «осиротевшей» сущности.
 */
export function findSchema(
  customSchemas: EntitySchema[],
  typeId: string
): EntitySchema {
  return (
    BUILTIN_SCHEMAS.find((schema) => schema.id === typeId) ??
    customSchemas.find((schema) => schema.id === typeId) ??
    REAL_ESTATE_SCHEMA
  );
}

export function validateEntity(
  entity: Entity,
  schema: EntitySchema
): EntityValidation {
  const fieldErrors: Record<string, string> = {};
  const errors: string[] = [];

  for (const field of schema.fields) {
    const value = (entity.data[field.key] ?? "").trim();

    if (!value) {
      if (field.required) {
        const message = `Не заполнено поле «${field.label}»`;
        fieldErrors[field.key] = message;
        errors.push(message);
      }
      continue;
    }

    if (field.pattern && !field.pattern.test(value)) {
      const message =
        field.patternError ?? `Неверный формат поля «${field.label}»`;
      fieldErrors[field.key] = message;
      errors.push(message);
    }
  }

  return { errors, fieldErrors, isValid: errors.length === 0 };
}

/** Пересчитывает validationErrors, не мутируя исходный объект. */
export function withValidation(entity: Entity, schema: EntitySchema): Entity {
  return { ...entity, validationErrors: validateEntity(entity, schema).errors };
}

/** Первая невалидная ячейка — для кнопки «Исправить». */
export function findFirstInvalidCell(
  entities: Entity[],
  customSchemas: EntitySchema[]
): { entityId: string; field: string } | null {
  for (const entity of entities) {
    const schema = findSchema(customSchemas, entity.type);
    const { fieldErrors } = validateEntity(entity, schema);

    for (const field of schema.fields) {
      if (fieldErrors[field.key]) {
        return { entityId: entity.id, field: field.key };
      }
    }
  }
  return null;
}
