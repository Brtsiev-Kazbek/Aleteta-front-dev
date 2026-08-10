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
 * Находит схему по идентификатору.
 *
 * ПОРЯДОК ПОИСКА ВАЖЕН, и стоил он отдельной поломки. Раньше сначала
 * просматривались `BUILTIN_SCHEMAS` — встроенные типы, описанные в коде со
 * строковыми идентификаторами вроде `real_estate`. Но при работе с базой те же
 * самые типы приходят строками таблицы `entity_types`, и идентификатор у них
 * uuid. Объект, созданный в базе, ни одному строковому имени не соответствовал,
 * поиск проваливался до отката — и любая карточка рисовалась схемой участка,
 * молча и правдоподобно.
 *
 * Поэтому первым идёт переданный список: он приходит из базы и главнее.
 * `BUILTIN_SCHEMAS` остаются как режим без базы — на свежем клоне без
 * переменных окружения стенд открывается на встроенном наборе.
 *
 * Откат к участку — на случай удалённого типа: грид не должен падать на
 * «осиротевшей» сущности.
 */
export function findSchema(
  schemas: EntitySchema[],
  typeId: string
): EntitySchema {
  return (
    schemas.find((schema) => schema.id === typeId) ??
    BUILTIN_SCHEMAS.find((schema) => schema.id === typeId) ??
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
  schemas: EntitySchema[]
): { entityId: string; field: string } | null {
  for (const entity of entities) {
    const schema = findSchema(schemas, entity.type);
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
