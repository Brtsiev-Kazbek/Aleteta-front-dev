"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Gavel, Loader2, Scale } from "lucide-react";

import { cn } from "@/lib/utils";

interface Precedent {
  court: string;
  number: string;
  year: string;
  holding: string;
  /** Позиция суда: в пользу какой стороны трактуется условие. */
  side: "против" | "за";
}

interface Scenario {
  clause: string;
  text: string;
  query: string;
  precedents: Precedent[];
}

const SCENARIOS: Scenario[] = [
  {
    clause: "5.3",
    text: "Заказчик вправе в одностороннем порядке отказаться от исполнения Договора, уведомив Исполнителя за 5 календарных дней.",
    query: "односторонний отказ заказчика без оплаты выполненного",
    precedents: [
      {
        court: "Верховный Суд РФ",
        number: "305-ЭС21-11556",
        year: "2021",
        holding:
          "Отказ заказчика не освобождает от оплаты фактически оказанных услуг до даты отказа.",
        side: "против",
      },
      {
        court: "АС Северо-Кавказского округа",
        number: "А61-4412/2022",
        year: "2022",
        holding:
          "Условие о безвозмездном отказе признано ничтожным как противоречащее ст. 782 ГК РФ.",
        side: "против",
      },
    ],
  },
  {
    clause: "2.4",
    text: "Заказчик принимает выполненные работы путём подписания акта. Срок рассмотрения акта не устанавливается.",
    query: "отсутствие срока приёмки работ по акту",
    precedents: [
      {
        court: "Верховный Суд РФ",
        number: "307-ЭС20-2237",
        year: "2020",
        holding:
          "При отсутствии срока приёмки применяется разумный срок; молчание заказчика не блокирует оплату.",
        side: "за",
      },
      {
        court: "АС Московского округа",
        number: "А40-118923/2021",
        year: "2021",
        holding:
          "Немотивированный отказ от подписания акта не освобождает от оплаты принятого результата.",
        side: "за",
      },
    ],
  },
];

/** 0 — пункт, 1 — поиск, 2..3 — результаты, 4 — вывод */
type Stage = 0 | 1 | 2 | 3 | 4;

export function CaseLawDemo() {
  const reduceMotion = useReducedMotion();
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [stage, setStage] = useState<Stage>(reduceMotion ? 4 : 0);
  const timers = useRef<number[]>([]);

  const scenario = SCENARIOS[scenarioIndex] ?? SCENARIOS[0];

  useEffect(() => {
    if (reduceMotion) return;

    function clear() {
      for (const id of timers.current) window.clearTimeout(id);
      timers.current = [];
    }

    clear();
    setStage(0);

    const steps: [Stage, number][] = [
      [1, 900],
      [2, 2200],
      [3, 2800],
      [4, 3500],
    ];
    for (const [next, delay] of steps) {
      timers.current.push(window.setTimeout(() => setStage(next), delay));
    }
    timers.current.push(
      window.setTimeout(
        () => setScenarioIndex((current) => (current + 1) % SCENARIOS.length),
        8200
      )
    );

    return clear;
  }, [scenarioIndex, reduceMotion]);

  if (!scenario) return null;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-fg-faint">
          Судебная практика по пункту
        </span>
        <div className="flex items-center gap-1">
          {SCENARIOS.map((item, index) => (
            <span
              key={item.clause}
              className={cn(
                "h-1 rounded-full transition-all duration-500",
                index === scenarioIndex ? "w-4 bg-stone-900" : "w-1 bg-stone-300"
              )}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        {/* Пункт договора */}
        <AnimatePresence mode="wait">
          <motion.div
            key={scenario.clause}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.22 }}
            className="rounded border-l-2 border-violet-500 bg-stone-50 py-2.5 pl-3 pr-3"
          >
            <span className="font-mono text-[10px] text-fg-faint">
              п. {scenario.clause}
            </span>
            <p className="mt-1 text-[11px] leading-relaxed text-fg-muted">
              {scenario.text}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Запрос */}
        <div className="mt-3 flex items-center gap-2">
          {stage === 1 ? (
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-violet-600" />
          ) : (
            <Scale className="h-3.5 w-3.5 shrink-0 text-fg-faint" />
          )}
          <span className="min-w-0 flex-1 truncate text-[11px] text-fg-subtle">
            {stage === 0 ? "Готов к поиску" : `Ищу: ${scenario.query}`}
          </span>
          {stage >= 2 && (
            <span className="shrink-0 font-mono text-[10px] text-fg-faint">
              {scenario.precedents.length} акта
            </span>
          )}
        </div>

        {/* Найденная практика */}
        <div className="mt-3 flex flex-1 flex-col gap-2">
          <AnimatePresence>
            {scenario.precedents.map((precedent, index) => {
              if (stage < index + 2) return null;

              return (
                <motion.div
                  key={precedent.number}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.28 }}
                  className="rounded border border-line p-3"
                >
                  <div className="flex items-start gap-2">
                    <Gavel className="mt-0.5 h-3.5 w-3.5 shrink-0 text-fg-faint" />

                    <div className="flex min-w-0 flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-medium text-fg">
                          {precedent.court}
                        </span>
                        <span className="font-mono text-[10px] text-fg-faint">
                          № {precedent.number} · {precedent.year}
                        </span>
                        <span
                          className={cn(
                            "rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em]",
                            precedent.side === "против"
                              ? "border-red-200 bg-red-50 text-red-700"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700"
                          )}
                        >
                          {precedent.side === "против"
                            ? "против условия"
                            : "в вашу пользу"}
                        </span>
                      </div>

                      <p className="text-[11px] leading-relaxed text-fg-soft">
                        {precedent.holding}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {stage === 4 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 border-t border-line pt-3"
            >
              <p className="text-[11px] leading-relaxed text-fg-soft">
                Практика подставлена в замечание к пункту — можно сослаться
                прямо в протоколе разногласий.
              </p>
              <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-fg-ghost">
                Демонстрационные данные
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
