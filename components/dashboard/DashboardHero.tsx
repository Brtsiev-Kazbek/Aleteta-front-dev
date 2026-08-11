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
 * свечение и стеклянная кнопка. Ниже страница остаётся светлой — работать на
 * тёмном неудобно, а вход в продукт должен быть узнаваемым.
 *
 * Свечение берётся из общей заготовки `mesh-dark`, а не собирается здесь
 * своими руками. Раньше собиралось: два пятна, вписанных стилем прямо в
 * разметку, — и они не совпадали с лендингом ни радиусом, ни оттенком, отчего
 * вход в продукт выглядел похожим, но чужим.
 */
export function DashboardHero() {
  const reduceMotion = useReducedMotion();

  const cases = useAppStore((state) => state.cases);
  const entities = useAppStore((state) => state.entities);
  const documents = useAppStore((state) => state.documents);
  const entitySchemas = useAppStore((state) => state.entitySchemas);

  // Считаем только свои: встроенные типы есть у всех и ничего не говорят о
  // том, как человек настроил работу под себя.
  const ownTypes = entitySchemas.filter((schema) => schema.isCustom).length;

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
      value: ownTypes,
      label: plural(ownTypes, "свой тип", "своих типа", "своих типов"),
    },
  ];

  return (
    <section className="grain relative overflow-hidden bg-inverse">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="mesh-dark absolute inset-0 opacity-80" />
        <div className="bg-grid-dark absolute inset-0 opacity-60" />
      </div>

      <div className="relative mx-auto max-w-6xl px-8 py-14">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex"
        >
          <span className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            <span className="text-caption text-inverse-fg/70">
              Демонстрационный режим
            </span>
          </span>
        </motion.div>

        <h1 className="mt-6 max-w-2xl text-display font-medium leading-[1.08] text-inverse-fg sm:text-display-lg">
          {HEADLINE.map((chunk, index) => (
            <motion.span
              key={chunk}
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
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
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.35 }}
          className="mt-5 max-w-xl text-body-lg leading-relaxed text-inverse-fg/55"
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
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.42 }}
          className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3"
        >
          <Link
            href="/dashboard/recognize"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-inverse-fg px-5 text-body font-medium text-inverse transition-transform duration-200 hover:scale-[1.02]"
          >
            <ScanText className="h-4 w-4" />
            Распознать документ
          </Link>

          <span className="text-caption text-inverse-fg/40">
            Скан или PDF — текст появится на странице и останется в поиске
          </span>
        </motion.div>

        {/* Текущее состояние рабочей области */}
        <motion.ul
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-10 flex flex-wrap items-baseline gap-x-10 gap-y-3 border-t border-inverse-fg/10 pt-6"
        >
          {stats.map((stat) => (
            <li key={stat.label} className="flex items-baseline gap-2">
              <span className="font-mono text-title-sm tabular-nums text-inverse-fg">
                <AnimatedNumber value={stat.value} />
              </span>
              <span className="font-mono text-label uppercase text-inverse-fg/40">
                {stat.label}
              </span>
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
