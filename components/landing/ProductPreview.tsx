"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, Check } from "lucide-react";

import { cn } from "@/lib/utils";

interface Dataset {
  caseTitle: string;
  domain: string;
  columns: string[];
  /** Индексы колонок, которые выводятся моноширинным. */
  monoColumns: number[];
  firstRow: string[];
  secondRow: string[];
  /** Индекс пустой колонки во второй строке. */
  emptyColumn: number;
  fillValue: string;
}

/**
 * Один и тот же механизм на разных предметных областях — чтобы было видно,
 * что продукт не про землю, а про любые документы с реквизитами.
 */
const DATASETS: Dataset[] = [
  {
    caseTitle: "Дело №104 · Сделка с недвижимостью",
    domain: "Объекты недвижимости",
    columns: ["Название", "Кадастровый номер", "Площадь", "Назначение земель"],
    monoColumns: [1],
    firstRow: [
      "Участок №12",
      "15:09:0000000:0000",
      "440 кв.м.",
      "Для ИЖС",
    ],
    secondRow: ["Участок №14", "15:09:0000000:0001", "612 кв.м.", ""],
    emptyColumn: 3,
    fillValue: "Для ИЖС",
  },
  {
    caseTitle: "Дело №217 · Договоры с подрядчиками",
    domain: "Контрагенты",
    columns: ["Наименование", "ИНН", "КПП", "Директор"],
    monoColumns: [1, 2],
    firstRow: [
      "ООО «Альфа-Консалт»",
      "1513000000",
      "151301001",
      "Иванов И. И.",
    ],
    secondRow: ["ООО «Вектор-Строй»", "1513000241", "", "Сидоров П. А."],
    emptyColumn: 2,
    fillValue: "151301001",
  },
  {
    caseTitle: "Дело №338 · Приём сотрудников",
    domain: "Физические лица",
    columns: ["ФИО", "Паспорт", "СНИЛС", "Должность"],
    monoColumns: [1, 2],
    firstRow: [
      "Петров С. С.",
      "90 12 345678",
      "123-456-789 00",
      "Инженер",
    ],
    secondRow: ["Кузнецова А. В.", "90 14 882301", "", "Бухгалтер"],
    emptyColumn: 2,
    fillValue: "214-885-113 42",
  },
];

type Phase = "empty" | "typing" | "valid" | "ready";

export function ProductPreview() {
  const reduceMotion = useReducedMotion();

  const [datasetIndex, setDatasetIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>(reduceMotion ? "ready" : "empty");
  const [typed, setTyped] = useState("");
  const timers = useRef<number[]>([]);

  const data = DATASETS[datasetIndex] ?? DATASETS[0];

  useEffect(() => {
    if (reduceMotion || !data) return;

    function clearTimers() {
      for (const id of timers.current) window.clearTimeout(id);
      timers.current = [];
    }

    function schedule(fn: () => void, delay: number) {
      timers.current.push(window.setTimeout(fn, delay));
    }

    clearTimers();
    setPhase("empty");
    setTyped("");

    const value = data.fillValue;
    const typingStart = 1300;
    const charDelay = 55;
    const typingEnd = typingStart + value.length * charDelay;

    schedule(() => setPhase("typing"), typingStart);

    for (let i = 1; i <= value.length; i += 1) {
      schedule(() => setTyped(value.slice(0, i)), typingStart + i * charDelay);
    }

    schedule(() => setPhase("valid"), typingEnd + 280);
    schedule(() => setPhase("ready"), typingEnd + 900);

    // Переход к следующей предметной области.
    schedule(
      () => setDatasetIndex((current) => (current + 1) % DATASETS.length),
      typingEnd + 3000
    );

    return clearTimers;
  }, [datasetIndex, reduceMotion, data]);

  if (!data) return null;

  const isFilled = phase === "valid" || phase === "ready";
  const isReady = phase === "ready";

  return (
    <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_48px_-16px_rgba(0,0,0,0.14)]">
      {/* Строка дела */}
      <div className="flex items-center gap-3 border-b border-stone-200 px-4 py-2.5">
        <AnimatePresence mode="wait">
          <motion.span
            key={data.caseTitle}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.25 }}
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400"
          >
            {data.caseTitle}
          </motion.span>
        </AnimatePresence>

        {/* Индикатор текущей области */}
        <div className="ml-auto flex items-center gap-1.5">
          {DATASETS.map((item, index) => (
            <span
              key={item.domain}
              className={cn(
                "h-1 rounded-full transition-all duration-500",
                index === datasetIndex
                  ? "w-5 bg-stone-900"
                  : "w-1 bg-stone-300"
              )}
            />
          ))}
        </div>
      </div>

      {/* Таблица */}
      <div className="overflow-x-auto">
        <AnimatePresence mode="wait">
          <motion.table
            key={data.domain}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="w-full min-w-[620px] border-separate border-spacing-0 text-left"
          >
            <thead>
              <tr>
                {data.columns.map((column) => (
                  <th
                    key={column}
                    className="whitespace-nowrap border-b border-stone-200 px-4 py-2.5 font-mono text-[10px] font-normal uppercase tracking-[0.12em] text-stone-400"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              <tr>
                {data.firstRow.map((cell, index) => (
                  <td
                    key={index}
                    className={cn(
                      "whitespace-nowrap border-b border-stone-100 px-4 py-3 text-sm text-stone-700",
                      data.monoColumns.includes(index) &&
                        "font-mono text-[13px] text-stone-600"
                    )}
                  >
                    {cell}
                  </td>
                ))}
              </tr>

              <tr>
                {data.secondRow.map((cell, index) => {
                  if (index !== data.emptyColumn) {
                    return (
                      <td
                        key={index}
                        className={cn(
                          "whitespace-nowrap px-4 py-3 text-sm text-stone-700",
                          data.monoColumns.includes(index) &&
                            "font-mono text-[13px] text-stone-600"
                        )}
                      >
                        {cell}
                      </td>
                    );
                  }

                  return (
                    <td key={index} className="px-3 py-2">
                      <motion.div
                        animate={{
                          backgroundColor: isFilled
                            ? "rgba(255,255,255,0)"
                            : "rgb(254 242 242)",
                          borderColor: isFilled
                            ? "rgba(255,255,255,0)"
                            : "rgb(254 202 202)",
                        }}
                        transition={{ duration: 0.35 }}
                        className="flex h-9 items-center gap-2 rounded border px-2.5"
                      >
                        {!isFilled && (
                          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
                        )}

                        <span
                          className={cn(
                            "text-sm transition-colors duration-300",
                            data.monoColumns.includes(index) &&
                              "font-mono text-[13px]",
                            isFilled
                              ? "text-stone-700"
                              : typed
                                ? "text-stone-900"
                                : "text-red-700"
                          )}
                        >
                          {typed || (phase === "empty" ? "Не заполнено" : "")}
                        </span>

                        {phase === "typing" && (
                          <motion.span
                            aria-hidden
                            animate={{ opacity: [1, 0, 1] }}
                            transition={{ duration: 0.85, repeat: Infinity }}
                            className="inline-block h-4 w-px bg-stone-900"
                          />
                        )}
                      </motion.div>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </motion.table>
        </AnimatePresence>
      </div>

      {/* Нижняя панель */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 px-4 py-3">
        <div className="flex items-baseline gap-2.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-stone-400">
            Готово к генерации
          </span>

          <span className="relative inline-flex h-5 w-10 items-baseline overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={isFilled ? "2" : "1"}
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -12, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className={cn(
                  "absolute font-mono text-sm tabular-nums",
                  isFilled ? "text-emerald-600" : "text-stone-900"
                )}
              >
                {isFilled ? "2 / 2" : "1 / 2"}
              </motion.span>
            </AnimatePresence>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <AnimatePresence>
            {isReady && (
              <motion.span
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="hidden items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-emerald-600 sm:flex"
              >
                <Check className="h-3 w-3" strokeWidth={2.5} />
                Проверено
              </motion.span>
            )}
          </AnimatePresence>

          <motion.div
            animate={
              isReady
                ? { backgroundColor: "rgb(15 23 42)", color: "rgb(255 255 255)" }
                : {
                    backgroundColor: "rgb(244 244 245)",
                    color: "rgb(161 161 170)",
                  }
            }
            transition={{ duration: 0.35 }}
            className="rounded px-4 py-2 text-sm font-medium"
          >
            Сгенерировать пакет
          </motion.div>
        </div>
      </div>
    </div>
  );
}
