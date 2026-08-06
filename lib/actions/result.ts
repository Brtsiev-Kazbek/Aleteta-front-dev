/**
 * Ответ серверного действия.
 *
 * Исключения через границу «сервер → клиент» в продакшен-сборке приходят
 * обезличенными: React прячет текст ошибки, чтобы наружу не утекли внутренности.
 * Поэтому ожидаемые отказы — занятая почта, недостаточно прав, непройденная
 * проверка — возвращаются значением, а не выбрасываются.
 */
export interface ActionResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export function actionOk<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function actionFail<T>(error: string): ActionResult<T> {
  return { ok: false, error };
}

/**
 * Превращает неизвестное исключение в текст для человека.
 *
 * `requireSession()` выбрасывает при сломанных данных, драйвер Supabase — при
 * сетевых сбоях. И то и другое должно доехать до формы строкой, а не уронить
 * страницу.
 */
export function actionError<T>(caught: unknown, fallback: string): ActionResult<T> {
  const message = caught instanceof Error ? caught.message : fallback;
  return { ok: false, error: message || fallback };
}
