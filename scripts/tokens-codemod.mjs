/**
 * Перевод хардкод-цветов на семантические токены.
 *
 * ЗАЧЕМ ОТДЕЛЬНЫЙ ШАГ. Палитра проекта — тысяча двести классов `stone-*`,
 * вписанных прямо в компоненты. Пока они там, сменить оформление нельзя ничем,
 * кроме как пройти сотню файлов руками; а пройдя их руками один раз, ровно то же
 * придётся делать на второй смене оформления и на тёмной теме.
 *
 * Поэтому работа разделена надвое. Сначала — этот перевод, при котором значения
 * токенов равны нынешним оттенкам stone и **вид не меняется ни на пиксель**.
 * Потом — смена значений, которая укладывается в один файл. Первую половину
 * проверяет машина сравнением снимков, вторая откатывается одной строкой.
 *
 * ЧТО ЗДЕСЬ И ЧЕГО ЗДЕСЬ НЕТ. Замены ниже — только те, где оттенок означает
 * одно и то же везде: заголовок всегда заголовок, граница всегда граница.
 * Неоднозначное — `bg-stone-900` (то кнопка, то тёмная обложка), `bg-stone-50`
 * (то фон приложения, то подложка ховера), `text-white` (то на кнопке, то на
 * тёмной секции) — сюда не входит намеренно и правится глазами. Автозамена,
 * которая «в основном права», хуже отсутствия автозамены: ошибки она
 * расставляет ровным слоем и незаметно.
 *
 *   node scripts/tokens-codemod.mjs --dry     показать, что будет заменено
 *   node scripts/tokens-codemod.mjs           заменить
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const DIRS = ["app", "components", "types"];
const DRY = process.argv.includes("--dry");

/**
 * Замены.
 *
 * ГЛАВНОЕ ПРАВИЛО: каждая пара один в один по значению. `--fg` в точности равен
 * `stone-900`, `--line` в точности равен `stone-200`. Пока это так, замена не
 * может сдвинуть ни пикселя, и снимки обязаны совпасть — а если не совпали,
 * ошибка в кодмоде, и её видно сразу.
 *
 * Сливать два оттенка в один токен здесь нельзя, как бы ни хотелось: `stone-600`
 * и `stone-700` оба означают «второстепенный текст», но это разные цвета, и
 * слияние немедленно ломает проверку. Свести их — отдельная правка с осмотром
 * тех экранов, которых она коснётся.
 */
const REPLACEMENTS = [
  /* Текст: шесть ступеней — ровно столько, сколько сейчас в коде. */
  ["text-stone-900", "text-fg"],
  ["text-stone-700", "text-fg-muted"],
  ["text-stone-600", "text-fg-soft"],
  ["text-stone-500", "text-fg-subtle"],
  ["text-stone-400", "text-fg-faint"],
  ["text-stone-300", "text-fg-ghost"],

  /* Границы и разделители. */
  ["border-stone-200", "border-line"],
  ["border-stone-300", "border-line-strong"],
  ["border-stone-100", "border-line-soft"],
  ["border-stone-800", "border-inverse-line"],
  ["divide-stone-200", "divide-line"],
  ["divide-stone-100", "divide-line-soft"],

  /* Поверхности. Здесь только те, что не спорят сами с собой. */
  ["bg-white", "bg-surface"],
  ["bg-stone-100", "bg-surface-2"],
  ["bg-stone-200", "bg-surface-3"],

  /* Кольцо фокуса. */
  ["ring-stone-400", "ring-focus"],
];

/**
 * Что не трогаем и почему.
 *
 * Каждая строка — оттенок, у которого в этом проекте больше одного смысла.
 * Список нужен не коду, а человеку: он отвечает на вопрос «а почему после
 * кодмода остался stone».
 */
const LEFT_BY_HAND = {
  "bg-stone-50": "то фон приложения, то подложка ховера",
  "border-stone-900": "состояние «выбрано» — не то же, что основной текст",
  "bg-stone-900": "то основное действие (кнопка), то тёмная секция",
  "bg-stone-950": "то кнопка, то обложка во всю ширину",
  "text-white": "то текст на кнопке, то текст на тёмной секции",
  "text-stone-800": "почти всегда внутри тёмной секции",
  "text-stone-950": "чернее основного текста — решать по месту",
  "text-stone-200": "текст на тёмном",
  "text-stone-100": "текст на тёмном",
  "bg-stone-300": "то точка-индикатор, то заглушка",
  "bg-stone-400": "то точка-индикатор, то заглушка",
  "bg-stone-700": "внутри тёмной секции",
  "bg-stone-800": "внутри тёмной секции",
  "border-stone-400": "усиленная граница — редкий случай",
  "border-stone-700": "граница внутри тёмной секции",
  "border-stone-950": "граница обложки",
  "ring-stone-900": "кольцо выбранного, не фокуса",
  "ring-stone-300": "единственное вхождение",
  "divide-stone-800": "разделитель внутри тёмной секции",
};

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.tsx?$/.test(entry.name)) yield full;
  }
}

const tally = new Map();
const leftovers = new Map();
let touched = 0;

for (const dir of DIRS) {
  for await (const file of walk(path.join(ROOT, dir))) {
    const before = await readFile(file, "utf8");
    let after = before;

    for (const [from, to] of REPLACEMENTS) {
      /*
       * Границы слова обязательны. Без них `text-stone-90` внутри
       * `text-stone-900` подменится, а `hover:text-stone-900` — нет, потому что
       * префикс уедет. Разделителями в классах служат пробел, кавычка, скобка и
       * двоеточие модификатора.
       */
      const pattern = new RegExp(`(?<![\\w-])${from}(?![\\w-])`, "g");
      const hits = after.match(pattern);
      if (!hits) continue;

      after = after.replace(pattern, to);
      tally.set(from, (tally.get(from) ?? 0) + hits.length);
    }

    for (const stayed of Object.keys(LEFT_BY_HAND)) {
      const pattern = new RegExp(`(?<![\\w-])${stayed}(?![\\w-])`, "g");
      const hits = after.match(pattern);
      if (hits) {
        leftovers.set(stayed, (leftovers.get(stayed) ?? 0) + hits.length);
      }
    }

    if (after !== before) {
      touched += 1;
      if (!DRY) await writeFile(file, after);
    }
  }
}

const replaced = [...tally.values()].reduce((sum, n) => sum + n, 0);

console.log(`\n${DRY ? "Будет заменено" : "Заменено"}: ${replaced} в ${touched} файлах\n`);
for (const [from, n] of [...tally].sort((a, b) => b[1] - a[1])) {
  const to = REPLACEMENTS.find(([key]) => key === from)?.[1];
  console.log(`  ${String(n).padStart(4)}  ${from.padEnd(20)} → ${to}`);
}

const left = [...leftovers.values()].reduce((sum, n) => sum + n, 0);
console.log(`\nОставлено на руки: ${left}\n`);
for (const [name, n] of [...leftovers].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(4)}  ${name.padEnd(20)}  ${LEFT_BY_HAND[name]}`);
}
console.log("");
