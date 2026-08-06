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

/** ИНН: 10 знаков у организации, 12 у предпринимателя. Проверяем и контрольные цифры. */
export function validateInn(value: string): string | null {
  const inn = value.trim();
  if (!inn) return null;
  if (!/^\d{10}$|^\d{12}$/.test(inn)) {
    return "ИНН состоит из 10 цифр у организации или 12 у предпринимателя.";
  }

  const digits = inn.split("").map(Number);
  const checksum = (weights: number[]): number =>
    weights.reduce((sum, weight, index) => sum + weight * digits[index]!, 0) % 11 % 10;

  if (digits.length === 10) {
    if (checksum([2, 4, 10, 3, 5, 9, 4, 6, 8]) !== digits[9]) {
      return "ИНН не проходит проверку контрольной цифры.";
    }
    return null;
  }

  const first = checksum([7, 2, 4, 10, 3, 5, 9, 4, 6, 8]);
  const second = checksum([3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8]);
  if (first !== digits[10] || second !== digits[11]) {
    return "ИНН не проходит проверку контрольных цифр.";
  }
  return null;
}
