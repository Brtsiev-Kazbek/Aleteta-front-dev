import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Склейка классов с разрешением конфликтов.
 *
 * ЗАЧЕМ НАСТРОЙКА. `tailwind-merge` разбирает имена классов по своему
 * встроенному словарю, и про нашу шкалу кеглей он не знает ничего. Увидев
 * `text-section`, он относит класс к группе цвета текста — просто потому, что
 * `text-*` чаще всего цвет, — и, встретив рядом `text-fg`, выбрасывает
 * предыдущий как конфликтующий.
 *
 * Итог: `cn("text-section", "text-fg")` возвращает один `text-fg`, заголовок
 * теряет кегль и набирается базовым. Ошибка тихая — ни сборка, ни линтер о ней
 * не скажут, — и заметить её можно только на снимке: раздел с заголовком в
 * пятьдесят точек и раздел с заголовком в шестнадцать стоят рядом.
 *
 * Так и случилось: после переезда на шкалу все заголовки, собранные через
 * `cn`, съехали в базовый кегль, а собранные строкой — уцелели. Отсюда правило:
 * каждое имя из шкалы и каждое имя цвета текста перечислены ниже явно.
 *
 * Список обязан совпадать с `fontSize` в `tailwind.config.ts` и с цветовыми
 * токенами в нём же. За расхождением следит страж в `scripts/guards.mjs`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "label",
            "caption",
            "body-sm",
            "body",
            "body-lg",
            "title-sm",
            "title",
            "heading",
            "display",
            "display-lg",
            "hero",
            "section",
            "lead",
          ],
        },
      ],
      "text-color": [
        {
          text: [
            "fg",
            "fg-muted",
            "fg-soft",
            "fg-subtle",
            "fg-faint",
            "fg-ghost",
            "inverse",
            "inverse-fg",
            "brand",
            "brand-strong",
            "brand-soft",
            "brand-line",
            "brand-fg",
            "ok",
            "ok-fg",
            "warn",
            "warn-fg",
            "danger",
            "danger-fg",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

const DATE_FORMATTER = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(iso: string): string {
  return DATE_FORMATTER.format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return DATE_TIME_FORMATTER.format(new Date(iso));
}

/** Склонение русских существительных: (1, "ошибка", "ошибки", "ошибок"). */
export function plural(
  count: number,
  one: string,
  few: string,
  many: string
): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}
