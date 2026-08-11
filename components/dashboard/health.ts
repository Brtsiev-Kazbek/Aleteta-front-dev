"use client";

import { useMemo } from "react";

import { findSchema, validateEntity } from "@/lib/validation";
import { useAppStore } from "@/store/useAppStore";
import type { Case, Entity, EntitySchema } from "@/types";

/**
 * Состояние рабочего пространства целиком.
 *
 * ЗАЧЕМ. Раньше «что у меня не так» можно было узнать только зайдя в каждое
 * дело по очереди: обзор дела считает готовность внутри одного дела и ничего не
 * знает о соседних. На пяти делах это пять переходов ради ответа «всё в
 * порядке», и его переставали спрашивать вовсе — а потом упирались в
 * заблокированную генерацию.
 *
 * Здесь тот же расчёт, но поверх всех дел разом.
 *
 * ПОЧЕМУ ПРОВЕРЯЕМ ЗАНОВО, А НЕ БЕРЁМ `validationErrors` ИЗ ОБЪЕКТА. Поле в
 * объекте — снимок на момент последней записи, и после правки в соседней
 * вкладке оно устаревает. Проверка по схеме стоит дёшево и всегда честна.
 *
 * ДВА РАЗНЫХ ПОВОДА позвать человека, и путать их нельзя. Ошибка — пустое
 * обязательное поле или неверный формат: генерация заблокирована. Пометка «модель
 * не уверена» — значение подставлено при разборе файла и, скорее всего, верно, но
 * его никто не подтверждал. Первое чинят, второе подтверждают.
 */

export interface AttentionItem {
  entity: Entity;
  schema: EntitySchema;
  caseItem: Case;
  /** Название объекта — первое непустое поле схемы. */
  title: string;
  errors: string[];
  uncertain: string[];
}

export interface WorkspaceHealth {
  /** Объекты, которые ждут человека: сначала ошибки, потом неподтверждённое. */
  attention: AttentionItem[];
  total: number;
  ready: number;
  /** Доля готовых объектов, 0–100. */
  percent: number;
  errorCount: number;
  uncertainCount: number;
}

export function useWorkspaceHealth(): WorkspaceHealth {
  const cases = useAppStore((state) => state.cases);
  const entities = useAppStore((state) => state.entities);
  const entitySchemas = useAppStore((state) => state.entitySchemas);

  return useMemo(() => {
    const byId = new Map(cases.map((item) => [item.id, item]));

    const attention: AttentionItem[] = [];
    let ready = 0;

    for (const entity of entities) {
      const caseItem = byId.get(entity.caseId);
      /*
       * Объект без дела в списке — не ошибка данных, а следствие фильтрации:
       * снимок мог приехать урезанным. Считать его в готовность нельзя, звать
       * по нему человека — тем более: открывать будет нечего.
       */
      if (!caseItem) continue;

      const schema = findSchema(entitySchemas, entity.type);
      const validation = validateEntity(entity, schema);
      const uncertain = entity.uncertainFields ?? [];

      if (validation.isValid) ready += 1;

      if (validation.errors.length === 0 && uncertain.length === 0) continue;

      const title =
        schema.fields
          .map((field) => entity.data[field.key]?.trim())
          .find((value) => Boolean(value)) ?? `Без наименования · ${schema.label}`;

      attention.push({
        entity,
        schema,
        caseItem,
        title,
        errors: validation.errors,
        uncertain,
      });
    }

    /* Ошибки блокируют выпуск, поэтому идут первыми — их чинят, а не смотрят. */
    attention.sort((a, b) => b.errors.length - a.errors.length);

    const total = entities.filter((entity) => byId.has(entity.caseId)).length;

    return {
      attention,
      total,
      ready,
      percent: total === 0 ? 0 : Math.round((ready / total) * 100),
      errorCount: attention.filter((item) => item.errors.length > 0).length,
      uncertainCount: attention.filter(
        (item) => item.errors.length === 0 && item.uncertain.length > 0
      ).length,
    };
  }, [cases, entities, entitySchemas]);
}
