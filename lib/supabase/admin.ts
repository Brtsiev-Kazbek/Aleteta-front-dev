import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * Клиент со служебным ключом. Обходит все политики доступа.
 *
 * Нужен там, где действие выполняется не от имени пользователя: выполнение
 * AI-заданий, запись результата разбора, обслуживающие скрипты. Во всех
 * остальных случаях берите `server.ts` — он работает под правами вошедшего,
 * и ошибка в логике не превращается в утечку чужих данных.
 *
 * Импорт `server-only` — это предохранитель: сборка упадёт, если файл случайно
 * попадёт в клиентский бандл вместе с ключом.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Не заданы NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createSupabaseClient<Database>(url, key, {
    auth: {
      // Служебному клиенту сессия не нужна: он не «входит» и не продлевает токен.
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
