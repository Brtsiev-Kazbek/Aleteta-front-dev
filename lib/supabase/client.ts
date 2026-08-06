"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

/**
 * Клиент для кода, исполняющегося в браузере.
 *
 * Ключ здесь публичный, и это не упущение: доступ к данным ограничивают
 * политики в базе, а не секретность ключа. Всё, что можно получить с этим
 * ключом, пользователь и так вправе видеть.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Не заданы NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY. Скопируйте .env.example в .env.local."
    );
  }

  return createBrowserClient<Database>(url, key);
}
