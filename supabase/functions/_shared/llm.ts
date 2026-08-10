/**
 * Вызов маршрутизатора моделей.
 *
 * Интерфейс OpenAI-совместимый, поэтому смена поставщика — это смена адреса и
 * ключа, а не переписывание кода. Ключ живёт только здесь, в секретах Edge
 * Functions: приложение не должно уметь позвать модель напрямую даже
 * теоретически.
 */

/*
 * Именно `/api/v1`, а не `/v1`: по второму адресу RouterAI отдаёт страницу
 * сайта, и вместо ответа приходит кусок HTML. Ошибку в этом месте легко
 * принять за неправильный ключ.
 */
const BASE_URL = Deno.env.get("LLM_BASE_URL") ?? "https://routerai.ru/api/v1";
const API_KEY = Deno.env.get("LLM_API_KEY") ?? "";

/** Сколько ждём ответа. Дольше — почти всегда значит, что что-то зависло. */
const TIMEOUT_MS = 120_000;

/**
 * Распознавание страницы ждёт меньше остальных операций.
 *
 * Исполнителю отведено полторы минуты на весь запуск, и он должен успеть не
 * только дождаться ответа, но и записать страницу. Разбор договора думает
 * минутами и укладывается в общий срок; страница картинкой — нет.
 */
export const PAGE_TIMEOUT_MS = 60_000;

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  /**
   * Либо текст, либо смесь текста и картинок — для vision-моделей. Формат тот
   * же, что у OpenAI: массив частей с типом.
   */
  content: string | ContentPart[];
}

export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export interface CompletionResult {
  text: string;
  tokensIn: number;
  tokensOut: number;
  /**
   * Стоимость запроса в валюте маршрутизатора — у RouterAI это рубли, а не
   * доллары, как можно решить по имени поля в базе. Имя осталось от первого
   * поставщика; менять его в схеме отдельно от остального смысла нет, но
   * помнить об этом надо.
   */
  costUsd: number | null;
}

/**
 * Один вызов модели.
 *
 * Возвращает не только текст, но и расход: без него журнал заданий теряет
 * половину смысла — по нему потом видно, что после правки промпта операция
 * подорожала втрое.
 */
export async function complete(
  model: string,
  messages: ChatMessage[],
  options: { json?: boolean; temperature?: number; timeoutMs?: number } = {}
): Promise<CompletionResult> {
  if (!API_KEY) {
    throw new Error("LLM_API_KEY не задан в секретах функции");
  }

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? TIMEOUT_MS
  );

  try {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0,
        /*
         * Извлечение реквизитов и разбор договора возвращают структуру, а не
         * прозу. Просить JSON в промпте недостаточно: модель регулярно
         * добавляет пояснение вокруг, и разбор падает.
         */
        ...(options.json ? { response_format: { type: "json_object" } } : {}),
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = await response.text();
      /*
       * 429 и 5xx — временные: их имеет смысл повторить. Отличать их от
       * постоянных ошибок должен вызывающий, поэтому код ответа идёт в текст
       * исключения, а не теряется.
       */
      throw new Error(`Модель ответила ${response.status}: ${body.slice(0, 500)}`);
    }

    /*
     * Идентификатор запроса нужен, чтобы потом узнать цену: в ответе чата её
     * нет, маршрутизатор отдаёт её отдельно.
     */
    const generationId = response.headers.get("x-generation-id");

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    const usage = data.usage ?? {};

    return {
      text,
      ...readTokens(usage),
      costUsd: await readCost(usage, generationId),
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Расход в токенах.
 *
 * Имена полей у поставщиков разные: OpenAI зовёт их `prompt_tokens` и
 * `completion_tokens`, RouterAI — `input_tokens` и `output_tokens`. Читать
 * только одну пару значит однажды тихо записать в журнал нули и не заметить,
 * что операция подорожала.
 */
function readTokens(usage: Record<string, unknown>): {
  tokensIn: number;
  tokensOut: number;
} {
  const pick = (...names: string[]): number => {
    for (const name of names) {
      const value = usage[name];
      if (typeof value === "number") return value;
    }
    return 0;
  };

  return {
    tokensIn: pick("prompt_tokens", "input_tokens"),
    tokensOut: pick("completion_tokens", "output_tokens"),
  };
}

/**
 * Сколько стоил запрос.
 *
 * Если поставщик кладёт стоимость прямо в ответ — берём оттуда. RouterAI не
 * кладёт, и приходится спрашивать отдельно по идентификатору из заголовка.
 * Лишний запрос того стоит: журнал заданий без цены не показывает главного —
 * во что обходится документ.
 *
 * Валюта — та, в которой считает маршрутизатор; у RouterAI это рубли.
 */
async function readCost(
  usage: Record<string, unknown>,
  generationId: string | null
): Promise<number | null> {
  if (typeof usage.cost === "number") return usage.cost;
  if (!generationId) return null;

  try {
    const response = await fetch(
      `${BASE_URL}/generation?id=${encodeURIComponent(generationId)}`,
      { headers: { authorization: `Bearer ${API_KEY}` } }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return typeof data.total_cost === "number" ? data.total_cost : null;
  } catch {
    // Не узнали цену — не повод считать задание неудачным.
    return null;
  }
}

/** Векторизация фрагментов документа для поиска по делу. */
export async function embed(
  model: string,
  inputs: string[]
): Promise<{ vectors: number[][]; tokensIn: number }> {
  if (!API_KEY) {
    throw new Error("LLM_API_KEY не задан в секретах функции");
  }

  const response = await fetch(`${BASE_URL}/embeddings`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ model, input: inputs }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Эмбеддинги ответили ${response.status}: ${body.slice(0, 500)}`);
  }

  const data = await response.json();
  return {
    vectors: (data.data ?? []).map((item: { embedding: number[] }) => item.embedding),
    tokensIn: readTokens(data.usage ?? {}).tokensIn,
  };
}

/**
 * Разбор JSON из ответа модели.
 *
 * Даже с `response_format` модель иногда оборачивает ответ в ```json — это не
 * повод терять задание, поэтому обёртку снимаем молча.
 */
export function parseJson<T>(text: string): T {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(`Модель вернула не JSON: ${cleaned.slice(0, 300)}`);
  }
}

/** Временная ли ошибка: такие имеет смысл повторить. */
export function isTransient(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /\b(429|500|502|503|504)\b/.test(message) || /abort|timeout/i.test(message);
}
