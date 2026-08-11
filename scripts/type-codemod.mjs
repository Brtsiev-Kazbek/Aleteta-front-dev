/**
 * Перевод кеглей на шкалу.
 *
 * В коде четыреста тридцать два произвольных размера и сто восемьдесят девять
 * произвольных трекингов. Шесть ступеней там, где нужно три; пять значений
 * разрядки для одной и той же роли; `text-[14px]`, дублирующий `text-sm`;
 * `text-[2rem]` по соседству с `text-3xl`, который равен 1.875rem. Единого
 * источника правды нет — размер вписан прямо в каждый файл.
 *
 * ЧТО МЕНЯЕТСЯ ПО СУЩЕСТВУ. Базовый размер интерфейса растёт с тринадцати точек
 * до пятнадцати. Это и есть заказанный «читательский» набор, и это же его цена:
 * на экран влезает меньше. Поэтому шкала не одна на всё — поверхности данных
 * (таблица реквизитов, списки файлов и дел) остаются на `body-sm`, поверхности
 * чтения переходят на `body`.
 *
 * ЧЕГО ЗДЕСЬ НЕТ. Разрядка у подписей не переносится: она уже задана внутри
 * ступени `label`, и оставлять её снаружи значит иметь два источника правды —
 * ровно то, от чего уходим. Поэтому `tracking-[0.1em]` и его четыре брата
 * рядом с `text-label` просто удаляются.
 *
 *   node scripts/type-codemod.mjs --dry
 *   node scripts/type-codemod.mjs
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const DIRS = ["app", "components"];
const DRY = process.argv.includes("--dry");

/**
 * Поверхности данных.
 *
 * Здесь `text-[13px]` остаётся мелким (`body-sm`), а не вырастает до `body`:
 * дело на сорок файлов должно помещаться на экран, ради этого экраны и
 * делались. На всех остальных тот же размер становится основным.
 */
const DENSE = [
  "components/workspace/BatchGenerationGrid.tsx",
  "components/workspace/CaseDocumentsTab.tsx",
  "components/dashboard/RecentCases.tsx",
  "components/recognize/RecognizeWorkbench.tsx",
  "components/settings/UsagePanel.tsx",
  "components/settings/MembersPanel.tsx",
];

/** Ступени, одинаковые везде. */
const COMMON = [
  /* Подписи: девять, десять и одиннадцать точек значили одно и то же. */
  ["text-[9px]", "text-label"],
  ["text-[10px]", "text-label"],
  ["text-[11px]", "text-label"],
  ["text-[11.5px]", "text-label"],

  /* Мелкий пояснительный. */
  ["text-[12px]", "text-caption"],
  ["text-[12.5px]", "text-caption"],
  ["text-xs", "text-caption"],

  /* Основной. */
  ["text-[14px]", "text-body"],
  ["text-[15px]", "text-body"],
  ["text-sm", "text-body"],
  ["text-base", "text-body-lg"],

  /* Заголовки панелей. */
  ["text-[17px]", "text-title-sm"],
  ["text-[19px]", "text-title-sm"],
  ["text-lg", "text-title-sm"],
  ["text-xl", "text-title"],
  ["text-[1.35rem]", "text-title"],

  /* Крупные. */
  ["text-2xl", "text-heading"],
  ["text-[1.6rem]", "text-heading"],
  ["text-[1.75rem]", "text-heading"],
  ["text-3xl", "text-display"],
  ["text-[2rem]", "text-display"],
  ["text-[2.25rem]", "text-display"],
  ["text-4xl", "text-display-lg"],
  ["text-[2.5rem]", "text-display-lg"],
  ["text-[2.75rem]", "text-display-lg"],
  ["text-5xl", "text-display-lg"],
  ["text-6xl", "text-display-lg"],
];

/**
 * Разрядка, уехавшая внутрь ступеней.
 *
 * Положительная — примета подписи, и живёт теперь в `label`. Отрицательная —
 * примета крупного заголовка, и живёт в `title`, `heading`, `display`.
 */
const TRACKING = [
  "tracking-[0.08em]",
  "tracking-[0.1em]",
  "tracking-[0.12em]",
  "tracking-[0.14em]",
  "tracking-[0.16em]",
  "tracking-[0.18em]",
  "tracking-wide",
  "tracking-[-0.01em]",
  "tracking-[-0.015em]",
  "tracking-[-0.02em]",
  "tracking-[-0.025em]",
  "tracking-[-0.03em]",
  "tracking-[-0.035em]",
  "tracking-tight",
];

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.tsx?$/.test(entry.name)) yield full;
  }
}

function boundary(token) {
  return new RegExp(`(?<![\\w-])${token.replace(/[.[\]]/g, "\\$&")}(?![\\w-])`, "g");
}

const tally = new Map();
let touched = 0;
let trackingDropped = 0;

for (const dir of DIRS) {
  for await (const file of walk(path.join(ROOT, dir))) {
    const relative = path.relative(ROOT, file);
    const before = await readFile(file, "utf8");
    let after = before;

    const pairs = [
      // На плотных поверхностях основной размер остаётся мелким.
      ["text-[13px]", DENSE.includes(relative) ? "text-body-sm" : "text-body"],
      ...COMMON,
    ];

    for (const [from, to] of pairs) {
      const pattern = boundary(from);
      const hits = after.match(pattern);
      if (!hits) continue;
      after = after.replace(pattern, to);
      tally.set(from, (tally.get(from) ?? 0) + hits.length);
    }

    /*
     * Разрядку убираем только там, где рядом стоит ступень, которая её уже
     * несёт. Одинокий `tracking-` на элементе без нашего кегля мог быть
     * поставлен зачем-то ещё — такой не трогаем.
     */
    for (const token of TRACKING) {
      const pattern = new RegExp(
        `(?<![\\w-])${token.replace(/[.[\]]/g, "\\$&")}(?![\\w-])\\s?`,
        "g"
      );
      const hits = after.match(pattern);
      if (!hits) continue;
      after = after.replace(pattern, "");
      trackingDropped += hits.length;
    }

    if (after !== before) {
      touched += 1;
      if (!DRY) await writeFile(file, after);
    }
  }
}

const total = [...tally.values()].reduce((sum, n) => sum + n, 0);
console.log(`\n${DRY ? "Будет заменено" : "Заменено"}: ${total} кеглей в ${touched} файлах`);
console.log(`Разрядок убрано (уехали внутрь ступеней): ${trackingDropped}\n`);

for (const [from, n] of [...tally].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(4)}  ${from}`);
}
console.log("");
