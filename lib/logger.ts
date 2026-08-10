/**
 * Журнал приложения.
 *
 * Зачем он понадобился. Распознавание — первая часть продукта, которая
 * работает не в браузере: задание уходит в очередь, его берёт исполнитель на
 * стороне Supabase, ответ возвращается через минуты. Когда в такой цепочке
 * что-то встаёт, `console.log` в компоненте не отвечает ни на один вопрос —
 * ни где встало, ни как долго, ни с чем.
 *
 * Живой пример, ради которого это и написано: браузер слал по запросу в
 * секунду, и по логу сервера было видно только «POST /dashboard/recognize 200».
 * Что именно опрашивалось, сколько наблюдателей работало и почему они не
 * останавливались — не видно ничего.
 *
 * УСТРОЙСТВО. Строка журнала — это событие с полями, а не предложение:
 *
 *   14:22:07.412 INFO  ocr.watch.start documentId=8f3c… интервал=2500
 *
 * Событие называется через точку, от общего к частному, и по нему можно
 * грепать. Поля — пары «имя=значение», потому что их читает и человек, и
 * `findstr`.
 *
 * ЧТО НЕ ПОПАДАЕТ В ЖУРНАЛ. Ключи, токены, пароли и заголовки авторизации
 * скрываются по имени поля. Это не вежливость к пользователю, а защита от
 * собственной беспечности: журнал копируют в чат, прикладывают к письму и
 * выкладывают в задачу.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

const ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

/**
 * Порог. Ниже него события не печатаются вовсе.
 *
 * В разработке — `debug`: там журнал и нужен. На боевом — `info`, потому что
 * отладочные события идут на каждый тик наблюдателя, а таких тиков тысячи.
 */
function threshold(): LogLevel {
  const fromEnv =
    (typeof process !== "undefined" &&
      (process.env.NEXT_PUBLIC_LOG_LEVEL ?? process.env.LOG_LEVEL)) ||
    "";

  if (fromEnv === "debug" || fromEnv === "info" || fromEnv === "warn" || fromEnv === "error") {
    return fromEnv;
  }

  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

/** Поля, значение которых не печатается никогда. */
const SECRET = /key|token|secret|password|authorization|apikey|jwt/i;

/**
 * Длинные значения режем.
 *
 * Идентификатор документа целиком нужен редко: восьми знаков хватает, чтобы
 * отличить один файл от другого в пределах одного разбора. А вот строка
 * распознанного текста в журнале не нужна вовсе — от неё он становится
 * нечитаемым.
 */
const MAX_VALUE = 120;

function render(value: unknown): string {
  if (value === null) return "—";
  if (value === undefined) return "—";

  if (value instanceof Error) {
    return `«${value.message}»`;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  const text = typeof value === "string" ? value : safeJson(value);

  if (text.length > MAX_VALUE) {
    return `${text.slice(0, MAX_VALUE)}…(${text.length})`;
  }

  // Пробелы внутри значения ломают разбор «имя=значение» глазами.
  return /\s/.test(text) ? `«${text}»` : text;
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return "«не сериализуется»";
  }
}

export type Fields = Record<string, unknown>;

function format(level: LogLevel, event: string, fields: Fields): string {
  const time = new Date().toISOString().slice(11, 23);
  const tail = Object.entries(fields)
    .map(([name, value]) =>
      SECRET.test(name) ? `${name}=«скрыто»` : `${name}=${render(value)}`
    )
    .join(" ");

  return `${time} ${level.toUpperCase().padEnd(5)} ${event}${tail ? ` ${tail}` : ""}`;
}

function emit(level: LogLevel, event: string, fields: Fields): void {
  if (ORDER[level] < ORDER[threshold()]) return;

  const line = format(level, event, fields);

  // Ошибки и предупреждения — в свои потоки: их отдельно собирают и ищут.
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export interface Logger {
  debug(event: string, fields?: Fields): void;
  info(event: string, fields?: Fields): void;
  warn(event: string, fields?: Fields): void;
  error(event: string, fields?: Fields): void;
  /**
   * Замер длительности.
   *
   * Возвращает функцию, которая допишет `мс=…` к событию завершения. Без этого
   * «долго» и «мгновенно» в журнале выглядят одинаково, а разница между ними —
   * половина всех вопросов к работающей системе.
   */
  timer(event: string, fields?: Fields): (outcome?: Fields) => void;
  /** Тот же журнал с добавленным именем: `ocr` → `ocr.watch`. */
  child(suffix: string): Logger;
}

export function createLogger(scope: string): Logger {
  const named = (event: string) => (event ? `${scope}.${event}` : scope);

  return {
    debug: (event, fields = {}) => emit("debug", named(event), fields),
    info: (event, fields = {}) => emit("info", named(event), fields),
    warn: (event, fields = {}) => emit("warn", named(event), fields),
    error: (event, fields = {}) => emit("error", named(event), fields),

    timer(event, fields = {}) {
      const started = Date.now();
      emit("debug", named(`${event}.start`), fields);

      return (outcome: Fields = {}) => {
        const ms = Date.now() - started;
        const level: LogLevel = outcome.ошибка ? "error" : "info";
        emit(level, named(event), { ...fields, ...outcome, мс: ms });
      };
    },

    child(suffix) {
      return createLogger(`${scope}.${suffix}`);
    },
  };
}

/** Короткий вид идентификатора: в журнале важно различать, а не читать целиком. */
export function shortId(id: string | null | undefined): string {
  if (!id) return "—";
  return id.length > 8 ? id.slice(0, 8) : id;
}
