/**
 * Проверки того, чего не видно на снимке.
 *
 * Снимок экрана ловит смещение на пиксель, но не ловит главного: работает ли
 * то, что нарисовано. Примороженная колонка на неподвижной таблице выглядит
 * ровно так же, как рабочая, — разница видна только при горизонтальной
 * прокрутке. Ячейка, потерявшая фокус после клика, на картинке неотличима от
 * исправной.
 *
 * Здесь собраны проверки ровно тех мест, которые в этом проекте уже ломались
 * или которые сломаются от правки разметки в первую очередь. Список короткий
 * намеренно: набор из пяти проверок, которые запускают перед каждым коммитом,
 * полезнее набора из пятидесяти, которые не запускают никогда.
 *
 * Работает, как и съёмка, в демонстрационном режиме — без базы и без входа.
 * Отсюда граница применимости, и её надо знать: распознавание в этом режиме
 * показывает пустой экран, потому что страниц в базе нет. Ручной расчёт
 * прокрутки в `RecognizeWorkbench` отсюда не проверяется — за ним следят
 * статические стражи в `scripts/guards.mjs` и ручная проверка на живых данных.
 *
 *   node scripts/smoke.mjs
 */

import { spawn } from "node:child_process";
import { readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

const ROOT = process.cwd();
const PORT = Number(process.env.SMOKE_PORT ?? 3312);
const BASE = `http://127.0.0.1:${PORT}`;
const EXECUTABLE = process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";

const ENV_LOCAL = path.join(ROOT, ".env.local");

/* ------------------------------------------------------------------ */

const checks = [];
let failed = 0;

/** Объявляет проверку. Падение одной не отменяет остальных — важно всё сразу. */
function check(name, body) {
  checks.push({ name, body });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

/* ------------------------------------------------------------------ */
/*  ПРОВЕРКИ                                                           */
/* ------------------------------------------------------------------ */

/**
 * Примороженная первая колонка таблицы реквизитов.
 *
 * Держится не на API таблицы, а на связке `position: sticky` + `left` в
 * inline-стиле + `relative` у скролл-контейнера + `border-separate`. Выпадение
 * любого звена ломает приморозку молча: колонка просто уезжает вместе с
 * остальными, и заметить это можно, только прокрутив таблицу вбок.
 */
check("примороженная колонка не уезжает при прокрутке вбок", async (page) => {
  await page.goto(`${BASE}/cases/case-1`, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: /объект/i }).click();
  await page.waitForSelector("table td");

  const cell = page.locator("table tbody tr").first().locator("td").first();
  const before = await cell.boundingBox();
  assert(before, "первая ячейка не нашлась");

  const scroller = page.locator("table").first().locator("xpath=ancestor::div[1]");
  await scroller.evaluate((node) => {
    node.scrollLeft = 400;
  });
  await page.waitForTimeout(150);

  const after = await cell.boundingBox();
  assert(after, "первая ячейка пропала после прокрутки");

  const drift = Math.abs(after.x - before.x);
  assert(
    drift < 4,
    `колонка уехала на ${Math.round(drift)}px — приморозка сломана`
  );
});

/**
 * Правка ячейки: клик, фокус, сохранение.
 *
 * Фокус даётся через `requestAnimationFrame` после появления инпута — то есть
 * зависит от того, в каком кадре элемент попал в DOM. Любая вставка обёртки или
 * смена условий отрисовки способна разорвать эту цепочку, и тогда по клику
 * инпут появляется, но печатать в него нельзя.
 */
check("ячейка открывается на правку и сохраняет значение", async (page) => {
  await page.goto(`${BASE}/cases/case-1`, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: /объект/i }).click();
  await page.waitForSelector("table td");

  const cell = page.locator("table tbody tr").first().locator("td").nth(1);
  await cell.click();

  const input = page.locator("table input").first();
  await input.waitFor({ state: "visible", timeout: 3_000 });

  const focused = await input.evaluate((node) => node === document.activeElement);
  assert(focused, "инпут появился, но фокус в него не попал");

  await input.fill("Проверка 15:09:0000000:0001");
  await input.press("Enter");
  await page.waitForTimeout(200);

  const text = await cell.innerText();
  assert(
    text.includes("Проверка"),
    `после Enter в ячейке «${text.trim()}», а не введённое значение`
  );
});

/**
 * Подчёркивание вкладок дела.
 *
 * Единственный элемент во всём проекте, анимируемый через `layoutId`. Он
 * зависит от `relative` у кнопки вкладки и `absolute inset-x-0 -bottom-px` у
 * самой полоски; потеря любого из двух отправляет подчёркивание в угол экрана,
 * и это ровно тот случай, когда вёрстка «выглядит нормально» на статичном
 * снимке.
 */
check("подчёркивание переезжает к выбранной вкладке", async (page) => {
  await page.goto(`${BASE}/cases/case-1`, { waitUntil: "networkidle" });

  const tabs = page.getByRole("tab");
  const first = tabs.nth(0);
  const last = tabs.nth((await tabs.count()) - 1);

  await first.click();
  await page.waitForTimeout(400);
  const underline = page.locator('[data-underline], [class*="bottom-px"]').first();

  await last.click();
  await page.waitForTimeout(500);

  const tabBox = await last.boundingBox();
  const lineBox = await underline.boundingBox().catch(() => null);
  assert(lineBox, "полоска подчёркивания не нашлась");
  assert(tabBox, "вкладка не нашлась");

  const offset = Math.abs(lineBox.x - tabBox.x);
  assert(
    offset < 24,
    `подчёркивание в ${Math.round(offset)}px от вкладки — layoutId сломан`
  );
});

/**
 * Шторки открываются и закрываются.
 *
 * Восемь шторок держат состояние открытости в сторе, а не в себе. Значит,
 * состояние переживает перемонтирование, и при перекладывании компонентов
 * шторка может «остаться открытой» или, наоборот, перестать открываться.
 */
check("шторка ассистента открывается и закрывается", async (page) => {
  await page.goto(`${BASE}/cases/case-1`, { waitUntil: "networkidle" });

  await page.getByRole("button", { name: /ассистент/i }).first().click();
  const sheet = page.getByRole("dialog").first();
  await sheet.waitFor({ state: "visible", timeout: 3_000 });

  await page.keyboard.press("Escape");
  await sheet.waitFor({ state: "hidden", timeout: 3_000 });
});

/**
 * Страница не едет вбок.
 *
 * Самая частая и самая заметная поломка адаптива: одна таблица с `min-w`, не
 * обёрнутая в прокрутку, — и вся страница ездит по горизонтали на телефоне.
 * Проверяем на всех основных экранах разом, потому что стоит это один проход.
 */
check("на телефоне ничего не вылезает за ширину экрана", async (page) => {
  const routes = ["/", "/dashboard", "/cases/case-1", "/dashboard/recognize"];
  const guilty = [];

  await page.setViewportSize({ width: 375, height: 812 });

  for (const route of routes) {
    await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );

    if (overflow > 1) guilty.push(`${route} (+${overflow}px)`);
  }

  assert(guilty.length === 0, `страница едет вбок: ${guilty.join(", ")}`);
});

/* ------------------------------------------------------------------ */
/*  ЗАПУСК                                                             */
/* ------------------------------------------------------------------ */

async function enterDemoMode() {
  let saved = null;
  try {
    saved = await readFile(ENV_LOCAL, "utf8");
  } catch {
    /* Файла нет — и хорошо. */
  }

  await writeFile(
    ENV_LOCAL,
    "# создано scripts/smoke.mjs — будет удалено\nNEXT_PUBLIC_SUPABASE_URL=\nNEXT_PUBLIC_SUPABASE_ANON_KEY=\n"
  );

  return async () => {
    if (saved === null) await rm(ENV_LOCAL, { force: true });
    else await writeFile(ENV_LOCAL, saved);
  };
}

async function startServer() {
  await new Promise((resolve, reject) => {
    const build = spawn("npx", ["next", "build"], { cwd: ROOT, stdio: "inherit" });
    build.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`сборка вышла с кодом ${code}`))
    );
  });

  const server = spawn("npx", ["next", "start", "--port", String(PORT)], {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
  });

  const deadline = Date.now() + 60_000;
  for (;;) {
    if (Date.now() > deadline) {
      server.kill("SIGTERM");
      throw new Error("сервер не поднялся за минуту");
    }
    try {
      const response = await fetch(BASE, { signal: AbortSignal.timeout(1_000) });
      if (response.status < 500) break;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return async () => {
    server.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 300));
  };
}

const restoreEnv = await enterDemoMode();
let stopServer = null;

try {
  stopServer = await startServer();

  const browser = await chromium.launch({ executablePath: EXECUTABLE });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
    locale: "ru-RU",
    timezoneId: "Europe/Moscow",
  });

  console.log("");

  for (const { name, body } of checks) {
    const page = await context.newPage();
    try {
      await body(page);
      console.log(`  ок   ${name}`);
    } catch (caught) {
      failed += 1;
      console.log(`  СБОЙ ${name}`);
      console.log(`       ${caught.message.split("\n")[0]}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();

  console.log(
    `\n${checks.length - failed} из ${checks.length} проверок прошло${failed ? "" : " — всё цело"}\n`
  );
} finally {
  if (stopServer) await stopServer();
  await restoreEnv();
}

process.exit(failed > 0 ? 1 : 0);
