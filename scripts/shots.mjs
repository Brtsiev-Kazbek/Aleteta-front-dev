/**
 * Снимок всего интерфейса — до и после правки стиля.
 *
 * ЗАЧЕМ. Редизайн трогает больше тысячи классов в сотне файлов. Проверить это
 * глазами нельзя: даже если открыть каждый экран, никто не заметит, что на
 * шестом из них подпись стала на пиксель ниже. А заметит потом пользователь.
 *
 * Приём простой: снять весь интерфейс до правки, снять после и сравнить
 * попиксельно. На шагах, где вид меняться НЕ должен — а это самая объёмная и
 * скучная часть работы, перевод хардкод-цветов на токены, — любое расхождение
 * означает ошибку миграции. На шагах, где вид меняться должен, те же снимки
 * служат контактным листом: пятьдесят картинок рядом видно лучше, чем пятьдесят
 * переходов по ссылкам.
 *
 * ПОЧЕМУ БЕЗ ВХОДА. Приложение умеет работать без базы — на встроенном наборе:
 * `middleware.ts:41` пропускает всё, когда переменные Supabase не заданы, а
 * `loadWorkspaceSnapshot` возвращает null и стор берёт демонстрационные данные.
 * Это даёт две вещи разом: не нужна учётная запись и не нужен доступ к боевому
 * проекту, а данные от запуска к запуску одни и те же. Снимок на живых данных
 * менялся бы каждый раз и сравнивать его было бы не с чем.
 *
 *   node scripts/shots.mjs before      снять в .shots/before
 *   node scripts/shots.mjs after       снять в .shots/after
 *   node scripts/shots.mjs diff before after
 */

import { spawn } from "node:child_process";
import { mkdir, readdir, readFile, rm, writeFile, access } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

import { chromium } from "playwright";

const ROOT = process.cwd();
const SHOTS = path.join(ROOT, ".shots");
const PORT = Number(process.env.SHOTS_PORT ?? 3311);
const BASE = `http://127.0.0.1:${PORT}`;

/*
 * Собранный образ Chromium в окружении старше пакета playwright, и пакет ищет
 * свою сборку по номеру. Указываем путь явно — качать вторую нечего.
 */
const EXECUTABLE = process.env.CHROMIUM_PATH ?? "/opt/pw-browsers/chromium";

/**
 * Что снимаем.
 *
 * `wait` — селектор, по которому видно, что страница дорисовалась. Без него
 * снимок ловит промежуточное состояние: анимация появления ещё идёт, и два
 * запуска подряд дают разные картинки.
 */
const ROUTES = [
  { name: "landing", url: "/", wait: "main" },
  { name: "login", url: "/auth/login", wait: "form" },
  { name: "register", url: "/auth/register", wait: "form" },
  { name: "forgot", url: "/auth/forgot-password", wait: "form" },
  { name: "docs", url: "/docs", wait: "main" },
  { name: "docs-roadmap", url: "/docs/roadmap", wait: "main" },
  { name: "dashboard", url: "/dashboard", wait: "main" },
  { name: "cases", url: "/dashboard/cases", wait: "main" },
  { name: "recognize", url: "/dashboard/recognize", wait: "main" },
  { name: "templates", url: "/dashboard/templates", wait: "main" },
  { name: "settings", url: "/dashboard/settings", wait: "main" },
  { name: "case", url: "/cases/case-1", wait: "main" },
  { name: "case-entities", url: "/cases/case-1?tab=entities", wait: "main" },
];

/** Телефон, ноутбук, большой экран. */
const WIDTHS = [375, 1024, 1440];

/* ------------------------------------------------------------------ */
/*  ДЕМОНСТРАЦИОННЫЙ РЕЖИМ                                             */
/* ------------------------------------------------------------------ */

/*
 * Переменные Supabase лежат в committed `.env`, и обнулить их можно только
 * файлом выше по старшинству. `.env.local` перекрывает `.env` и не попадает в
 * репозиторий. Свой чужой файл, если он есть, сохраняем и возвращаем на место:
 * потерять чьи-то локальные настройки ради снимка — плохой размен.
 */
const ENV_LOCAL = path.join(ROOT, ".env.local");
const MARKER = "# создано scripts/shots.mjs — будет удалено после съёмки\n";

async function enterDemoMode() {
  let saved = null;
  try {
    saved = await readFile(ENV_LOCAL, "utf8");
  } catch {
    // Файла нет — и хорошо.
  }

  await writeFile(
    ENV_LOCAL,
    `${MARKER}NEXT_PUBLIC_SUPABASE_URL=\nNEXT_PUBLIC_SUPABASE_ANON_KEY=\n`
  );

  return async function restore() {
    if (saved === null) await rm(ENV_LOCAL, { force: true });
    else await writeFile(ENV_LOCAL, saved);
  };
}

/* ------------------------------------------------------------------ */
/*  СЕРВЕР                                                             */
/* ------------------------------------------------------------------ */

/**
 * Сборка и запуск.
 *
 * Именно `build` + `start`, а не `dev`: в режиме разработки страница может
 * дорисовываться по частям и показывать оверлеи, и два снимка подряд выходят
 * разными. Сборка занимает минуту, зато снимает вопрос.
 */
function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      stdio: "inherit",
      ...options,
    });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${command} вышел с кодом ${code}`))
    );
  });
}

async function startServer() {
  console.log("Собираю приложение…");
  await run("npx", ["next", "build"]);

  console.log(`Запускаю на ${BASE}…`);
  const server = spawn("npx", ["next", "start", "--port", String(PORT)], {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
  });

  // Ждём, пока порт начнёт отвечать: `next start` печатает готовность не сразу.
  const deadline = Date.now() + 60_000;
  for (;;) {
    if (Date.now() > deadline) {
      server.kill("SIGTERM");
      throw new Error("сервер не поднялся за минуту");
    }
    try {
      const response = await fetch(BASE, { signal: AbortSignal.timeout(1_000) });
      if (response.ok || response.status < 500) break;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return async function stop() {
    server.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 300));
  };
}

/* ------------------------------------------------------------------ */
/*  СЪЁМКА                                                             */
/* ------------------------------------------------------------------ */

/**
 * Что глушим перед снимком.
 *
 * Всё, что живёт своей жизнью и от запуска к запуску попадает в кадр по-разному:
 * появления при прокрутке, бегущие строки, зерно, курсор в полях. Приложение
 * уже умеет это выключать — оно уважает `prefers-reduced-motion` в тридцати
 * шести местах, — и мы просто просим браузер притвориться, что человек попросил
 * поменьше движения. Остаток добиваем стилем.
 */
const FREEZE_CSS = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    caret-color: transparent !important;
  }
  html { scroll-behavior: auto !important; }
`;

async function capture(label) {
  const target = path.join(SHOTS, label);
  await rm(target, { recursive: true, force: true });
  await mkdir(target, { recursive: true });

  const browser = await chromium.launch({ executablePath: EXECUTABLE });

  try {
    for (const width of WIDTHS) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        deviceScaleFactor: 1,
        reducedMotion: "reduce",
        // Часовой пояс и язык влияют на форматирование дат в карточках дел.
        locale: "ru-RU",
        timezoneId: "Europe/Moscow",
      });

      const page = await context.newPage();
      await page.addStyleTag({ content: FREEZE_CSS }).catch(() => {});

      for (const route of ROUTES) {
        const name = `${route.name}@${width}`;

        try {
          await page.goto(`${BASE}${route.url}`, {
            waitUntil: "networkidle",
            timeout: 30_000,
          });
          await page.waitForSelector(route.wait, { timeout: 10_000 });
          await page.addStyleTag({ content: FREEZE_CSS });

          /*
           * Появления при прокрутке (`Reveal`, тринадцать мест) срабатывают по
           * попаданию в поле зрения. Снимок всей страницы их не запускает —
           * прокрутка нужна настоящая.
           */
          await page.evaluate(async () => {
            const step = window.innerHeight;
            for (let y = 0; y < document.body.scrollHeight; y += step) {
              window.scrollTo(0, y);
              await new Promise((r) => setTimeout(r, 60));
            }
            window.scrollTo(0, 0);
            await new Promise((r) => setTimeout(r, 120));
          });

          await page.screenshot({
            path: path.join(target, `${name}.png`),
            fullPage: true,
          });

          process.stdout.write(`  ${name}\n`);
        } catch (caught) {
          process.stdout.write(`  ${name} — не снялся: ${caught.message.split("\n")[0]}\n`);
        }
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }

  const files = (await readdir(target)).filter((f) => f.endsWith(".png"));
  console.log(`\nСнято ${files.length} из ${ROUTES.length * WIDTHS.length} в .shots/${label}`);
}

/* ------------------------------------------------------------------ */
/*  СРАВНЕНИЕ                                                          */
/* ------------------------------------------------------------------ */

/**
 * Сравнение по содержимому файла, а не по пикселям.
 *
 * Библиотеки сравнения картинок здесь не нужно: на шагах, где вид меняться не
 * должен, PNG обязан совпасть побайтово. Отличается хоть один байт — миграция
 * что-то задела, и надо смотреть глазами. Порог «допустимого расхождения» тут
 * был бы вреден: он ровно для того и заводится, чтобы не замечать мелочей, а
 * мелочи — это всё, что мы ищем.
 */
async function digest(file) {
  return createHash("sha256").update(await readFile(file)).digest("hex");
}

async function diff(left, right) {
  const leftDir = path.join(SHOTS, left);
  const rightDir = path.join(SHOTS, right);

  for (const dir of [leftDir, rightDir]) {
    try {
      await access(dir);
    } catch {
      console.error(`Нет снимков в ${path.relative(ROOT, dir)}`);
      process.exit(1);
    }
  }

  const leftFiles = new Set((await readdir(leftDir)).filter((f) => f.endsWith(".png")));
  const rightFiles = new Set((await readdir(rightDir)).filter((f) => f.endsWith(".png")));

  const changed = [];
  const same = [];
  const onlyLeft = [];
  const onlyRight = [];

  for (const file of leftFiles) {
    if (!rightFiles.has(file)) {
      onlyLeft.push(file);
      continue;
    }
    const [a, b] = await Promise.all([
      digest(path.join(leftDir, file)),
      digest(path.join(rightDir, file)),
    ]);
    (a === b ? same : changed).push(file);
  }

  for (const file of rightFiles) {
    if (!leftFiles.has(file)) onlyRight.push(file);
  }

  console.log(`Совпало:    ${same.length}`);
  console.log(`Отличается: ${changed.length}`);
  for (const file of changed) console.log(`  ≠ ${file}`);
  if (onlyLeft.length) console.log(`Пропало:    ${onlyLeft.join(", ")}`);
  if (onlyRight.length) console.log(`Появилось:  ${onlyRight.join(", ")}`);

  process.exit(changed.length + onlyLeft.length + onlyRight.length > 0 ? 1 : 0);
}

/* ------------------------------------------------------------------ */

const [command, ...rest] = process.argv.slice(2);

if (command === "diff") {
  const [left = "before", right = "after"] = rest;
  await diff(left, right);
} else {
  const label = command ?? "before";
  const restoreEnv = await enterDemoMode();
  let stopServer = null;

  try {
    stopServer = await startServer();
    await capture(label);
  } finally {
    if (stopServer) await stopServer();
    await restoreEnv();
  }
}
