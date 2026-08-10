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
      viewer: {
        fullName: session.fullName,
        email: session.email,
        workspaceName: session.workspaceName,
      },
      cases,
      entities,
      documents,
      /*
       * Все типы, и встроенные тоже.
       *
       * Раньше встроенные отсекались, а фронт подставлял вместо них описания
       * из кода. Выглядело разумно — состав полей там и там один, — но
       * идентификаторы разные: в коде `real_estate`, в базе uuid. Из-за этого
       * объект, созданный в базе, не находил своей схемы и рисовался как
       * участок, а создание объекта встроенного типа писало строку в
       * uuid-колонку. Единственный источник правды здесь — база.
       */
      entitySchemas: schemas,
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
