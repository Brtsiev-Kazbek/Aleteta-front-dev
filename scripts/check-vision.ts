/**
 * Проверка vision-модели на настоящей странице документа.
 *
 * Скрипт проходит ровно тот путь, которым потом пойдёт распознавание в
 * Edge Function: берёт PDF, рисует страницу тем же движком, кодирует картинку
 * тем же кодировщиком и отправляет тем же запросом. Поэтому если он отработал —
 * отработает и конвейер, а если нет, видно, где именно сломалось: на рендере,
 * на формате картинки или на самой модели.
 *
 * Запуск:
 *   npm run check:vision -- --whoami                   рабочий ли ключ
 *   npm run check:vision -- --list                     что есть в каталоге
 *   npm run check:vision -- скан.pdf --model <имя>     распознать страницу
 *
 * Полезные ключи: `--page N` — какая страница, `--side 1400` — наибольшая
 * сторона в точках, `--color` — не переводить в серое, `--format png|jpeg`
 * и `--quality 85` — чем кодировать. Без `--format` формат выбирается сам:
 * PNG, а на шумном скане JPEG. Картинка сохраняется рядом с PDF — можно
 * открыть и посмотреть, что именно ушло в модель.
 *
 * Ключ берётся из переменной LLM_API_KEY или из .env.local. В аргументах его
 * передавать не надо: командная строка попадает в историю оболочки.
 *
 * Нужен Node 22.6 или новее — скрипт на TypeScript исполняется напрямую.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";

import { openPdf, looksLikePdf } from "../supabase/functions/_shared/pdf.ts";

/**
 * Адрес API маршрутизатора.
 *
 * Именно `/api/v1`, а не `/v1`: по второму отдаётся страница сайта, и запрос
 * возвращает кусок HTML вместо ответа — ошибку в этом месте легко принять за
 * неправильный ключ.
 */
const DEFAULT_BASE_URL = "https://routerai.ru/api/v1";

const OCR_PROMPT = `Перенеси в текст всё, что написано на странице документа.

Правила:
1. Сохраняй порядок и структуру: заголовки, нумерацию пунктов, таблицы строками.
2. Ничего не сокращай, не пересказывай и не исправляй — это не пересказ, а перенос.
3. Числа, номера и даты переноси посимвольно: именно они потом попадут в документы.
4. Печати, подписи и штампы отмечай как [печать], [подпись] с расшифровкой, если читается.
5. Если страница пустая или нечитаемая — верни пустую строку.

Верни только текст страницы, без пояснений и без обрамления.`;

/* ------------------------------------------------------------------ */
/*  АРГУМЕНТЫ                                                          */
/* ------------------------------------------------------------------ */

/**
 * Всё, что начинается с двух дефисов, — ключ, следующее слово — его значение.
 * Кроме `--list`: у него значения нет.
 */
function parseArgs(argv: string[]) {
  const flags = new Map<string, string>();
  const positional: string[] = [];

  for (let i = 0; i < argv.length; i += 1) {
    const argument = argv[i] ?? "";

    if (!argument.startsWith("--")) {
      positional.push(argument);
      continue;
    }

    const name = argument.slice(2);

    if (name === "list" || name === "whoami" || name === "color") {
      flags.set(name, "yes");
      continue;
    }

    flags.set(name, argv[i + 1] ?? "");
    i += 1;
  }

  return { flags, positional };
}

/**
 * Простое чтение .env: тянуть ради этого зависимость незачем.
 *
 * С одной оговоркой про кодировку. `echo 'КЛЮЧ=...' >> .env.local` в
 * PowerShell пишет файл в UTF-16 с меткой порядка байтов, а не в UTF-8, как
 * все ожидают. Прочитанный как UTF-8, такой файл превращается в кашу из
 * нулевых байтов, и ключ либо не находится вовсе, либо уходит на сервер
 * испорченным — а сервер отвечает «401», и полдня уходит на поиск того, чего
 * нет.
 */
function loadEnvFile(name: string): void {
  if (!existsSync(name)) return;

  const bytes = readFileSync(name);
  let text: string;

  if (bytes[0] === 0xff && bytes[1] === 0xfe) text = bytes.toString("utf16le");
  else if (bytes[0] === 0xfe && bytes[1] === 0xff) text = bytes.swap16().toString("utf16le");
  else text = bytes.toString("utf8");

  for (const line of text.replace(/^﻿/, "").split("\n")) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;

    const key = match[1] ?? "";
    const value = match[2] ?? "";
    if (!key || process.env[key]) continue;

    process.env[key] = value.trim().replace(/^["']|["']$/g, "");
  }
}

/**
 * Ошибка, которую надо показать человеком, а не стеком.
 *
 * Раньше здесь стоял `process.exit()`, и на Windows он ронял процесс с
 * `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)`: выход посреди
 * незакрытого сетевого соединения. Теперь исключение долетает до конца, и
 * процесс завершается сам.
 */
class Stop extends Error {}

function fail(message: string): never {
  throw new Stop(message);
}

/* ------------------------------------------------------------------ */
/*  ЗАПРОСЫ                                                            */
/* ------------------------------------------------------------------ */

interface Router {
  baseUrl: string;
  apiKey: string;
}

/**
 * Запрос с понятной ошибкой вместо стека undici — и со сроком.
 *
 * Без срока скрипт просто висит, и отличить «модель думает» от «запрос ушёл в
 * никуда» нельзя ничем, кроме терпения.
 */
async function request(
  url: string,
  init: RequestInit,
  timeoutMs = 120_000
): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  } catch (caught) {
    const reason = caught instanceof Error ? (caught.cause ?? caught.message) : caught;

    if (caught instanceof Error && /timeout|abort/i.test(caught.name + caught.message)) {
      fail(
        `Модель не ответила за ${timeoutMs / 1000} с.\n` +
          "Обычно это либо очень большая картинка, либо перегруженный поставщик.\n" +
          "Попробуйте меньшую сторону: --side 1000"
      );
    }

    fail(`Не удалось обратиться к ${url}\n${String(reason)}`);
  }
}

/**
 * Ответ маршрутизатора или внятное объяснение, почему его нет.
 *
 * Отдельно ловим HTML: если вместо JSON пришла страница, значит запрос ушёл не
 * на API, а на сайт — почти всегда из-за адреса без `/api`.
 */
async function readJson(response: Response, what: string): Promise<any> {
  const body = await response.text();

  if (body.trimStart().startsWith("<")) {
    fail(
      `${what}: вместо ответа пришла веб-страница (${response.status}).\n` +
        `Проверьте LLM_BASE_URL — у RouterAI это ${DEFAULT_BASE_URL}, с «/api».`
    );
  }

  if (!response.ok) {
    fail(`${what}: ответ ${response.status}\n${body.slice(0, 500)}`);
  }

  try {
    return JSON.parse(body);
  } catch {
    fail(`${what}: ответ не разбирается как JSON\n${body.slice(0, 300)}`);
  }
}

/* ------------------------------------------------------------------ */
/*  КЛЮЧ                                                               */
/* ------------------------------------------------------------------ */

/**
 * Отпечаток ключа: длина и края.
 *
 * Показываем его при отказе в доступе, не раскрывая сам ключ. По длине сразу
 * видно самое частое — что в файл попал не только ключ, но и кавычка,
 * пробел, комментарий или метка кодировки.
 */
function keyFingerprint(key: string): string {
  const strange = /[^\x21-\x7e]/.test(key) ? ", есть посторонние символы" : "";
  return `${key.slice(0, 6)}…${key.slice(-4)}, длина ${key.length}${strange}`;
}

/**
 * Проверка, что ключ вообще рабочий.
 *
 * Каталог моделей у RouterAI открыт без ключа, поэтому удачный `--list`
 * ничего про ключ не доказывает. А вот сведения о самом ключе и баланс — за
 * авторизацией, и по ним видно, в чём дело: ключ не тот, отключён или деньги
 * кончились.
 */
async function whoami(router: Router): Promise<void> {
  console.log(`Ключ: ${keyFingerprint(router.apiKey)}\n`);

  const key = await request(`${router.baseUrl}/key`, {
    method: "GET",
    headers: { authorization: `Bearer ${router.apiKey}` },
  });

  if (key.status === 401) {
    fail(
      "Маршрутизатор не принимает этот ключ.\n\n" +
        "Что проверить:\n" +
        "  1. ключ не отозван и не отключён в личном кабинете;\n" +
        "  2. в .env.local лежит именно он, без кавычек и лишних пробелов;\n" +
        "  3. это ключ API, а не мастер-ключ — мастер управляет ключами,\n" +
        "     но моделями пользоваться не может."
    );
  }

  const data = await readJson(key, "Сведения о ключе");
  const info = data.data ?? data;

  console.log(`Имя ключа: ${info.name ?? "—"}`);
  console.log(`Отключён: ${info.disabled ? "да" : "нет"}`);
  console.log(`Потрачено: ${info.usage ?? "—"}, лимит: ${info.limit || "без лимита"}`);

  const credits = await request(`${router.baseUrl}/credits`, {
    method: "GET",
    headers: { authorization: `Bearer ${router.apiKey}` },
  });

  if (credits.ok) {
    const balance = await readJson(credits, "Баланс");
    console.log(`Баланс: ${balance.credits ?? "—"}`);
  }

  console.log("\nКлюч рабочий.");
}

/* ------------------------------------------------------------------ */
/*  КАТАЛОГ                                                            */
/* ------------------------------------------------------------------ */

interface ModelCard {
  id: string;
  name?: string;
  context_length?: number;
  architecture?: { input_modalities?: string[]; output_modalities?: string[] };
  pricing?: Record<string, unknown>;
}

/**
 * Каталог приходит в нескольких обёртках сразу: то массивом, то объектом с
 * `data`, то массивом из одного объекта с `data`. Разворачиваем все три.
 */
function unwrapModels(payload: unknown): ModelCard[] {
  const candidates: unknown[] = Array.isArray(payload) ? payload : [payload];

  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length && typeof candidate[0] === "object") {
      const first = candidate[0] as { id?: string };
      if (first.id) return candidate as ModelCard[];
    }

    const inner = (candidate as { data?: unknown })?.data;
    if (Array.isArray(inner)) return inner as ModelCard[];
  }

  return [];
}

/** Цена за миллион токенов: сырые цифры за токен читать невозможно. */
function perMillion(pricing: Record<string, unknown> | undefined, key: string): string {
  const raw = pricing?.[key];
  const value = typeof raw === "string" ? Number(raw) : typeof raw === "number" ? raw : NaN;

  if (!Number.isFinite(value) || value === 0) return "—";
  return (value * 1_000_000).toFixed(2);
}

async function listModels(
  router: Router,
  limit: number,
  needle: string
): Promise<void> {
  const response = await request(`${router.baseUrl}/models`, {
    method: "GET",
    headers: { authorization: `Bearer ${router.apiKey}` },
  });

  const models = unwrapModels(await readJson(response, "Каталог моделей"));

  if (!models.length) fail("Каталог пуст — маршрутизатор вернул список без моделей");

  /*
   * Модель для распознавания узнаётся по заявленным модальностям, а не по
   * имени: названия у поставщиков произвольные.
   *
   * Условий два, и второе не менее важно. Мало принимать картинку — надо ещё
   * отвечать текстом, иначе в список попадают генераторы видео и изображений:
   * `veo`, `kling`, `flux` тоже берут картинку на вход, но отдают ролик.
   */
  const vision = models.filter((model) => {
    const input = model.architecture?.input_modalities ?? [];
    const output = model.architecture?.output_modalities ?? [];
    return (
      input.some((kind) => /image/i.test(kind)) &&
      output.some((kind) => /text/i.test(kind))
    );
  });

  /*
   * Каталог у маршрутизатора на сотни моделей, и целиком его читать
   * бессмысленно. `--grep gemini` показывает одно семейство — по такому куску
   * уже можно выбирать.
   */
  const matching = (vision.length ? vision : models).filter(
    (model) => !needle || model.id.toLowerCase().includes(needle.toLowerCase())
  );

  const shown = matching
    .slice()
    .sort((a, b) => {
      const left = Number(a.pricing?.prompt ?? Infinity);
      const right = Number(b.pricing?.prompt ?? Infinity);
      return (Number.isFinite(left) ? left : Infinity) - (Number.isFinite(right) ? right : Infinity);
    })
    .slice(0, limit);

  console.log(
    `Моделей в каталоге: ${models.length}, ` +
      `из них читают картинки и отвечают текстом: ${vision.length}` +
      (needle ? `, подходит под «${needle}»: ${matching.length}` : "") +
      "\n"
  );

  if (!matching.length) {
    console.log(`Ничего не нашлось по «${needle}» — уберите --grep.`);
    return;
  }

  if (!vision.length) {
    console.log(
      "Каталог не размечает входные модальности — ниже просто начало списка.\n" +
        "Ищите семейства gemini, qwen-vl, gpt-4.1, pixtral.\n"
    );
  }

  console.log(
    "Дешевле сверху. Цена за миллион токенов, в валюте маршрутизатора.\n"
  );
  console.log(
    `${"модель".padEnd(46)} ${"вход".padStart(9)} ${"выход".padStart(9)} ${"контекст".padStart(9)}`
  );
  console.log("─".repeat(78));

  for (const model of shown) {
    const context = model.context_length ? `${Math.round(model.context_length / 1000)}K` : "—";
    console.log(
      `${model.id.slice(0, 46).padEnd(46)} ` +
        `${perMillion(model.pricing, "prompt").padStart(9)} ` +
        `${perMillion(model.pricing, "completion").padStart(9)} ` +
        `${context.padStart(9)}`
    );
  }

  if (shown.length < (vision.length || models.length)) {
    console.log(
      `\n…показано ${shown.length} из ${matching.length}. ` +
        "Больше — с --top 100, уже — с --grep gemini"
    );
  }
}

/* ------------------------------------------------------------------ */
/*  РАСПОЗНАВАНИЕ                                                      */
/* ------------------------------------------------------------------ */

async function recognize(
  router: Router,
  path: string,
  modelName: string,
  page: number,
  side: number,
  color: boolean,
  format: "auto" | "png" | "jpeg",
  quality: number
): Promise<void> {
  const bytes = new Uint8Array(readFileSync(path));

  if (!looksLikePdf(bytes)) fail("Это не PDF — скрипт проверяет именно путь через рендер");

  console.log(`Файл: ${path} (${(bytes.length / 1024).toFixed(0)} КБ)`);

  const startedRender = Date.now();
  // Тот же секрет, что у Edge Function: если CDN закрыт, движок берётся из
  // своего хранилища.
  const pdf = await openPdf(bytes, { wasmUrl: process.env.PDFIUM_WASM_URL });

  try {
    console.log(`Страниц: ${pdf.pageCount}`);
    if (page > pdf.pageCount) fail(`Страницы ${page} нет`);

    const layer = pdf.text(page);
    console.log(`Текстовый слой страницы ${page}: ${layer.length} символов`);

    if (layer.length >= 150) {
      console.log(
        "\nВНИМАНИЕ: у этой страницы есть текстовый слой — в работе она пошла бы\n" +
          "мимо модели и обошлась бы бесплатно. Для честной проверки возьмите скан.\n"
      );
    }

    const image = await pdf.render(page, {
      maxSide: side,
      grayscale: !color,
      format,
      quality,
    });
    const kilobytes = Math.round((image.dataUrl.length * 3) / 4 / 1024);
    // Формат берём из самой картинки: при `auto` его выбрал рендер, а не мы.
    const kind = image.dataUrl.slice(11, image.dataUrl.indexOf(";"));
    console.log(
      `Картинка: ${image.width}×${image.height}, ${color ? "цвет" : "серая"}, ` +
        `${kind.toUpperCase()}${kind === "jpeg" ? ` q${quality}` : ""}, ` +
        `${kilobytes} КБ, краски ${(image.ink * 100).toFixed(2)}%, ` +
        `рендер ${Date.now() - startedRender} мс`
    );

    // Сохраняем ровно то, что уходит в модель: можно открыть и посмотреть глазами.
    const saved = `${path.replace(/\.pdf$/i, "")}-стр${page}.${kind === "jpeg" ? "jpg" : "png"}`;
    writeFileSync(saved, Buffer.from(image.dataUrl.split(",")[1] ?? "", "base64"));
    console.log(`Сохранил картинку: ${saved}`);

    // Тело запроса больше картинки на треть: base64 — это четыре байта на три.
    console.log(
      `Отправляю ${Math.round((image.dataUrl.length / 1024))} КБ в ${modelName}…\n`
    );

    const startedModel = Date.now();
    const response = await request(`${router.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${router.apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        temperature: 0,
        messages: [
          { role: "system", content: OCR_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: `Страница ${page} из ${pdf.pageCount}` },
              { type: "image_url", image_url: { url: image.dataUrl } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`\nМодель ответила ${response.status}:\n${body.slice(0, 800)}`);

      if (response.status === 401) {
        fail(
          `Ключ отвергнут (${keyFingerprint(router.apiKey)}).\n` +
            "Каталог моделей отдаётся без ключа, поэтому удачный --list ничего\n" +
            "про него не говорил. Проверьте отдельно:\n\n" +
            "  npm run check:vision -- --whoami"
        );
      }

      if (/image|url|base64|data:|modal/i.test(body)) {
        console.error(
          "\nПохоже, эта модель не принимает картинку строкой data: — либо она\n" +
            "вовсе не vision. Возьмите другую из `--list`."
        );
      }
      fail("Проверка не прошла");
    }

    const generationId = response.headers.get("x-generation-id");
    const data = await readJson(response, "Ответ модели");
    const text: string = data.choices?.[0]?.message?.content ?? "";

    /*
     * Названия полей расхода у маршрутизатора свои: `input_tokens` вместо
     * привычного `prompt_tokens`. Читаем оба — иначе в журнале останутся нули.
     */
    const usage = data.usage ?? {};
    const tokensIn = usage.prompt_tokens ?? usage.input_tokens ?? "?";
    const tokensOut = usage.completion_tokens ?? usage.output_tokens ?? "?";

    console.log(`Ответ за ${Date.now() - startedModel} мс`);
    console.log(`Токены: ${tokensIn} на входе, ${tokensOut} на выходе`);

    const cost = await lookupCost(router, generationId, usage);
    if (cost !== null) {
      console.log(`Стоимость страницы: ${cost} (валюта маршрутизатора)`);
      console.log(`Сто страниц обойдутся примерно в ${(cost * 100).toFixed(2)}`);
    }

    console.log(`\n${"─".repeat(70)}\n${text}\n${"─".repeat(70)}`);
  } finally {
    pdf.close();
  }
}

/**
 * Сколько стоил запрос.
 *
 * В ответе чата стоимости нет — маршрутизатор отдаёт её отдельным запросом по
 * идентификатору из заголовка. Знать цену важнее, чем сэкономить один вызов:
 * без неё выбор модели делается на глаз.
 */
async function lookupCost(
  router: Router,
  generationId: string | null,
  usage: { cost?: number }
): Promise<number | null> {
  if (typeof usage.cost === "number") return usage.cost;
  if (!generationId) return null;

  try {
    const response = await fetch(
      `${router.baseUrl}/generation?id=${encodeURIComponent(generationId)}`,
      { headers: { authorization: `Bearer ${router.apiKey}` } }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return typeof data.total_cost === "number" ? data.total_cost : null;
  } catch {
    // Не узнали цену — не повод считать проверку неудачной.
    return null;
  }
}

/* ------------------------------------------------------------------ */

async function main(): Promise<void> {
  const { flags, positional } = parseArgs(process.argv.slice(2));

  loadEnvFile(".env.local");
  loadEnvFile(".env");

  const router: Router = {
    baseUrl: (flags.get("base-url") || process.env.LLM_BASE_URL || DEFAULT_BASE_URL).replace(
      /\/$/,
      ""
    ),
    apiKey: process.env.LLM_API_KEY ?? "",
  };

  if (!router.apiKey) {
    fail(
      "Нет ключа. Положите его в .env.local строкой LLM_API_KEY=... или задайте\n" +
        "переменной окружения перед запуском."
    );
  }

  if (flags.has("whoami")) {
    await whoami(router);
    return;
  }

  if (flags.has("list")) {
    await listModels(router, Number(flags.get("top") ?? 30), flags.get("grep") ?? "");
    return;
  }

  const file = positional[0];
  const model = flags.get("model") || process.env.LLM_MODEL_VISION || "";

  if (!file) fail("Укажите файл: npm run check:vision -- скан.pdf --model <имя>");
  if (!model) fail("Укажите модель: --model <имя> или LLM_MODEL_VISION в .env.local");
  if (!existsSync(file)) fail(`Файл не найден: ${file}`);

  const format = flags.get("format") ?? "auto";
  if (format !== "auto" && format !== "png" && format !== "jpeg") {
    fail(`Формат бывает png, jpeg или auto — не «${format}»`);
  }

  await recognize(
    router,
    file,
    model,
    Number(flags.get("page") ?? 1),
    Number(flags.get("side") ?? 1400),
    flags.has("color"),
    format as "auto" | "png" | "jpeg",
    Number(flags.get("quality") ?? 85)
  );
}

try {
  await main();
} catch (caught) {
  console.error(caught instanceof Stop ? `\n${caught.message}` : caught);
  process.exitCode = 1;
}
