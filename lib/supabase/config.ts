/**
 * Настроен ли Supabase.
 *
 * Приложение должно открываться и без базы: демонстрационный стенд работает на
 * встроенных данных, и это не аварийный режим, а поддерживаемый. Проверка нужна
 * страницам, чтобы решить, идти ли в базу или показать демонстрационный набор.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
