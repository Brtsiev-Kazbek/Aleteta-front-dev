"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Download, Search, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

type Block =
  | { kind: "title"; text: string }
  | { kind: "meta"; left: string; right: string }
  | { kind: "para"; text: string }
  | { kind: "heading"; text: string }
  | { kind: "clause"; number: string; text: string }
  | { kind: "signatures"; left: string; right: string };

interface Scenario {
  prompt: string;
  hasTemplate: boolean;
  templateName: string;
  fileName: string;
  blocks: Block[];
}

const SCENARIOS: Scenario[] = [
  {
    prompt: "Соглашение о конфиденциальности с подрядчиком на 3 года",
    hasTemplate: false,
    templateName: "",
    fileName: "Соглашение_о_конфиденциальности.docx",
    blocks: [
      { kind: "title", text: "СОГЛАШЕНИЕ О КОНФИДЕНЦИАЛЬНОСТИ" },
      { kind: "meta", left: "г. Владикавказ", right: "12 марта 2026 г." },
      {
        kind: "para",
        text: "ООО «Вектор-Строй», именуемое в дальнейшем «Раскрывающая сторона», в лице генерального директора Сидорова П. А., действующего на основании Устава, с одной стороны, и ООО «Альфа-Консалт», именуемое в дальнейшем «Принимающая сторона», в лице директора Иванова И. И., с другой стороны, заключили настоящее Соглашение о нижеследующем:",
      },
      { kind: "heading", text: "1. Предмет соглашения" },
      {
        kind: "clause",
        number: "1.1.",
        text: "Стороны обязуются не раскрывать третьим лицам сведения, полученные в ходе исполнения Договора оказания услуг № 217 от 12.03.2026, и не использовать их в целях, не связанных с исполнением указанного Договора.",
      },
      {
        kind: "clause",
        number: "1.2.",
        text: "Конфиденциальной признаётся информация, переданная в письменной, устной или электронной форме и обозначенная передающей Стороной как конфиденциальная.",
      },
      { kind: "heading", text: "2. Режим конфиденциальности" },
      {
        kind: "clause",
        number: "2.1.",
        text: "Принимающая сторона обеспечивает хранение полученных сведений с той же степенью заботливости, с какой охраняет собственную конфиденциальную информацию.",
      },
      {
        kind: "clause",
        number: "2.2.",
        text: "Режим конфиденциальности действует в течение 3 (трёх) лет с даты подписания настоящего Соглашения и сохраняется после прекращения Договора.",
      },
      { kind: "heading", text: "3. Ответственность сторон" },
      {
        kind: "clause",
        number: "3.1.",
        text: "За разглашение конфиденциальной информации виновная Сторона возмещает документально подтверждённые убытки в полном объёме.",
      },
      {
        kind: "signatures",
        left: "Раскрывающая сторона\nООО «Вектор-Строй»\nИНН 1513000241\n\n______________ / Сидоров П. А.",
        right: "Принимающая сторона\nООО «Альфа-Консалт»\nИНН 1513000000\n\n______________ / Иванов И. И.",
      },
    ],
  },
  {
    prompt: "Допсоглашение о рассрочке платежа на 6 месяцев",
    hasTemplate: true,
    templateName: "Дополнительное соглашение",
    fileName: "Допсоглашение_№1_о_рассрочке.docx",
    blocks: [
      {
        kind: "title",
        text: "ДОПОЛНИТЕЛЬНОЕ СОГЛАШЕНИЕ № 1\nк Договору оказания услуг № 217 от 12.03.2026",
      },
      { kind: "meta", left: "г. Владикавказ", right: "04 августа 2026 г." },
      {
        kind: "para",
        text: "ООО «Вектор-Строй» в лице генерального директора Сидорова П. А. и ООО «Альфа-Консалт» в лице директора Иванова И. И. заключили настоящее Дополнительное соглашение о нижеследующем:",
      },
      { kind: "heading", text: "1. Изменение порядка расчётов" },
      {
        kind: "clause",
        number: "1.1.",
        text: "Стороны пришли к соглашению об изменении порядка оплаты по Договору. Задолженность в размере 180 000 (сто восемьдесят тысяч) рублей погашается равными платежами в течение 6 (шести) месяцев.",
      },
      {
        kind: "clause",
        number: "1.2.",
        text: "Ежемесячный платёж составляет 30 000 (тридцать тысяч) рублей и вносится не позднее 5 (пятого) числа каждого месяца.",
      },
      { kind: "heading", text: "2. Ответственность" },
      {
        kind: "clause",
        number: "2.1.",
        text: "За нарушение графика платежей начисляется неустойка в размере 0,1% от просроченной суммы за каждый календарный день просрочки.",
      },
      {
        kind: "clause",
        number: "2.2.",
        text: "При просрочке более 30 (тридцати) календарных дней Исполнитель вправе потребовать досрочного погашения задолженности в полном объёме.",
      },
      { kind: "heading", text: "3. Заключительные положения" },
      {
        kind: "clause",
        number: "3.1.",
        text: "Соглашение вступает в силу с момента подписания и является неотъемлемой частью Договора. Прочие условия Договора остаются без изменений.",
      },
      {
        kind: "signatures",
        left: "Исполнитель\nООО «Вектор-Строй»\nИНН 1513000241\n\n______________ / Сидоров П. А.",
        right: "Заказчик\nООО «Альфа-Консалт»\nИНН 1513000000\n\n______________ / Иванов И. И.",
      },
    ],
  },
];

export function FreeformDemo() {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [searching, setSearching] = useState(false);
  const [verdict, setVerdict] = useState(false);
  const [visibleBlocks, setVisibleBlocks] = useState(0);
  const [isDone, setDone] = useState(false);

  const timers = useRef<number[]>([]);
  const sheetRef = useRef<HTMLDivElement>(null);

  const scenario = SCENARIOS[index] ?? SCENARIOS[0];

  useEffect(() => {
    if (reduceMotion || !scenario) {
      setTyped(scenario?.prompt ?? "");
      setVerdict(true);
      setVisibleBlocks(scenario?.blocks.length ?? 0);
      setDone(true);
      return;
    }

    function clear() {
      for (const id of timers.current) window.clearTimeout(id);
      timers.current = [];
    }

    function schedule(fn: () => void, delay: number) {
      timers.current.push(window.setTimeout(fn, delay));
    }

    clear();
    setTyped("");
    setSearching(false);
    setVerdict(false);
    setVisibleBlocks(0);
    setDone(false);

    const charDelay = 24;
    const typeEnd = 400 + scenario.prompt.length * charDelay;

    for (let i = 1; i <= scenario.prompt.length; i += 1) {
      schedule(() => setTyped(scenario.prompt.slice(0, i)), 400 + i * charDelay);
    }

    schedule(() => setSearching(true), typeEnd + 250);
    schedule(() => {
      setSearching(false);
      setVerdict(true);
    }, typeEnd + 1300);

    // Документ появляется блок за блоком.
    scenario.blocks.forEach((_, i) => {
      schedule(() => setVisibleBlocks(i + 1), typeEnd + 1700 + i * 340);
    });

    const docEnd = typeEnd + 1700 + scenario.blocks.length * 340;
    schedule(() => setDone(true), docEnd + 300);
    schedule(() => setIndex((c) => (c + 1) % SCENARIOS.length), docEnd + 4200);

    return clear;
  }, [index, reduceMotion, scenario]);

  // Лист прокручивается вслед за появляющимся текстом.
  useEffect(() => {
    if (reduceMotion || !sheetRef.current) return;
    sheetRef.current.scrollTo({
      top: sheetRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [visibleBlocks, reduceMotion]);

  if (!scenario) return null;

  return (
    <div className="flex h-full min-h-[520px] flex-col overflow-hidden rounded-lg border border-line bg-surface">
      {/* Запрос */}
      <div className="border-b border-line p-4">
        <div className="flex min-h-[42px] items-start gap-2 rounded border border-line-strong px-3 py-2.5">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
          <span className="text-caption leading-relaxed text-fg">
            {typed}
            {typed.length < scenario.prompt.length && (
              <motion.span
                aria-hidden
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.85, repeat: Infinity }}
                className="ml-px inline-block h-3.5 w-px bg-fg align-middle"
              />
            )}
          </span>
        </div>

        <AnimatePresence>
          {(searching || verdict) && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2.5 flex items-center gap-2"
            >
              <Search
                className={cn(
                  "h-3.5 w-3.5 shrink-0",
                  searching ? "animate-pulse text-fg" : "text-fg-faint"
                )}
              />
              {searching ? (
                <span className="text-label text-fg-subtle">
                  Проверяю, есть ли подходящий шаблон…
                </span>
              ) : scenario.hasTemplate ? (
                <span className="text-label text-fg-soft">
                  Шаблон найден:{" "}
                  <span className="text-fg">{scenario.templateName}</span>{" "}
                  — по данным дела
                </span>
              ) : (
                <span className="text-label text-fg-soft">
                  Шаблона нет —{" "}
                  <span className="font-medium text-brand-strong">
                    составляю документ с нуля
                  </span>
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Лист документа */}
      <div
        ref={sheetRef}
        className="scrollable-area min-h-0 flex-1 overflow-y-auto bg-surface-2 p-5"
      >
        <div className="mx-auto max-w-[30rem] bg-surface px-8 py-9 shadow-sm">
          {scenario.blocks.slice(0, visibleBlocks).map((block, i) => (
            <motion.div
              key={`${scenario.fileName}-${i}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28 }}
            >
              {block.kind === "title" && (
                <h4 className="whitespace-pre-line text-center text-label font-bold uppercase leading-relaxed text-fg">
                  {block.text}
                </h4>
              )}

              {block.kind === "meta" && (
                <div className="mt-5 flex items-baseline justify-between text-label text-fg-soft">
                  <span>{block.left}</span>
                  <span>{block.right}</span>
                </div>
              )}

              {block.kind === "para" && (
                <p className="mt-4 text-justify text-label leading-[1.7] text-fg-muted">
                  {block.text}
                </p>
              )}

              {block.kind === "heading" && (
                <h5 className="mt-5 text-label font-bold text-fg">
                  {block.text}
                </h5>
              )}

              {block.kind === "clause" && (
                <p className="mt-2.5 text-justify text-label leading-[1.7] text-fg-muted">
                  <span className="font-medium text-fg">
                    {block.number}
                  </span>{" "}
                  {block.text}
                </p>
              )}

              {block.kind === "signatures" && (
                <div className="mt-8 grid grid-cols-2 gap-6 border-t border-line pt-5">
                  <span className="whitespace-pre-line text-label leading-[1.8] text-fg-muted">
                    {block.left}
                  </span>
                  <span className="whitespace-pre-line text-label leading-[1.8] text-fg-muted">
                    {block.right}
                  </span>
                </div>
              )}
            </motion.div>
          ))}

          {/* Плейсхолдеры ещё не сформированных блоков */}
          {visibleBlocks < scenario.blocks.length && (
            <div className="mt-4 flex flex-col gap-1.5">
              {[0, 1, 2].map((row) => (
                <motion.div
                  key={row}
                  animate={{ opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 1.3, repeat: Infinity, delay: row * 0.15 }}
                  className="h-2 rounded bg-surface-3"
                  style={{ width: `${94 - row * 12}%` }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Готовый файл */}
      <AnimatePresence>
        {isDone && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2.5 border-t border-line px-4 py-3"
          >
            <Check className="h-3.5 w-3.5 shrink-0 text-ok-fg" strokeWidth={3} />
            <span className="min-w-0 flex-1 truncate text-label text-fg-muted">
              {scenario.fileName}
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded border border-line px-2 py-1 font-mono text-label uppercase text-fg-subtle">
              <Download className="h-3 w-3" />
              Скачать
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
