"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, AlertTriangle, Sparkles } from "lucide-react";

/** Шаги сценария: что уже показано на экране. */
type Stage = 0 | 1 | 2 | 3 | 4 | 5;

const RISKS = [
  {
    id: "r1",
    level: "critical" as const,
    clause: "п. 5.3",
    title: "Односторонний отказ заказчика без компенсации",
    text: "Заказчик вправе расторгнуть договор в любой момент, оплата фактически выполненных работ не предусмотрена.",
  },
  {
    id: "r2",
    level: "warning" as const,
    clause: "п. 2.4",
    title: "Не определён порядок приёмки",
    text: "Срок подписания акта не установлен — работы можно не принимать неограниченно долго.",
  },
];

export function ChatDemo() {
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
        [1, 900], // сообщение пользователя
        [2, 1500], // «печатает»
        [3, 3000], // ответ ассистента
        [4, 3600], // первая карточка риска
        [5, 4200], // вторая карточка риска
      ];

      for (const [next, delay] of steps) {
        timers.current.push(window.setTimeout(() => setStage(next), delay));
      }
      timers.current.push(window.setTimeout(run, 8500));
    }

    run();
    return clear;
  }, [reduceMotion]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface">
      {/* Шапка шторки */}
      <div className="flex items-center gap-2.5 border-b border-line px-4 py-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-violet-500">
          <Sparkles className="h-3.5 w-3.5 text-inverse-fg" />
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-sm font-semibold text-fg">Алетейя AI</span>
          <span className="mt-0.5 font-mono text-[10px] text-fg-faint">
            Договор_оказания_услуг_Вектор.pdf
          </span>
        </div>
      </div>

      {/* Лента сообщений */}
      <div className="flex flex-1 flex-col justify-end gap-2.5 overflow-hidden p-4">
        <AnimatePresence>
          {stage >= 1 && (
            <motion.div
              key="user"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-end"
            >
              <span className="rounded-2xl rounded-tr-sm bg-violet-600 px-3.5 py-2 text-sm text-inverse-fg">
                Проверить риски
              </span>
            </motion.div>
          )}

          {stage === 2 && (
            <motion.div
              key="typing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1 self-start rounded-2xl rounded-tl-sm bg-surface-2 px-4 py-3"
            >
              {[0, 1, 2].map((dot) => (
                <motion.span
                  key={dot}
                  className="h-1.5 w-1.5 rounded-full bg-fg-faint"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: dot * 0.18 }}
                />
              ))}
            </motion.div>
          )}

          {stage >= 3 && (
            <motion.div
              key="answer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-[85%] self-start rounded-2xl rounded-tl-sm bg-surface-2 px-3.5 py-2 text-sm text-fg"
            >
              Разобрал договор по пунктам. Нашёл 2 проблемы:
            </motion.div>
          )}

          {RISKS.map((risk, index) => {
            const visibleAt = index === 0 ? 4 : 5;
            if (stage < visibleAt) return null;

            const isCritical = risk.level === "critical";

            return (
              <motion.div
                key={risk.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`rounded-xl border p-3 ${
                  isCritical
                    ? "border-red-200 bg-red-50/70"
                    : "border-amber-200 bg-amber-50/70"
                }`}
              >
                <div className="flex items-start gap-2">
                  {isCritical ? (
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                  )}

                  <div className="flex min-w-0 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded border px-1.5 py-0.5 text-[9px] font-medium uppercase ${
                          isCritical
                            ? "border-red-200 bg-red-100 text-red-700"
                            : "border-amber-200 bg-amber-100 text-amber-700"
                        }`}
                      >
                        {isCritical ? "Критический риск" : "Предупреждение"}
                      </span>
                      <span className="text-[10px] text-fg-subtle">
                        {risk.clause}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-fg">
                      {risk.title}
                    </p>
                    <p className="text-[11px] leading-relaxed text-fg-soft">
                      {risk.text}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Поле ввода */}
      <div className="border-t border-line p-3">
        <div className="flex items-center gap-2 rounded-lg border border-line px-3 py-2">
          <span className="flex-1 text-xs text-fg-ghost">
            Спросите Алетейю о деле…
          </span>
          <span className="flex h-6 w-6 items-center justify-center rounded bg-violet-600 text-[10px] text-inverse-fg">
            ↑
          </span>
        </div>
      </div>
    </div>
  );
}
