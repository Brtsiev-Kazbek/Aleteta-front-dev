"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CheckCircle2, PlayCircle, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProductPreview } from "@/components/landing/ProductPreview";

/** Только то, что продукт действительно делает. */
const TRUST_POINTS = [
  "Проверка реквизитов до генерации",
  "Экспорт в DOCX",
  "Ничего не нужно устанавливать",
];

export function Hero() {
  const reduceMotion = useReducedMotion();

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduceMotion ? 0 : 0.09, delayChildren: 0.1 },
    },
  };

  const item = reduceMotion
    ? { hidden: {}, show: {} }
    : {
        hidden: { opacity: 0, y: 20 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.6, ease: [0.21, 0.47, 0.32, 0.98] as const },
        },
      };

  return (
    <section className="relative overflow-hidden">
      {/* Фон: сетка + мягкое свечение */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid mask-fade-b opacity-70" />
        <div className="absolute inset-0 bg-aurora" />
      </div>

      {/* Плавающие блики */}
      {!reduceMotion && (
        <>
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -left-24 top-24 -z-10 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl"
            animate={{ y: [0, 26, 0], x: [0, 14, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -right-20 top-56 -z-10 h-80 w-80 rounded-full bg-violet-400/20 blur-3xl"
            animate={{ y: [0, -30, 0], x: [0, -16, 0] }}
            transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
          />
        </>
      )}

      <div className="mx-auto max-w-6xl px-6 pb-24 pt-32 sm:pt-40">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="mx-auto flex max-w-3xl flex-col items-center text-center"
        >
          <motion.span
            variants={item}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white/80 px-3 py-1.5 text-xs text-zinc-600 shadow-sm backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            Для юристов, кадровиков и предпринимателей
          </motion.span>

          <motion.h1
            variants={item}
            className="mt-6 text-4xl font-semibold leading-[1.1] tracking-tight text-zinc-900 sm:text-[3.25rem]"
          >
            Интеллектуальная операционная система{" "}
            <span className="relative whitespace-nowrap">
              <span className="relative z-10 bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                для ваших дел
              </span>
            </span>{" "}
            и документов
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-500 sm:text-lg"
          >
            Алетейя берет на себя рутину: анализирует файлы, извлекает
            реквизиты, помнит контекст каждой задачи и генерирует сотни
            документов без единой ошибки.
          </motion.p>

          <motion.div
            variants={item}
            className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row"
          >
            <Button asChild size="lg" className="group gap-2">
              <Link href="/dashboard">
                Начать работу
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="gap-2 border-zinc-200 bg-white/80 backdrop-blur"
            >
              <Link href="/dashboard">
                <PlayCircle className="h-4 w-4" />
                Посмотреть демо
              </Link>
            </Button>
          </motion.div>

          <motion.ul
            variants={item}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
          >
            {TRUST_POINTS.map((point) => (
              <li
                key={point}
                className="flex items-center gap-1.5 text-xs text-zinc-500"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                {point}
              </li>
            ))}
          </motion.ul>
        </motion.div>

        {/* Живое демо продукта */}
        <motion.div
          initial={reduceMotion ? undefined : { opacity: 0, y: 40 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="mx-auto mt-16 max-w-4xl"
        >
          <ProductPreview />
        </motion.div>
      </div>
    </section>
  );
}
