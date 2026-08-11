"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, AlertTriangle, Check, FileText, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

interface Doc {
  name: string;
  critical: number;
  warning: number;
}

const DOCS: Doc[] = [
  { name: "Договор_оказания_услуг_Вектор.pdf", critical: 1, warning: 2 },
  { name: "Договор_аренды_склад.docx", critical: 0, warning: 3 },
  { name: "Допсоглашение_№2_Альфа.pdf", critical: 1, warning: 1 },
  { name: "Договор_подряда_Ремстрой.pdf", critical: 0, warning: 1 },
];

/** 0 — очередь, 1..4 — документы проверены, 5 — сводка */
type Stage = 0 | 1 | 2 | 3 | 4 | 5;

export function BatchReviewDemo() {
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
        [1, 900],
        [2, 1700],
        [3, 2500],
        [4, 3300],
        [5, 4000],
      ];
      for (const [next, delay] of steps) {
        timers.current.push(window.setTimeout(() => setStage(next), delay));
      }
      timers.current.push(window.setTimeout(run, 8600));
    }

    run();
    return clear;
  }, [reduceMotion]);

  const checked = Math.min(stage, DOCS.length);
  const totalCritical = DOCS.slice(0, checked).reduce(
    (sum, doc) => sum + doc.critical,
    0
  );
  const totalWarning = DOCS.slice(0, checked).reduce(
    (sum, doc) => sum + doc.warning,
    0
  );

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-fg-faint">
          Проверка пачкой
        </span>
        <span className="font-mono text-[10px] tabular-nums text-fg-faint">
          {checked} / {DOCS.length}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {DOCS.map((doc, index) => {
          const isChecked = stage > index;
          const isChecking = stage === index;
          const hasCritical = doc.critical > 0;

          return (
            <motion.div
              key={doc.name}
              animate={{
                borderColor: isChecked
                  ? hasCritical
                    ? "rgb(254 202 202)"
                    : "rgb(231 229 228)"
                  : "rgb(231 229 228)",
              }}
              className="flex items-center gap-2.5 rounded border px-3 py-2.5"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                {isChecked ? (
                  hasCritical ? (
                    <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                  ) : (
                    <Check className="h-3.5 w-3.5 text-emerald-600" strokeWidth={3} />
                  )
                ) : isChecking ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-fg" />
                ) : (
                  <FileText className="h-3.5 w-3.5 text-fg-ghost" />
                )}
              </span>

              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-xs transition-colors",
                  isChecked ? "text-stone-800" : "text-fg-faint"
                )}
              >
                {doc.name}
              </span>

              <AnimatePresence>
                {isChecked && (
                  <motion.span
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex shrink-0 items-center gap-1.5"
                  >
                    {doc.critical > 0 && (
                      <span className="rounded border border-red-200 bg-red-50 px-1.5 py-0.5 font-mono text-[9px] text-red-700">
                        {doc.critical} крит.
                      </span>
                    )}
                    {doc.warning > 0 && (
                      <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 font-mono text-[9px] text-amber-700">
                        {doc.warning} предупр.
                      </span>
                    )}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {/* Сводка */}
        <AnimatePresence>
          {stage === 5 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-auto rounded border border-line bg-stone-50 p-3.5"
            >
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-2xl tabular-nums text-fg">
                  {totalCritical + totalWarning}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-fg-subtle">
                  замечаний в {DOCS.length} документах
                </span>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-2 py-1 font-mono text-[10px] text-red-700">
                  <AlertCircle className="h-3 w-3" />
                  {totalCritical} критических
                </span>
                <span className="inline-flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-2 py-1 font-mono text-[10px] text-amber-700">
                  <AlertTriangle className="h-3 w-3" />
                  {totalWarning} предупреждений
                </span>
              </div>

              <p className="mt-2.5 text-[11px] leading-relaxed text-fg-soft">
                Сначала открываются документы с критическими замечаниями —
                разбирать всю пачку подряд не нужно.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
