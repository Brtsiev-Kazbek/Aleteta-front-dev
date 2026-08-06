import "server-only";

import { getOptionalSession } from "@/lib/data/session";
import {
  listCases,
  listDocuments,
  listEntities,
  listEntitySchemas,
} from "@/lib/data/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { StoreSnapshot } from "@/store/useAppStore";

/**
 * Данные рабочей области для первой отрисовки.
 *
 * Возвращает null, когда базы нет или человек не вошёл: в этом случае
 * интерфейс остаётся на встроенном наборе. Так стенд открывается и на свежем
 * клоне без переменных окружения.
 */
export async function loadWorkspaceSnapshot(): Promise<StoreSnapshot | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const session = await getOptionalSession();
    if (!session) return null;

    // Один заход вместо четырёх последовательных: страница ждёт самый долгий
    // запрос, а не их сумму.
    const [cases, entities, documents, schemas] = await Promise.all([
      listCases(session.workspaceId),
      listEntities(session.workspaceId),
      listDocuments(session.workspaceId),
      listEntitySchemas(session.workspaceId),
    ]);

    return {
      cases,
      entities,
      documents,
      // Встроенные типы приходят из базы вместе со своими; в сторе живут
      // пользовательские, поэтому встроенные отсекаем.
      customSchemas: schemas.filter((schema) => schema.isCustom),
    };
  } catch {
    /*
     * Ошибку чтения намеренно не пробрасываем: неверный ключ или недоступная
     * база не должны превращать демонстрационный стенд в страницу ошибки.
     * Интерфейс покажет встроенный набор.
     */
    return null;
  }
}
