import { createLogger } from "@/lib/logger";

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

const log = createLogger("action");

export function actionOk<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

/**
 * Ожидаемый отказ.
 *
 * В журнал он идёт предупреждением, а не ошибкой: «дело не найдено» и «почта
 * занята» — это работающая проверка, а не поломка. Но идёт обязательно: до
 * браузера доезжает только текст, а причина остаётся здесь, и без записи её
 * потом не восстановить.
 */
export function actionFail<T>(error: string): ActionResult<T> {
  log.warn("fail", { причина: error });
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

  /*
   * Стек пишем в журнал целиком. Пользователю он не нужен и не показывается, а
   * без него исключение из глубины драйвера базы — просто строка, по которой
   * невозможно понять, откуда она взялась.
   */
  log.error("throw", {
    сообщение: message || fallback,
    где: caught instanceof Error ? firstFrame(caught) : "—",
  });

  return { ok: false, error: message || fallback };
}

/** Первая строка стека: где именно упало, без простыни на сорок кадров. */
function firstFrame(error: Error): string {
  const frame = error.stack?.split("\n")[1]?.trim() ?? "";
  return frame.replace(/^at\s+/, "") || "—";
}
