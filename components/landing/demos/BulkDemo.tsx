"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, CheckCircle2, FileText, FolderKanban, Sparkles } from "lucide-react";

const CASES = [
  { id: "c1", title: "Межевание участка 440 кв.м.", status: "В работе" },
  { id: "c2", title: "Комфортная городская среда", status: "Сбор данных" },
  { id: "c3", title: "Проверка курсовых работ", status: "Активно" },
];

/** 0 — пусто, 1..3 — отмечено дел, 4 — генерация, 5 — готово */
type Stage = 0 | 1 | 2 | 3 | 4 | 5;

export function BulkDemo() {
  const reduceMotion = useReducedMotion();
  const [stage, setStage] = useState<Stage>(reduceMotion ? 5 : 0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (reduceMotion) return;

    function clear() {
      for (const id of timers.current) window.clearTimeout(id);
      timers.current = [];
    }

    function run() {
      clear();
      setStage(0);

      const steps: [Stage, number][] = [
        [1, 800],
        [2, 1400],
        [3, 2000],
        [4, 2900],
        [5, 4600],
      ];

      for (const [next, delay] of steps) {
        timers.current.push(window.setTimeout(() => setStage(next), delay));
      }
      timers.current.push(window.setTimeout(run, 8800));
    }

    run();
    return clear;
  }, [reduceMotion]);

  const selectedCount = Math.min(stage, 3);

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface">
      <div className="border-b border-line px-4 py-3">
        <span className="text-body font-semibold text-fg">Все дела</span>
        <span className="ml-2 text-caption text-fg-faint">
          выделите галочками нужные
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        {CASES.map((item, index) => {
          const isChecked = index < selectedCount;

          return (
            <motion.div
              key={item.id}
              animate={{
                borderColor: isChecked ? "rgb(165 180 252)" : "rgb(228 228 231)",
                backgroundColor: isChecked
                  ? "rgb(238 242 255)"
                  : "rgb(255 255 255)",
              }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-2.5 rounded-lg border px-3 py-2.5"
            >
              <motion.span
                animate={{
                  backgroundColor: isChecked
                    ? "rgb(79 70 229)"
                    : "rgba(255,255,255,0)",
                  borderColor: isChecked
                    ? "rgb(79 70 229)"
                    : "rgb(212 212 216)",
                }}
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded border"
              >
                {isChecked && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  >
                    <Check className="h-3 w-3 text-inverse-fg" strokeWidth={3} />
                  </motion.span>
                )}
              </motion.span>

              <FolderKanban className="h-3.5 w-3.5 shrink-0 text-fg-faint" />

              <span className="min-w-0 flex-1 truncate text-caption text-fg">
                {item.title}
              </span>

              <span className="shrink-0 rounded border border-line bg-surface px-1.5 py-0.5 text-label text-fg-subtle">
                {item.status}
              </span>

              {/* Появившийся документ */}
              <AnimatePresence>
                {stage === 5 && (
                  <motion.span
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.12 }}
                    className="flex shrink-0 items-center gap-1 rounded border border-ok-line bg-ok-bg px-1.5 py-0.5 text-label font-medium text-ok-fg"
                  >
                    <FileText className="h-2.5 w-2.5" />
                    +1
                    <CheckCircle2 className="h-2.5 w-2.5" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Плавающая панель */}
      <AnimatePresence>
        {selectedCount > 0 && stage < 5 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="absolute bottom-3 left-1/2 -translate-x-1/2"
          >
            <div className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3 py-2 shadow-xl">
              <span className="whitespace-nowrap text-caption">
                <span className="font-semibold text-fg">
                  {selectedCount}
                </span>
                <span className="text-fg-subtle"> дела выбрано</span>
              </span>

              <span className="h-4 w-px bg-surface-3" />

              <span
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-label font-medium text-inverse-fg transition-colors ${
                  stage === 4 ? "bg-brand-strong" : "bg-brand"
                }`}
              >
                <Sparkles className="h-3 w-3" />
                {stage === 4 ? "Создаём…" : "Создать документ"}
              </span>
            </div>
          </motion.div>
        )}

        {stage === 5 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-3 left-1/2 -translate-x-1/2"
          >
            <div className="flex items-center gap-2 rounded-xl border border-ok-line bg-ok-bg px-3 py-2 shadow-lg">
              <CheckCircle2 className="h-3.5 w-3.5 text-ok-fg" />
              <span className="whitespace-nowrap text-caption font-medium text-ok-fg">
                Документ создан в 3 делах
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
