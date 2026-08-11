"use client";

/*
 * ОТЦЕПЛЕНО ОТ ИНТЕРФЕЙСА.
 *
 * Разбор файла на реквизиты убран с экранов по решению владельца продукта:
 * обещание «реквизиты появятся сами» продукт пока не выполняет так, чтобы его
 * можно было давать вслух. Обработчик `extract`, серверное действие и слой
 * стора остались на месте и работают — снята только точка входа.
 *
 * Как вернуть: вернуть возможность «extract» в components/landing/features-data.tsx.
 *
 * Файл намеренно не удалён: восстановление должно стоить одну правку, а не
 * повторное написание экрана.
 */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, FileText, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface Source {
  file: string;
  size: string;
  target: string;
  fields: { label: string; value: string; mono: boolean }[];
}

/** Разные документы — чтобы было видно, что разбор не только про выписки. */
const SOURCES: Source[] = [
  {
    file: "Устав_Вектор-Строй.pdf",
    size: "860 КБ",
    target: "Карточка контрагента",
    fields: [
      { label: "ИНН", value: "1513000241", mono: true },
      { label: "КПП", value: "151301001", mono: true },
      { label: "Директор", value: "Сидоров П. А.", mono: false },
    ],
  },
  {
    file: "Паспорт_Кузнецова.jpg",
    size: "2.3 МБ",
    target: "Карточка сотрудника",
    fields: [
      { label: "ФИО", value: "Кузнецова А. В.", mono: false },
      { label: "Паспорт", value: "90 14 882301", mono: true },
      { label: "Адрес регистрации", value: "г. Москва, Тверская, 4", mono: false },
    ],
  },
  {
    file: "Выписка_ЕГРН_440квм.pdf",
    size: "1.2 МБ",
    target: "Карточка объекта",
    fields: [
      { label: "Кадастровый номер", value: "15:09:0000000:0000", mono: true },
      { label: "Площадь", value: "440 кв.м.", mono: false },
      { label: "Правообладатель", value: "Брциев К. Р.", mono: false },
    ],
  },
];

const STEPS = ["Распознавание текста", "Поиск реквизитов", "Сверка форматов"];

/** 0 файл, 1–3 шаги, 4–6 поля, 7 итог */
type Stage = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export function ExtractDemo() {
  const reduceMotion = useReducedMotion();
  const [sourceIndex, setSourceIndex] = useState(0);
  const [stage, setStage] = useState<Stage>(reduceMotion ? 7 : 0);
  const timers = useRef<number[]>([]);

  const source = SOURCES[sourceIndex] ?? SOURCES[0];

  useEffect(() => {
    if (reduceMotion) return;

    function clear() {
      for (const id of timers.current) window.clearTimeout(id);
      timers.current = [];
    }

    clear();
    setStage(0);

    const steps: [Stage, number][] = [
      [1, 600],
      [2, 1500],
      [3, 2300],
      [4, 3000],
      [5, 3400],
      [6, 3800],
      [7, 4400],
    ];

    for (const [next, delay] of steps) {
      timers.current.push(window.setTimeout(() => setStage(next), delay));
    }

    timers.current.push(
      window.setTimeout(
        () => setSourceIndex((current) => (current + 1) % SOURCES.length),
        7600
      )
    );

    return clear;
  }, [sourceIndex, reduceMotion]);

  if (!source) return null;

  return (
    <div className="grid h-full grid-cols-1 overflow-hidden rounded-lg border border-line bg-surface md:grid-cols-2">
      {/* Слева — исходный файл и обработка */}
      <div className="flex flex-col border-b border-line p-4 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between">
          <span className="font-mono text-label uppercase text-fg-faint">
            Исходный файл
          </span>

          <div className="flex items-center gap-1">
            {SOURCES.map((item, index) => (
              <span
                key={item.file}
                className={cn(
                  "h-1 rounded-full transition-all duration-500",
                  index === sourceIndex ? "w-4 bg-fg" : "w-1 bg-fg-ghost"
                )}
              />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={source.file}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.22 }}
            className="mt-3 flex items-center gap-2.5 rounded-xl border border-line px-3 py-2.5"
          >
            <FileText className="h-4 w-4 shrink-0 text-fg-faint" />
            <span className="min-w-0 flex-1 truncate text-caption text-fg-muted">
              {source.file}
            </span>
            <span className="shrink-0 font-mono text-label text-fg-faint">
              {source.size}
            </span>
          </motion.div>
        </AnimatePresence>

        <div className="mt-5 flex flex-col gap-2.5">
          {STEPS.map((step, index) => {
            const isDone = stage > index + 1;
            const isCurrent = stage === index + 1;

            return (
              <div key={step} className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors",
                    isDone
                      ? "bg-ok-bg text-ok-fg"
                      : isCurrent
                        ? "bg-fg text-inverse-fg"
                        : "bg-surface-2 text-fg-ghost"
                  )}
                >
                  {isDone ? (
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  ) : isCurrent ? (
                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  ) : (
                    <span className="h-1 w-1 rounded-full bg-current" />
                  )}
                </span>

                <span
                  className={cn(
                    "text-caption transition-colors",
                    isDone
                      ? "text-fg-faint"
                      : isCurrent
                        ? "font-medium text-fg"
                        : "text-fg-ghost"
                  )}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Справа — извлечённые реквизиты */}
      <div className="flex flex-col bg-bg/50 p-4">
        <AnimatePresence mode="wait">
          <motion.span
            key={source.target}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="font-mono text-label uppercase text-fg-faint"
          >
            → {source.target}
          </motion.span>
        </AnimatePresence>

        <div className="mt-3 flex flex-col gap-2">
          {source.fields.map((field, index) => {
            const isVisible = stage >= index + 4;

            if (!isVisible) {
              return (
                <motion.div
                  key={`skeleton-${field.label}`}
                  animate={{ opacity: [0.4, 0.7, 0.4] }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    delay: index * 0.15,
                  }}
                  className="h-[42px] rounded-xl border border-line bg-surface"
                />
              );
            }

            return (
              <motion.div
                key={field.label}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.28 }}
                className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-3 py-2.5"
              >
                <span className="shrink-0 text-label text-fg-faint">
                  {field.label}
                </span>
                <span
                  className={cn(
                    "min-w-0 truncate text-caption text-fg",
                    field.mono && "font-mono text-label"
                  )}
                >
                  {field.value}
                </span>
              </motion.div>
            );
          })}
        </div>

        <AnimatePresence>
          {stage === 7 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-auto flex items-center gap-2 border-t border-line pt-3"
            >
              <Check className="h-3.5 w-3.5 shrink-0 text-ok-fg" />
              <span className="text-label text-fg-soft">
                Реквизиты извлечены, форматы проверены
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
