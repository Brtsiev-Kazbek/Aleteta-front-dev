import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

/**
 * Клиент для серверных компонентов и обработчиков маршрутов.
 *
 * Работает от имени вошедшего пользователя: сессия читается из cookie, и все
 * политики доступа применяются так же, как в браузере. Для фоновых заданий,
 * которым политики мешают, есть отдельный клиент — см. `admin.ts`.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Не заданы NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY. Скопируйте .env.example в .env.local."
    );
  }

  const cookieStore = cookies();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        /*
         * Серверные компоненты писать cookie не могут — Next это запрещает.
         * Обновлением сессии занимается middleware, поэтому здесь ошибку
         * гасим намеренно: без неё каждый рендер падал бы на попытке продлить
         * токен.
         */
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Ожидаемо в серверном компоненте — см. комментарий выше.
        }
      },
    },
  });
}
