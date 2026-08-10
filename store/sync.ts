import type { ActionResult } from "@/lib/actions/result";
import type { Entity } from "@/types";

import type { StoreGet, StoreSet } from "./types";

/**
 * Общий механизм записи в базу для всех слоёв стора.
 *
 * Изменения применяются к состоянию сразу, а запись идёт следом. Обратный
 * порядок — ждать ответ и только потом рисовать — на таблице реквизитов
 * невыносим: каждое поле замирало бы на время круга до сервера. Расплата за
 * отзывчивость честная: если база отказала, изменение откатывается, а человек
 * видит причину.
 *
 * Когда базы нет (демонстрационный стенд, свежий клон без переменных
 * окружения), сюда просто не заходят: `isBackedByDatabase` остаётся false, и
 * стор работает на встроенном наборе.
 */

export interface SyncHandlers<T> {
  /** Что сделать с тем, что вернула база: обычно — подменить временный id. */
  onSuccess?: (data: T) => void;
  /** Откат: изменение, применённое до ответа, оказалось непринятым. */
  onFailure?: () => void;
  fallback: string;
}

export type Sync = <T>(
  request: Promise<ActionResult<T>>,
  handlers: SyncHandlers<T>
) => Promise<T | null>;

/**
 * Связывает механизм записи с конкретным слоем.
 *
 * Раньше он обращался к стору по имени, из-за чего файл нельзя было разделить:
 * любой кусок тянул за собой весь стор целиком. Теперь `set` передаётся
 * снаружи, и слои ничего друг о друге не знают.
 */
export function createSync(set: StoreSet): Sync {
  return async function sync<T>(
    request: Promise<ActionResult<T>>,
    handlers: SyncHandlers<T>
  ): Promise<T | null> {
    set((state) => ({ pendingWrites: state.pendingWrites + 1 }));

    try {
      const result = await request;

      if (!result.ok) {
        handlers.onFailure?.();
        set({ syncError: result.error || handlers.fallback });
        return null;
      }

      const data = (result.data ?? null) as T | null;
      if (data !== null) handlers.onSuccess?.(data);
      return data;
    } catch (caught) {
      handlers.onFailure?.();
      set({
        syncError: caught instanceof Error ? caught.message : handlers.fallback,
      });
      return null;
    } finally {
      set((state) => ({
        pendingWrites: Math.max(0, state.pendingWrites - 1),
      }));
    }
  };
}

/** Работает ли стор поверх базы или показывает встроенный набор. */
export function isRemote(get: StoreGet): boolean {
  return get().isBackedByDatabase;
}

/** Подменяет временный идентификатор на выданный базой — в каждом списке. */
export function replaceEntityId(
  set: StoreSet,
  temporaryId: string,
  entity: Entity
): void {
  set((state) => ({
    entities: state.entities.map((item) =>
      item.id === temporaryId ? entity : item
    ),
    editingCell:
      state.editingCell?.entityId === temporaryId
        ? { entityId: entity.id, field: state.editingCell.field }
        : state.editingCell,
  }));
}

/**
 * Временные идентификаторы для строк, ещё не дошедших до базы.
 *
 * Счётчик рядом со временем, а не одно время: два объекта, созданных в одну
 * миллисекунду, получили бы одинаковый идентификатор, и один затёр бы другой.
 */
let counter = 0;

export function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now()}-${counter}`;
}
