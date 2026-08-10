"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ScanText } from "lucide-react";

import { AnimatedNumber } from "@/components/ui/animated-number";
import { plural } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

const HEADLINE = ["Девять инструментов —", "весь цикл работы", "с документами"];

/**
 * Шапка рабочего стола повторяет первый экран лендинга: тёмное поле, сетка,
 * мягкое свечение и моноширинная рубрика. Ниже страница остаётся светлой —
 * работать на тёмном неудобно, а вход в продукт должен быть узнаваемым.
 */
export function DashboardHero() {
  const reduceMotion = useReducedMotion();

  const cases = useAppStore((state) => state.cases);
  const entities = useAppStore((state) => state.entities);
  const documents = useAppStore((state) => state.documents);
  const customSchemas = useAppStore((state) => state.customSchemas);

  const stats = [
    {
      value: cases.length,
      label: plural(cases.length, "дело", "дела", "дел"),
    },
    {
      value: entities.length,
      label: plural(entities.length, "объект", "объекта", "объектов"),
    },
    {
      value: documents.length,
      label: plural(documents.length, "документ", "документа", "документов"),
    },
    {
      value: customSchemas.length,
      label: plural(customSchemas.length, "свой тип", "своих типа", "своих типов"),
    },
  ];

  return (
    <section className="grain relative overflow-hidden bg-stone-950">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grid-dark" />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(36rem 18rem at 18% 0%, rgba(139,92,246,0.18), transparent 62%), radial-gradient(30rem 16rem at 88% 20%, rgba(217,119,6,0.08), transparent 64%)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-8 py-14">
        <motion.div
          initial={reduceMotion ? undefined : { opacity: 0 }}
          animate={reduceMotion ? undefined : { opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <span aria-hidden className="h-px w-8 bg-violet-500" />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400">
            Демонстрационный режим
          </span>
        </motion.div>

        <h1 className="mt-6 max-w-2xl text-[2rem] font-medium leading-[1.08] tracking-[-0.035em] text-white sm:text-[2.5rem]">
          {HEADLINE.map((chunk, index) => (
            <motion.span
              key={chunk}
              initial={reduceMotion ? undefined : { opacity: 0, y: 18 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.1 + index * 0.07,
                ease: [0.22, 0.61, 0.36, 1],
              }}
              className="mr-[0.28em] inline-block"
            >
              {chunk}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={reduceMotion ? undefined : { opacity: 0, y: 12 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.35 }}
          className="mt-5 max-w-xl text-[15px] leading-relaxed text-stone-400"
        >
          Ровно то, что показано на главной странице. Всё ниже запускается на
          демонстрационных данных — ничего не отправляется наружу.
        </motion.p>

        {/*
          Распознавание вынесено отдельной кнопкой, а не спрятано в список из
          девяти инструментов ниже. Причина простая: это единственное, что
          работает не на демонстрационных данных, а по-настоящему, — и это
          первое, чего от продукта хотят. Искать его в меню человек не должен.
        */}
        <motion.div
          initial={reduceMotion ? undefined : { opacity: 0, y: 12 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.42 }}
          className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3"
        >
          <Link
            href="/dashboard/recognize"
            className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2.5 text-[13px] font-medium text-stone-900 transition-colors hover:bg-stone-200"
          >
            <ScanText className="h-4 w-4" />
            Распознать документ
          </Link>

          <span className="text-[12.5px] text-stone-500">
            Скан или PDF — текст появится на странице и останется в поиске
          </span>
        </motion.div>

        {/* Текущее состояние рабочей области */}
        <motion.ul
          initial={reduceMotion ? undefined : { opacity: 0 }}
          animate={reduceMotion ? undefined : { opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-10 flex flex-wrap items-baseline gap-x-10 gap-y-3 border-t border-stone-800 pt-6"
        >
          {stats.map((stat) => (
            <li key={stat.label} className="flex items-baseline gap-2">
              <span className="font-mono text-lg tabular-nums text-white">
                <AnimatedNumber value={stat.value} />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-500">
                {stat.label}
              </span>
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
