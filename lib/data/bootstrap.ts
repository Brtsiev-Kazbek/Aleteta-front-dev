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
/**
 * Проверка, что снимок пройдёт из серверного компонента в клиентский.
 *
 * Через эту границу проходят только простые значения. Объект класса — RegExp,
 * Date, Map — Next отвергает целиком, и страница отвечает пятисотой с текстом
 * «Only plain objects can be passed to Client Components», в котором не сказано,
 * какое именно поле виновато.
 *
 * Так уже случилось: описания типов объектов поехали из базы вместе с шаблонами
 * проверки формата, а те собирались в `RegExp`. Легли все внутренние экраны, и
 * ни одна проверка этого не увидела — снимки снимаются без базы, снимок там
 * пуст, и через границу не идёт ничего.
 *
 * Отсюда проверка здесь, а не в тестах: только тут видно настоящие данные. В
 * боевом режиме она не работает — обход снимка стоит миллисекунды, но платить
 * их на каждый заход не за что, а ошибка такого рода всплывает на первом же
 * запуске в разработке.
 */
class NotPlainError extends Error {}

function assertPlain(snapshot: StoreSnapshot): StoreSnapshot {
  if (process.env.NODE_ENV === "production") return snapshot;

  const seen = new WeakSet<object>();

  const walk = (value: unknown, path: string): void => {
    if (value === null || typeof value !== "object") return;

    if (seen.has(value)) return;
    seen.add(value);

    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, `${path}[${index}]`));
      return;
    }

    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) {
      throw new NotPlainError(
        `Снимок рабочей области содержит не простое значение: ${path} — ` +
          `${value.constructor?.name ?? "объект без прототипа"}. Такое не ` +
          "пройдёт в клиентский компонент; храните его строкой или числом и " +
          "собирайте там, где применяете."
      );
    }

    for (const [key, item] of Object.entries(value)) {
      walk(item, `${path}.${key}`);
    }
  };

  walk(snapshot, "снимок");
  return snapshot;
}

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

    const snapshot: StoreSnapshot = {
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

    /*
     * Проверка стоит внутри try, но её исключение обязано пролететь наружу:
     * пойманное вместе с ошибками чтения, оно молча подменило бы данные
     * встроенным набором — то есть спрятало бы поломку вместо того, чтобы её
     * показать. Отсюда отдельный тип и повторный бросок ниже.
     */
    return assertPlain(snapshot);
  } catch (caught) {
    if (caught instanceof NotPlainError) throw caught;

    /*
     * Ошибку чтения намеренно не пробрасываем: неверный ключ или недоступная
     * база не должны превращать демонстрационный стенд в страницу ошибки.
     * Интерфейс покажет встроенный набор.
     */
    return null;
  }
}
