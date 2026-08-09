/**
 * Вызов маршрутизатора моделей.
 *
 * Интерфейс OpenAI-совместимый, поэтому смена поставщика — это смена адреса и
 * ключа, а не переписывание кода. Ключ живёт только здесь, в секретах Edge
 * Functions: приложение не должно уметь позвать модель напрямую даже
 * теоретически.
 */

const BASE_URL = Deno.env.get("LLM_BASE_URL") ?? "https://routerai.ru/v1";
const API_KEY = Deno.env.get("LLM_API_KEY") ?? "";

/** Сколько ждём ответа. Дольше — почти всегда значит, что что-то зависло. */
const TIMEOUT_MS = 120_000;

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
  /** Стоимость в долларах, если маршрутизатор её вернул. */
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
  options: { json?: boolean; temperature?: number } = {}
): Promise<CompletionResult> {
  if (!API_KEY) {
    throw new Error("LLM_API_KEY не задан в секретах функции");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

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

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content ?? "";

    return {
      text,
      tokensIn: data.usage?.prompt_tokens ?? 0,
      tokensOut: data.usage?.completion_tokens ?? 0,
      costUsd: data.usage?.cost ?? null,
    };
  } finally {
    clearTimeout(timer);
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
    tokensIn: data.usage?.prompt_tokens ?? 0,
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
