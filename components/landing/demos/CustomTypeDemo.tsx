"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

interface Preset {
  /** Название типа, которое «печатается» в поле. */
  name: string;
  fields: { label: string; required: boolean }[];
}

/** Типы из разных отраслей — продукт не привязан к недвижимости. */
const PRESETS: Preset[] = [
  {
    name: "Транспортное средство",
    fields: [
      { label: "Марка и модель", required: true },
      { label: "VIN", required: true },
      { label: "Госномер", required: true },
      { label: "Год выпуска", required: false },
    ],
  },
  {
    name: "Курсовая работа",
    fields: [
      { label: "Тема работы", required: true },
      { label: "Студент", required: true },
      { label: "Научный руководитель", required: true },
      { label: "Оценка", required: false },
    ],
  },
  {
    name: "Оборудование",
    fields: [
      { label: "Наименование", required: true },
      { label: "Инвентарный номер", required: true },
      { label: "Материально ответственный", required: true },
      { label: "Дата постановки на учёт", required: false },
    ],
  },
];

export function CustomTypeDemo() {
  const reduceMotion = useReducedMotion();
  const [presetIndex, setPresetIndex] = useState(0);
  const [typedName, setTypedName] = useState("");
  const [visibleFields, setVisibleFields] = useState(reduceMotion ? 4 : 0);
  const [isDone, setDone] = useState(reduceMotion);
  const timers = useRef<number[]>([]);

  const preset = PRESETS[presetIndex] ?? PRESETS[0];

  useEffect(() => {
    if (reduceMotion || !preset) return;

    function clear() {
      for (const id of timers.current) window.clearTimeout(id);
      timers.current = [];
    }

    function schedule(fn: () => void, delay: number) {
      timers.current.push(window.setTimeout(fn, delay));
    }

    clear();
    setTypedName("");
    setVisibleFields(0);
    setDone(false);

    const charDelay = 55;
    const nameEnd = 700 + preset.name.length * charDelay;

    for (let i = 1; i <= preset.name.length; i += 1) {
      schedule(() => setTypedName(preset.name.slice(0, i)), 700 + i * charDelay);
    }

    preset.fields.forEach((_, index) => {
      schedule(() => setVisibleFields(index + 1), nameEnd + 400 + index * 420);
    });

    const fieldsEnd = nameEnd + 400 + preset.fields.length * 420;
    schedule(() => setDone(true), fieldsEnd + 300);
    schedule(
      () => setPresetIndex((current) => (current + 1) % PRESETS.length),
      fieldsEnd + 2600
    );

    return clear;
  }, [presetIndex, reduceMotion, preset]);

  if (!preset) return null;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <span className="font-mono text-label uppercase text-fg-faint">
          Свой тип объекта
        </span>

        <div className="flex items-center gap-1">
          {PRESETS.map((item, index) => (
            <span
              key={item.name}
              className={cn(
                "h-1 rounded-full transition-all duration-500",
                index === presetIndex ? "w-4 bg-fg" : "w-1 bg-fg-ghost"
              )}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        {/* Название типа */}
        <span className="text-label text-fg-faint">Название типа</span>

        <div className="mt-1.5 flex h-10 items-center rounded-xl border border-line-strong px-3">
          <span className="text-body text-fg">{typedName}</span>
          {typedName.length < preset.name.length && (
            <motion.span
              aria-hidden
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.85, repeat: Infinity }}
              className="inline-block h-4 w-px bg-fg"
            />
          )}
        </div>

        {/* Реквизиты */}
        <div className="mt-5 flex items-center justify-between">
          <span className="text-label text-fg-faint">Реквизиты</span>
          <span className="font-mono text-label text-fg-ghost">
            {visibleFields} / {preset.fields.length}
          </span>
        </div>

        <div className="mt-2 flex flex-col gap-1.5">
          <AnimatePresence mode="popLayout">
            {preset.fields.slice(0, visibleFields).map((field) => (
              <motion.div
                key={`${preset.name}-${field.label}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-2.5 rounded-xl border border-line px-3 py-2.5"
              >
                <span className="min-w-0 flex-1 truncate text-caption text-fg">
                  {field.label}
                </span>

                <span
                  className={cn(
                    "shrink-0 rounded-full border px-1.5 py-0.5 font-mono text-label uppercase ",
                    field.required
                      ? "border-line-strong bg-surface-2 text-fg-soft"
                      : "border-line text-fg-ghost"
                  )}
                >
                  {field.required ? "обязательное" : "опционально"}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>

          {visibleFields < preset.fields.length && (
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-line px-3 py-2.5">
              <Plus className="h-3 w-3 text-fg-ghost" />
              <span className="text-caption text-fg-ghost">Добавить реквизит</span>
            </div>
          )}
        </div>

        {/* Итог */}
        <AnimatePresence>
          {isDone && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-auto flex items-start gap-2 border-t border-line pt-3"
            >
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok-fg" />
              <span className="text-label leading-relaxed text-fg-soft">
                Реквизиты стали колонками таблицы и проверяются перед генерацией
                наравне со встроенными
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
