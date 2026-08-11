"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AlertCircle, AlertTriangle, FileText } from "lucide-react";

const PARAGRAPHS = [
  {
    id: "p1",
    clause: "2.4",
    text: "Заказчик принимает выполненные работы путём подписания акта. Срок рассмотрения акта Заказчиком настоящим Договором не устанавливается.",
  },
  {
    id: "p2",
    clause: "4.1",
    text: "Стоимость услуг составляет 180 000 рублей и оплачивается в течение 15 банковских дней с момента подписания акта.",
  },
  {
    id: "p3",
    clause: "5.3",
    text: "Заказчик вправе в одностороннем порядке отказаться от исполнения Договора, письменно уведомив Исполнителя за 5 календарных дней.",
  },
];

const RISKS = [
  {
    id: "k1",
    level: "critical" as const,
    paragraphId: "p3",
    clause: "5.3",
    title: "Отказ заказчика без оплаты выполненного",
    text: "Добавьте обязанность оплатить фактически оказанные услуги на дату отказа.",
  },
  {
    id: "k2",
    level: "warning" as const,
    paragraphId: "p1",
    clause: "2.4",
    title: "Не установлен срок приёмки работ",
    text: "Укажите: акт считается принятым, если возражения не заявлены в течение 5 рабочих дней.",
  },
];

export function ReviewDemo() {
  const reduceMotion = useReducedMotion();
  const [activeRisk, setActiveRisk] = useState<string | null>(
    reduceMotion ? "k1" : null
  );
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (reduceMotion) return;

    function clear() {
      for (const id of timers.current) window.clearTimeout(id);
      timers.current = [];
    }

    function run() {
      clear();
      setActiveRisk(null);
      timers.current.push(window.setTimeout(() => setActiveRisk("k1"), 1200));
      timers.current.push(window.setTimeout(() => setActiveRisk("k2"), 4000));
      timers.current.push(window.setTimeout(run, 7200));
    }

    run();
    return clear;
  }, [reduceMotion]);

  const highlightedParagraph = RISKS.find((r) => r.id === activeRisk)?.paragraphId;

  return (
    <div className="grid h-full grid-cols-1 overflow-hidden rounded-xl border border-line bg-surface md:grid-cols-2">
      {/* Левая панель — оригинал */}
      <div className="flex flex-col border-b border-line md:border-b-0 md:border-r">
        <div className="flex items-center gap-2 border-b border-line bg-bg/70 px-3 py-2">
          <FileText className="h-3.5 w-3.5 text-fg-faint" />
          <span className="font-mono text-label uppercase text-fg-subtle">
            Договор оказания услуг
          </span>
        </div>

        <div className="flex flex-col gap-2 p-3">
          {PARAGRAPHS.map((paragraph) => {
            const isActive = highlightedParagraph === paragraph.id;
            const level = RISKS.find(
              (r) => r.paragraphId === paragraph.id && r.id === activeRisk
            )?.level;

            return (
              <motion.div
                key={paragraph.id}
                animate={{
                  backgroundColor: isActive
                    ? level === "critical"
                      ? "rgb(254 242 242)"
                      : "rgb(255 251 235)"
                    : "rgba(255,255,255,0)",
                }}
                transition={{ duration: 0.3 }}
                className={`rounded-lg border px-2.5 py-2 transition-colors ${
                  isActive
                    ? level === "critical"
                      ? "border-danger-line"
                      : "border-warn-line"
                    : "border-transparent"
                }`}
              >
                <div className="flex gap-2">
                  <span
                    className={`shrink-0 text-label font-medium tabular-nums ${
                      isActive ? "text-fg" : "text-fg-faint"
                    }`}
                  >
                    {paragraph.clause}
                  </span>
                  <p className="text-label leading-relaxed text-fg-soft">
                    {paragraph.text}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Правая панель — анализ */}
      <div className="flex flex-col bg-bg/40">
        <div className="flex items-center gap-2 border-b border-line bg-bg/70 px-3 py-2">
          <span className="text-label font-medium uppercase text-fg-subtle">
            Анализ Алетейи
          </span>
          <span className="ml-auto text-label text-fg-faint">
            клик → подсветка абзаца
          </span>
        </div>

        <div className="flex flex-col gap-2 p-3">
          {RISKS.map((risk) => {
            const isActive = activeRisk === risk.id;
            const isCritical = risk.level === "critical";

            return (
              <motion.div
                key={risk.id}
                animate={{ scale: isActive ? 1 : 0.985 }}
                transition={{ duration: 0.25 }}
                className={`rounded-xl border p-2.5 ${
                  isCritical
                    ? "border-danger-line bg-danger-bg/70"
                    : "border-warn-line bg-warn-bg/70"
                } ${isActive ? "ring-2 ring-line-strong" : ""}`}
              >
                <div className="flex items-start gap-2">
                  {isCritical ? (
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger-fg" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warn-fg" />
                  )}

                  <div className="flex min-w-0 flex-col gap-0.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded border px-1.5 py-0.5 text-label font-medium uppercase ${
                          isCritical
                            ? "border-danger-line bg-danger-bg text-danger-fg"
                            : "border-warn-line bg-warn-bg text-warn-fg"
                        }`}
                      >
                        {isCritical ? "Критический" : "Предупреждение"}
                      </span>
                      <span className="text-label text-fg-subtle">
                        пункт {risk.clause}
                      </span>
                    </div>

                    <p className="text-label font-medium text-fg">
                      {risk.title}
                    </p>

                    {isActive && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="text-label leading-relaxed text-fg-soft"
                      >
                        {risk.text}
                      </motion.p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}

          <div className="mt-1 rounded-lg bg-brand px-3 py-2 text-center text-label font-medium text-inverse-fg">
            Сгенерировать исправленную версию
          </div>
        </div>
      </div>
    </div>
  );
}
