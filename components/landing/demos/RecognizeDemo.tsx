"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FileText, Search } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Распознавание: страница слева, её текст справа.
 *
 * Показываем ровно то, что продукт делает по-настоящему и уже сегодня: файл
 * читается постранично, текст ложится рядом с оригиналом, по нему работает
 * поиск с переходом к месту.
 *
 * ДВЕ ПАНЕЛИ, А НЕ ОДНА. Одна панель с текстом ничего не доказывает — текст мог
 * быть набран руками. Лист рядом с его же расшифровкой показывает связь, ради
 * которой распознавание и нужно.
 */

const PAGES = [
  {
    number: 7,
    lines: [
      "Раздел 1. Сведения о характеристиках объекта",
      "недвижимости.",
      "",
      "Вид объекта недвижимости: земельный участок.",
      "Кадастровый номер: 15:09:0301012:118.",
      "Площадь: 440 +/- 7 кв.м.",
      "Категория земель: земли населённых пунктов.",
      "Виды разрешённого использования: для",
      "индивидуального жилищного строительства.",
    ],
  },
];

/** Что подсвечено в тексте — совпадения запроса. */
const QUERY = "кадастровый";

export function RecognizeDemo() {
  const reduceMotion = useReducedMotion();
  const [visible, setVisible] = useState(reduceMotion ? 999 : 0);
  const timers = useRef<number[]>([]);

  /*
   * Строки проявляются по одной. Это единственная анимация здесь, и она не
   * украшение: распознавание идёт волнами, и показать надо именно это —
   * страница не «моргает готовой», а наполняется.
   */
  useEffect(() => {
    if (reduceMotion) return;

    const total = PAGES[0]?.lines.length ?? 0;
    for (let index = 0; index <= total; index += 1) {
      timers.current.push(
        window.setTimeout(() => setVisible(index), 260 + index * 130)
      );
    }

    return () => {
      for (const id of timers.current) window.clearTimeout(id);
      timers.current = [];
    };
  }, [reduceMotion]);

  const page = PAGES[0];
  if (!page) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      {/* Строка поиска — то, ради чего текст и нужен */}
      <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
        <Search className="h-3.5 w-3.5 shrink-0 text-fg-ghost" />
        <span className="min-w-0 flex-1 truncate text-body-sm text-fg">
          {QUERY}
        </span>
        <span className="shrink-0 font-mono text-label uppercase text-fg-faint">
          1 из 3
        </span>
      </div>

      <div className="grid grid-cols-1 divide-y divide-line sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        {/* Оригинал */}
        <div className="bg-bg p-4">
          <div className="flex items-center gap-2 pb-3">
            <FileText className="h-3.5 w-3.5 shrink-0 text-fg-ghost" />
            <span className="font-mono text-label uppercase text-fg-faint">
              Выписка_ЕГРН.pdf · стр. {page.number}
            </span>
          </div>

          {/* Лист: содержимое намеренно нечитаемо — важна форма страницы */}
          <div className="aspect-[3/4] rounded-lg border border-line bg-surface p-3.5">
            <div className="flex h-full flex-col gap-1.5">
              {Array.from({ length: 14 }).map((_, index) => (
                <span
                  key={index}
                  className={cn(
                    "h-1 rounded-full bg-surface-3",
                    index === 4 && "w-[62%] bg-brand-line",
                    index === 0 && "w-[80%]",
                    index === 3 && "w-[45%]",
                    index === 7 && "w-[70%]",
                    index === 11 && "w-[55%]"
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Расшифровка */}
        <div className="p-4">
          <div className="flex items-center justify-between pb-3">
            <span className="font-mono text-label uppercase text-fg-faint">
              Распознанный текст
            </span>
            <span className="font-mono text-label uppercase text-ok">
              Готово
            </span>
          </div>

          <div className="flex flex-col gap-1">
            {page.lines.map((line, index) => {
              if (!line) return <span key={index} className="h-2" />;

              const shown = reduceMotion || index < visible;

              return (
                <motion.span
                  key={line}
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: shown ? 1 : 0 }}
                  transition={{ duration: 0.25 }}
                  className="text-body-sm leading-relaxed text-fg-muted"
                >
                  {highlight(line)}
                </motion.span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Подсветка совпадения — тем же приёмом, что и в рабочем экране поиска. */
function highlight(line: string) {
  const at = line.toLowerCase().indexOf(QUERY);
  if (at < 0) return line;

  return (
    <>
      {line.slice(0, at)}
      <mark className="rounded bg-brand-soft px-0.5 text-brand-strong">
        {line.slice(at, at + QUERY.length)}
      </mark>
      {line.slice(at + QUERY.length)}
    </>
  );
}
