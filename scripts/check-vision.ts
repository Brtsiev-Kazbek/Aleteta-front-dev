/**
 * Проверка vision-модели на настоящей странице документа.
 *
 * Скрипт проходит ровно тот путь, которым потом пойдёт распознавание в
 * Edge Function: берёт PDF, рисует страницу тем же движком, кодирует в PNG тем
 * же кодировщиком и отправляет тем же запросом. Поэтому если он отработал —
 * отработает и конвейер, а если нет, видно, где именно сломалось: на рендере,
 * на формате картинки или на самой модели.
 *
 * Запуск:
 *   npm run check:vision -- --list
 *   npm run check:vision -- договор.pdf --model gemini-2.5-flash
 *
 * Ключ берётся из переменной LLM_API_KEY или из .env.local. В аргументах его
 * передавать не надо: командная строка попадает в историю оболочки.
 *
 * Нужен Node 22.6 или новее — скрипт на TypeScript исполняется напрямую.
 */

import { readFileSync, existsSync } from "node:fs";

import { openPdf, looksLikePdf } from "../supabase/functions/_shared/pdf.ts";

const OCR_PROMPT = `Перенеси в текст всё, что написано на странице документа.

Правила:
1. Сохраняй порядок и структуру: заголовки, нумерацию пунктов, таблицы строками.
2. Ничего не сокращай, не пересказывай и не исправляй — это не пересказ, а перенос.
3. Числа, номера и даты переноси посимвольно: именно они потом попадут в документы.
4. Печати, подписи и штампы отмечай как [печать], [подпись] с расшифровкой, если читается.
5. Если страница пустая или нечитаемая — верни пустую строку.

Верни только текст страницы, без пояснений и без обрамления.`;

/* ------------------------------------------------------------------ */

/*
 * Разбор аргументов: всё, что начинается с двух дефисов, — ключ, следующее за
 * ним слово — значение, остальное складывается в свободные аргументы.
 * Отдельно `--list`, у которого значения нет.
 */
const args = process.argv.slice(2);
const flags = new Map<string, string>();
const positional: string[] = [];

for (let i = 0; i < args.length; i += 1) {
  const argument = args[i];

  if (!argument.startsWith("--")) {
    positional.push(argument);
    continue;
  }

  const name = argument.slice(2);
  if (name === "list") {
    flags.set(name, "yes");
    continue;
  }

  flags.set(name, args[i + 1] ?? "");
  i += 1;
}

const flag = (name: string): string | undefined => flags.get(name);

loadEnvFile(".env.local");
loadEnvFile(".env");

const baseUrl = (
  flag("base-url") ?? process.env.LLM_BASE_URL ?? "https://routerai.ru/v1"
).replace(/\/$/, "");
const apiKey = process.env.LLM_API_KEY ?? "";

if (!apiKey) {
  fail(
    "Нет ключа. Положите его в .env.local строкой LLM_API_KEY=... или задайте\n" +
      "переменной окружения: LLM_API_KEY=... npm run check:vision -- --list"
  );
}

if (flag("list")) {
  await listModels();
  process.exit(0);
}

const file = positional[0];
const model = flag("model") ?? process.env.LLM_MODEL_VISION ?? "";
const pageNumber = Number(flag("page") ?? 1);

if (!file) fail("Укажите файл: npm run check:vision -- договор.pdf --model ...");
if (!model) fail("Укажите модель: --model <имя> или LLM_MODEL_VISION в .env.local");
if (!existsSync(file)) fail(`Файл не найден: ${file}`);

await recognize(file, model, pageNumber);

/* ------------------------------------------------------------------ */

/** Что вообще есть в каталоге маршрутизатора. */
async function listModels(): Promise<void> {
  const response = await post(`${baseUrl}/models`, {
    method: "GET",
    headers: { authorization: `Bearer ${apiKey}` },
  });

  if (!response.ok) {
    fail(`Каталог ответил ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }

  const data = await response.json();
  const names: string[] = (data.data ?? data.models ?? [])
    .map((item: { id?: string; name?: string }) => item.id ?? item.name ?? "")
    .filter(Boolean)
    .sort();

  console.log(`Моделей в каталоге: ${names.length}\n`);

  /*
   * Названия vision-моделей никак не размечены, поэтому просто подсказываем,
   * на что смотреть в первую очередь: эти семейства читают документы хорошо и
   * стоят недорого.
   */
  const worthTrying = names.filter((name) =>
    /gemini|qwen.*vl|gpt-4\.1|gpt-5|pixtral|internvl|llama.*vision|claude/i.test(name)
  );

  if (worthTrying.length) {
    console.log("Похожие на подходящие:");
    for (const name of worthTrying) console.log(`  ${name}`);
    console.log();
  }

  console.log("Все:");
  for (const name of names) console.log(`  ${name}`);
}

/** Одна страница: рендер, отправка, ответ. */
async function recognize(path: string, modelName: string, page: number): Promise<void> {
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

    const image = await pdf.render(page);
    const kilobytes = Math.round((image.dataUrl.length * 3) / 4 / 1024);
    console.log(
      `Картинка: ${image.width}×${image.height}, ${kilobytes} КБ, краски ` +
        `${(image.ink * 100).toFixed(2)}%, рендер ${Date.now() - startedRender} мс\n`
    );

    const startedModel = Date.now();
    const response = await post(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
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

    const body = await response.text();

    if (!response.ok) {
      console.error(`\nМодель ответила ${response.status}:\n${body.slice(0, 800)}`);
      if (/image|url|base64|data:/i.test(body)) {
        console.error(
          "\nПохоже, поставщик не принимает картинку строкой data:. Тогда её\n" +
            "придётся класть в хранилище и слать ссылкой — скажите, переделаю."
        );
      }
      process.exit(1);
    }

    const data = JSON.parse(body);
    const text: string = data.choices?.[0]?.message?.content ?? "";

    console.log(`Ответ за ${Date.now() - startedModel} мс`);
    console.log(
      `Токены: ${data.usage?.prompt_tokens ?? "?"} на входе, ` +
        `${data.usage?.completion_tokens ?? "?"} на выходе` +
        (data.usage?.cost != null ? `, стоимость ${data.usage.cost}` : "")
    );
    console.log(`\n${"─".repeat(70)}\n${text}\n${"─".repeat(70)}`);
  } finally {
    pdf.close();
  }
}

/**
 * Запрос с понятной ошибкой вместо стека undici.
 *
 * Не достучались — это почти всегда опечатка в адресе или закрытый доступ, и
 * человеку надо сказать именно это, а не показывать двадцать строк из
 * внутренностей Node.
 */
async function post(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch (caught) {
    const reason = caught instanceof Error ? (caught.cause ?? caught.message) : caught;
    fail(`Не удалось обратиться к ${url}\n${String(reason)}`);
  }
}

/** Простое чтение .env: тянуть ради этого зависимость незачем. */
function loadEnvFile(name: string): void {
  if (!existsSync(name)) return;

  for (const line of readFileSync(name, "utf8").split("\n")) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
    if (!match) continue;

    const [, key, raw] = match;
    if (process.env[key]) continue;

    process.env[key] = raw.trim().replace(/^["']|["']$/g, "");
  }
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}
