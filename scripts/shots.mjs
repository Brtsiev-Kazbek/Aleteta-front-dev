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

/**
 * Экраны, которые не совпадают побайтово даже сами с собой.
 *
 * На лендинге есть движение, привязанное не ко времени, а к прокрутке: превью
 * продукта выпрямляется по мере подхода к нему. Съёмка прокручивает страницу
 * насквозь, и кадр каждый раз ловится чуть-чуть другой. Величина расхождения —
 * тысячные доли процента сжатого объёма при точно совпадающих размерах, то есть
 * несколько пикселей на двух мегабайтах.
 *
 * Прятать источник целиком не стали: это главный элемент первого экрана, и
 * снимок без него перестал бы что-либо проверять. Поэтому расхождение здесь
 * помечается как известное, а не выдаётся за поломку. Если разойдётся размер
 * или доля вырастет до заметной — это уже настоящая правка, и её видно.
 */
const NOISY = new Set(["landing"]);

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

  /*
   * `detached` и `stdio: "ignore"` — оба обязательны, и оба выучены на своей
   * шкуре.
   *
   * Без `ignore` каналы вывода остаются открытыми, узел считает, что работа не
   * кончена, и процесс висит после съёмки. Один такой висел достаточно долго,
   * чтобы следующий прогон занял тот же порт и снял старую сборку вместо новой:
   * снимки разошлись, и полдня ушло на поиск правки, которой не было.
   *
   * Без `detached` сигнал уходит обёртке `npx`, а сервер под ней продолжает
   * слушать порт. Отдельная группа процессов позволяет погасить всё разом.
   */
  const server = spawn("npx", ["next", "start", "--port", String(PORT)], {
    cwd: ROOT,
    stdio: "ignore",
    detached: true,
  });

  // Ждём, пока порт начнёт отвечать: `next start` печатает готовность не сразу.
  const stop = async () => {
    try {
      // Минус перед номером — вся группа процессов, а не одна обёртка.
      process.kill(-server.pid, "SIGTERM");
    } catch {
      /* Уже погас. */
    }
    await new Promise((r) => setTimeout(r, 400));
  };

  const deadline = Date.now() + 90_000;
  for (;;) {
    if (Date.now() > deadline) {
      await stop();
      throw new Error(
        `сервер не поднялся за полторы минуты — возможно, порт ${PORT} занят ` +
          "другим прогоном (SHOTS_PORT задаёт другой)"
      );
    }
    try {
      const response = await fetch(BASE, { signal: AbortSignal.timeout(1_000) });
      if (response.status < 500) break;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  return stop;
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
 *
 * Именно `animation: none`, а не нулевая длительность. Нулевая длительность не
 * отменяет анимацию, а мгновенно доигрывает её до конца — и бегущая строка
 * замирает сдвинутой, причём каждый раз чуть иначе. Два прогона одного и того
 * же кода расходились на полсотни байт ровно из-за этого. Полное выключение
 * оставляет элемент там, где его положила вёрстка.
 */
const FREEZE_CSS = `
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
    caret-color: transparent !important;
  }
  html { scroll-behavior: auto !important; }

  /*
   * Движущиеся украшения прячем совсем. Выключенная анимация оставляет их на
   * месте, но луч по сетке и зерно рисуются с точностью до кадра, и два прогона
   * подряд расходились на полсотни байт из двух мегабайт. Сравнивать смысла
   * нет: ни одно из них не несёт содержания, а шум мешает увидеть настоящее
   * расхождение. Прячем видимость, а не убираем из потока: иначе поедет
   * вёрстка, и снимок перестанет отражать настоящую страницу.
   */
  .animate-marquee, .animate-marquee-reverse,
  .animate-sweep, .aurora-drift, .aurora-drift-slow {
    visibility: hidden !important;
  }
  .grain::after { display: none !important; }
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
 * должен, PNG обязан совпасть побайтово. Отличается хоть байт — миграция
 * что-то задела, и надо смотреть глазами. Порога «допустимого расхождения» тут
 * нет намеренно: он ровно для того и заводится, чтобы не замечать мелочей, а
 * мелочи — это всё, что мы ищем.
 *
 * Вместо порога — разбор: разошёлся ли размер картинки (поехала вёрстка) или
 * только её содержимое (цвет либо кадр анимации). Решение остаётся за
 * человеком, но он получает подсказку, куда смотреть.
 */

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
  const noisy = [];
  const onlyLeft = [];
  const onlyRight = [];

  /** Размеры картинки из заголовка PNG — они лежат в IHDR по смещению 16. */
  function size(buffer) {
    return `${buffer.readUInt32BE(16)}×${buffer.readUInt32BE(20)}`;
  }

  for (const file of leftFiles) {
    if (!rightFiles.has(file)) {
      onlyLeft.push(file);
      continue;
    }

    const [a, b] = await Promise.all([
      readFile(path.join(leftDir, file)),
      readFile(path.join(rightDir, file)),
    ]);

    if (a.equals(b)) {
      same.push(file);
      continue;
    }

    const route = file.split("@")[0];
    const moved = size(a) !== size(b);
    const drift = Math.abs(a.length - b.length) / a.length;

    /*
     * Известный шум: тот же экран, тот же размер, расхождение в тысячных долях
     * процента. Считать это поломкой — значит приучить себя не смотреть на
     * красный, а это дороже, чем не заметить настоящее расхождение.
     */
    if (NOISY.has(route) && !moved && drift < 0.0005) {
      noisy.push(file);
      continue;
    }

    changed.push({
      file,
      shape: moved ? `${size(a)} → ${size(b)}` : size(a),
      moved,
      /*
       * Насколько разошёлся сжатый объём. Число грубое и ничего не доказывает
       * само по себе, но помогает отличить «поехала вёрстка» от «замер другой
       * кадр»: первое даёт проценты, второе — тысячные доли.
       */
      drift: `${((Math.abs(a.length - b.length) / a.length) * 100).toFixed(3)}%`,
    });
  }

  for (const file of rightFiles) {
    if (!leftFiles.has(file)) onlyRight.push(file);
  }

  console.log(`Совпало побайтово: ${same.length} из ${leftFiles.size}`);

  if (noisy.length) {
    console.log(
      `Известный шум:     ${noisy.length} (${[...new Set(noisy.map((f) => f.split("@")[0]))].join(", ")})`
    );
  }

  if (changed.length) {
    console.log(`Отличается:        ${changed.length}`);
    for (const item of changed) {
      const mark = item.moved ? "РАЗМЕР" : "краска";
      console.log(`  ≠ ${item.file.padEnd(26)} ${mark}  ${item.shape}  ~${item.drift}`);
    }
    console.log(
      "\nРазошедшийся размер — поехала вёрстка. Разошлась только краска —\n" +
        "смотреть глазами: это либо цвет, либо кадр анимации."
    );
  }

  if (onlyLeft.length) console.log(`Пропало:   ${onlyLeft.join(", ")}`);
  if (onlyRight.length) console.log(`Появилось: ${onlyRight.join(", ")}`);

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

  /*
   * Выходим явно. Иначе достаточно одного забытого открытого канала, чтобы
   * процесс остался жить, занять порт и подсунуть следующему прогону старую
   * сборку — ровно это однажды и случилось.
   */
  process.exit(0);
}
