import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Сборка документов в модуль TypeScript.
 *
 * Читать markdown с диска во время запроса нельзя: на Netlify приложение
 * работает в бессерверной функции, и файлов репозитория рядом с ней нет.
 * Поэтому содержимое вшивается в бандл на этапе сборки — страница получает
 * готовую строку и ни к какой файловой системе не обращается.
 *
 * Запускается автоматически перед `npm run build` и `npm run dev`.
 */

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Что показываем контрибьюторам и в каком порядке. Порядок значим: это
 * маршрут для человека, открывшего проект впервые, а не алфавит.
 */
const PAGES = [
  {
    slug: "",
    file: "README.md",
    title: "Обзор",
    summary: "Что за проект, какой документ читать и в каком порядке",
  },
  {
    slug: "start-ocr",
    file: "START-OCR.md",
    title: "Запустить распознавание",
    summary: "Пять шагов от ключа модели до текста на экране, с проверками",
  },
  {
    slug: "development",
    file: "DEVELOPMENT.md",
    title: "Руководство разработчика",
    summary: "Запуск, устройство, правила письма, частые задачи",
  },
  {
    slug: "data-model",
    file: "DATA-MODEL.md",
    title: "Модель данных",
    summary: "Таблицы, связи, права доступа и инварианты базы",
  },
  {
    slug: "ai-backend",
    file: "AI-BACKEND.md",
    title: "Работа с моделью",
    summary: "Очередь заданий, устройство кода, план по этапам",
  },
  {
    slug: "supabase",
    file: "SUPABASE.md",
    title: "База с нуля",
    summary: "Поднять проект Supabase и применить схему",
  },
  {
    slug: "backend",
    file: "BACKEND.md",
    title: "Решения бэкенда",
    summary: "Почему выбрано именно это, а не очевидная альтернатива",
  },
];

const entries = PAGES.map((page) => {
  const content = readFileSync(join(root, "docs", page.file), "utf8");
  return { ...page, content };
});

const output = `// Файл собран автоматически: scripts/build-docs.mjs.
// Правьте markdown в docs/, а не этот файл — он перезаписывается сборкой.

export interface DocPage {
  /** Часть адреса: /docs/<slug>. Пустая строка — корень раздела. */
  slug: string;
  /** Имя исходного файла в docs/ — по нему строится ссылка на GitHub. */
  file: string;
  title: string;
  summary: string;
  content: string;
}

export const DOC_PAGES: DocPage[] = ${JSON.stringify(entries, null, 2)};

export function findDoc(slug: string): DocPage | undefined {
  return DOC_PAGES.find((page) => page.slug === slug);
}
`;

mkdirSync(join(root, "lib", "docs"), { recursive: true });
writeFileSync(join(root, "lib", "docs", "content.generated.ts"), output, "utf8");

console.log(`Документы собраны: ${entries.length} страниц`);
