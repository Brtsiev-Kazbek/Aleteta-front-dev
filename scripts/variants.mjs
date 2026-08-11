/**
 * Примерка вариантов оформления.
 *
 * Смысл всей работы с токенами был в том, чтобы облик менялся правкой значений,
 * а не сотни файлов. Этот скрипт этим и пользуется: подставляет набор значений,
 * собирает, снимает два показательных экрана и возвращает всё как было.
 *
 * Спорить об оформлении словами бессмысленно — «спокойнее», «строже», «дороже»
 * означают у разных людей разное. Проще посмотреть.
 *
 *   node scripts/variants.mjs            снять все варианты
 *   node scripts/variants.mjs тише       снять один
 */

import { spawn } from "node:child_process";
import { readFile, writeFile, mkdir, rm, cp } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const CSS = path.join(ROOT, "app/globals.css");
const CONFIG = path.join(ROOT, "tailwind.config.ts");
const OUT = path.join(ROOT, ".shots/варианты");

/**
 * Варианты.
 *
 * `css` — пары «переменная → значение», подставляются в `:root`.
 * `scale` — пары «ступень → определение», подставляются в шкалу кеглей.
 *
 * Все три отличаются одним и тем же: насколько громко звучат микро-подписи и
 * насколько крупен основной текст. Это и есть та ось, по которой набор
 * ощущается либо собранным, либо расхлябанным.
 */
const VARIANTS = {
  /*
   * Прежний характер, но на токенах: волосяные подписи, плотный текст, тёплый
   * серый. То, что было до правки, — со всеми починками и без хардкода.
   */
  прежний: {
    css: {
      "--bg": "250 250 249",
      "--surface": "255 255 255",
      "--surface-2": "245 245 244",
      "--surface-3": "231 229 228",
      "--fg": "28 25 23",
      "--fg-muted": "68 64 60",
      "--fg-soft": "87 83 78",
      "--fg-subtle": "120 113 108",
      "--fg-faint": "168 162 158",
      "--fg-ghost": "214 211 209",
      "--line": "231 229 228",
      "--line-soft": "245 245 244",
      "--line-strong": "214 211 209",
      "--brand": "139 92 246",
      "--brand-strong": "124 58 237",
      "--radius": "0.25rem",
      "--row-h": "2.75rem",
    },
    scale: {
      label: `["0.625rem", { lineHeight: "0.875rem", letterSpacing: "0.12em" }]`,
      caption: `["0.75rem", { lineHeight: "1.0625rem" }]`,
      "body-sm": `["0.8125rem", { lineHeight: "1.25rem" }]`,
      body: `["0.8125rem", { lineHeight: "1.3125rem" }]`,
    },
  },

  /*
   * Тише: тот же читательский набор, но микро-подписи возвращены на своё место
   * — волосяными, а основной текст на полступени ниже. Иерархия держится на
   * контрасте масштаба, а не на том, что всё крупное.
   */
  тише: {
    css: {
      "--radius": "0.5rem",
      "--row-h": "2.75rem",
      "--line": "233 233 236",
      "--fg-faint": "148 148 158",
    },
    scale: {
      label: `["0.625rem", { lineHeight: "0.875rem", letterSpacing: "0.1em" }]`,
      caption: `["0.75rem", { lineHeight: "1.0625rem" }]`,
      "body-sm": `["0.8125rem", { lineHeight: "1.25rem" }]`,
      body: `["0.875rem", { lineHeight: "1.375rem" }]`,
    },
  },

  /*
   * Книжный: тёплая бумага, глубокая чернильная гамма, крупный текст для
   * чтения и совсем тихие подписи. Ближе всего к тому, чем продукт является по
   * существу, — работе с документами.
   */
  книжный: {
    css: {
      "--bg": "250 249 246",
      "--surface": "255 255 254",
      "--surface-2": "246 244 240",
      "--surface-3": "236 233 227",
      "--fg": "26 24 21",
      "--fg-muted": "74 70 64",
      "--fg-soft": "74 70 64",
      "--fg-subtle": "110 104 96",
      "--fg-faint": "158 151 140",
      "--fg-ghost": "208 202 192",
      "--line": "232 228 220",
      "--line-soft": "242 239 233",
      "--line-strong": "214 208 198",
      "--brand": "22 78 99",
      "--brand-strong": "14 58 74",
      "--brand-soft": "236 243 246",
      "--brand-line": "199 220 228",
      "--radius": "0.375rem",
      "--row-h": "2.875rem",
    },
    scale: {
      label: `["0.625rem", { lineHeight: "0.875rem", letterSpacing: "0.11em" }]`,
      caption: `["0.75rem", { lineHeight: "1.125rem" }]`,
      "body-sm": `["0.8125rem", { lineHeight: "1.3125rem" }]`,
      body: `["0.9375rem", { lineHeight: "1.5625rem" }]`,
    },
  },
};

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: ROOT, stdio: "inherit", ...options });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${command}: код ${code}`))
    );
  });
}

/** Подставляет значение переменной в `:root`, сохраняя комментарии рядом. */
function setVariable(css, name, value) {
  const pattern = new RegExp(`(\\s${name.replace(/-/g, "\\-")}:\\s*)[^;]+;`);
  if (!pattern.test(css)) {
    console.warn(`  переменная ${name} не найдена — пропущена`);
    return css;
  }
  return css.replace(pattern, `$1${value};`);
}

/** Подставляет определение ступени в шкалу кеглей. */
function setStep(config, step, definition) {
  const key = step.includes("-") ? `"${step}"` : step;
  const pattern = new RegExp(`(\\s${key}:\\s*)\\[[^\\]]*\\}\\],`);
  if (!pattern.test(config)) {
    console.warn(`  ступень ${step} не найдена — пропущена`);
    return config;
  }
  return config.replace(pattern, `$1${definition},`);
}

const wanted = process.argv[2] ? [process.argv[2]] : Object.keys(VARIANTS);

const cssBackup = await readFile(CSS, "utf8");
const configBackup = await readFile(CONFIG, "utf8");

await mkdir(OUT, { recursive: true });

try {
  for (const name of wanted) {
    const variant = VARIANTS[name];
    if (!variant) {
      console.error(`Нет варианта «${name}». Есть: ${Object.keys(VARIANTS).join(", ")}`);
      continue;
    }

    console.log(`\n=== вариант «${name}» ===`);

    let css = cssBackup;
    for (const [key, value] of Object.entries(variant.css ?? {})) {
      css = setVariable(css, key, value);
    }
    await writeFile(CSS, css);

    let config = configBackup;
    for (const [step, definition] of Object.entries(variant.scale ?? {})) {
      config = setStep(config, step, definition);
    }
    await writeFile(CONFIG, config);

    await run("node", ["scripts/shots.mjs", `вариант-${name}`], {
      env: {
        ...process.env,
        SHOTS_ONLY: "case-entities,dashboard,settings",
        SHOTS_WIDTHS: "1440",
      },
    });

    await cp(path.join(ROOT, ".shots", `вариант-${name}`), path.join(OUT, name), {
      recursive: true,
    });
    await rm(path.join(ROOT, ".shots", `вариант-${name}`), { recursive: true, force: true });
  }
} finally {
  await writeFile(CSS, cssBackup);
  await writeFile(CONFIG, configBackup);
  console.log("\nИсходные значения возвращены на место.");
}
