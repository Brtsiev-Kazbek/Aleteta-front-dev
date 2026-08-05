"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, CheckCircle2, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

/** Значение, которое «допечатывается» в пустую ячейку. */
const FILL_VALUE = "Для ИЖС";

type Phase = "empty" | "typing" | "valid" | "ready";

const COLUMNS = [
  "Название",
  "Кадастровый номер",
  "Площадь",
  "Назначение земель",
];

const ROW_ONE = [
  "Земельный участок №12",
  "15:09:0000000:0000",
  "440 кв.м.",
  "Для ИЖС",
];

/**
 * Демонстрация ядра продукта: пустое обязательное поле подсвечено красным,
 * заполняется, счётчик валидных строк растёт, кнопка генерации разблокируется.
 * Цикл повторяется.
 */
export function ProductPreview() {
  const reduceMotion = useReducedMotion();

  const [phase, setPhase] = useState<Phase>(reduceMotion ? "ready" : "empty");
  const [typed, setTyped] = useState(reduceMotion ? FILL_VALUE : "");
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (reduceMotion) return;

    function clearTimers() {
      for (const id of timers.current) window.clearTimeout(id);
      timers.current = [];
    }

    function schedule(fn: () => void, delay: number) {
      const id = window.setTimeout(fn, delay);
      timers.current.push(id);
    }

    function runCycle() {
      // Цикл перезапускает сам себя, поэтому список таймеров нужно сбрасывать —
      // иначе он растёт бесконечно, пока страница открыта.
      clearTimers();
      setPhase("empty");
      setTyped("");

      schedule(() => {
        setPhase("typing");

        // Посимвольная печать значения в ячейку.
        for (let i = 1; i <= FILL_VALUE.length; i += 1) {
          schedule(() => setTyped(FILL_VALUE.slice(0, i)), i * 75);
        }

        schedule(() => setPhase("valid"), FILL_VALUE.length * 75 + 350);
        schedule(() => setPhase("ready"), FILL_VALUE.length * 75 + 1150);
        schedule(runCycle, FILL_VALUE.length * 75 + 4200);
      }, 1700);
    }

    runCycle();
    return clearTimers;
  }, [reduceMotion]);

  const isFilled = phase === "valid" || phase === "ready";
  const isReady = phase === "ready";

  return (
    <div className="relative">
      {/* Мягкое свечение под карточкой */}
      <div
        aria-hidden
        className="absolute -inset-x-8 -bottom-6 top-8 rounded-[2rem] bg-indigo-500/10 blur-3xl"
      />

      <div className="relative overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-2xl shadow-zinc-300/40">
        {/* Панель окна */}
        <div className="flex items-center gap-2 border-b border-zinc-200 bg-zinc-50/70 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-300" />
          <span className="ml-2 truncate text-xs text-zinc-400">
            Дело №104 — Сущности и Генерация
          </span>

          <AnimatePresence>
            {isReady && (
              <motion.span
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                className="ml-auto hidden items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 sm:flex"
              >
                <CheckCircle2 className="h-3 w-3" />
                Проверено
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Таблица */}
        <div className="overflow-x-auto p-4 sm:p-5">
          <table className="w-full min-w-[560px] border-separate border-spacing-0 text-left">
            <thead>
              <tr>
                {COLUMNS.map((column) => (
                  <th
                    key={column}
                    className="whitespace-nowrap border-b border-zinc-200 pb-2.5 text-[11px] font-medium text-zinc-400"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              <tr>
                {ROW_ONE.map((cell, index) => (
                  <td
                    key={index}
                    className="whitespace-nowrap border-b border-zinc-100 py-3 pr-4 text-sm text-zinc-700"
                  >
                    {cell}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="whitespace-nowrap py-3 pr-4 text-sm text-zinc-700">
                  Земельный участок №14
                </td>
                <td className="whitespace-nowrap py-3 pr-4 text-sm text-zinc-700">
                  15:09:0000000:0001
                </td>
                <td className="whitespace-nowrap py-3 pr-4 text-sm text-zinc-700">
                  612 кв.м.
                </td>
                <td className="py-2 pr-4">
                  <motion.div
                    animate={{
                      backgroundColor: isFilled
                        ? "rgba(240,253,244,0)"
                        : "rgb(254 242 242)",
                      borderColor: isFilled
                        ? "rgba(228,228,231,0)"
                        : "rgb(254 202 202)",
                    }}
                    transition={{ duration: 0.4 }}
                    className="flex h-9 items-center gap-1.5 rounded-md border px-2.5"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {isFilled ? (
                        <motion.span
                          key="ok"
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 420,
                            damping: 18,
                          }}
                          className="shrink-0"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        </motion.span>
                      ) : (
                        <motion.span
                          key="err"
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.5, opacity: 0 }}
                          className="shrink-0"
                        >
                          <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                        </motion.span>
                      )}
                    </AnimatePresence>

                    <span
                      className={cn(
                        "text-sm transition-colors duration-300",
                        isFilled
                          ? "text-zinc-700"
                          : typed
                            ? "text-zinc-900"
                            : "text-red-800"
                      )}
                    >
                      {typed || (phase === "empty" ? "Не заполнено" : "")}
                    </span>

                    {phase === "typing" && (
                      <motion.span
                        aria-hidden
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: 0.9, repeat: Infinity }}
                        className="inline-block h-4 w-[2px] bg-indigo-600"
                      />
                    )}
                  </motion.div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Липкая панель генерации */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 bg-zinc-50/60 px-4 py-3.5 sm:px-5">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-zinc-500">Готово к генерации:</span>

            <span className="relative inline-flex h-5 w-9 items-center overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={isFilled ? "2" : "1"}
                  initial={{ y: 14, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -14, opacity: 0 }}
                  transition={{ duration: 0.28 }}
                  className={cn(
                    "absolute font-semibold tabular-nums",
                    isFilled ? "text-emerald-600" : "text-zinc-900"
                  )}
                >
                  {isFilled ? "2 / 2" : "1 / 2"}
                </motion.span>
              </AnimatePresence>
            </span>
          </div>

          <motion.div
            animate={
              isReady
                ? { backgroundColor: "rgb(79 70 229)", color: "rgb(255 255 255)" }
                : { backgroundColor: "rgb(228 228 231)", color: "rgb(161 161 170)" }
            }
            transition={{ duration: 0.35 }}
            className="relative flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium"
          >
            <Sparkles className="h-4 w-4" />
            Сгенерировать пакет
            {isReady && !reduceMotion && (
              <motion.span
                aria-hidden
                initial={{ opacity: 0.5, scale: 1 }}
                animate={{ opacity: 0, scale: 1.25 }}
                transition={{ duration: 1.1, repeat: Infinity }}
                className="absolute inset-0 rounded-lg bg-indigo-500"
              />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
