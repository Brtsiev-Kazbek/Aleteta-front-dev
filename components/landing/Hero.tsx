"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { ArrowRight } from "lucide-react";

import { MagneticLink } from "@/components/landing/MagneticLink";
import { ProductPreview } from "@/components/landing/ProductPreview";

const HEADLINE = [
  "Интеллектуальная",
  "операционная",
  "система",
  "для ваших дел",
  "и документов",
];

/** Только проверяемые утверждения о продукте. */
const FACTS = [
  "Проверка реквизитов до генерации",
  "Экспорт в DOCX",
  "Работает в браузере",
];

export function Hero() {
  const reduceMotion = useReducedMotion();
  const previewRef = useRef<HTMLDivElement>(null);

  // Продукт «выпрямляется» по мере попадания в кадр.
  const { scrollYProgress } = useScroll({
    target: previewRef,
    offset: ["start 0.9", "start 0.3"],
  });
  const rotateX = useTransform(scrollYProgress, [0, 1], [12, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1]);

  return (
    <section className="grain relative overflow-hidden bg-stone-950">
      {/* Сетка и мягкое свечение */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grid-dark" />
        <div
          className="absolute inset-x-0 top-0 h-[46rem]"
          style={{
            backgroundImage:
              "radial-gradient(48rem 26rem at 22% 6%, rgba(139,92,246,0.20), transparent 62%), radial-gradient(40rem 24rem at 82% 18%, rgba(217,119,6,0.10), transparent 62%)",
          }}
        />
        {/* Переход к светлой части страницы */}
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent to-stone-950" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 pb-28 pt-32 sm:pt-40">
        {/* Рубрика */}
        <motion.div
          initial={reduceMotion ? undefined : { opacity: 0 }}
          animate={reduceMotion ? undefined : { opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <span className="h-px w-8 bg-violet-500" />
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone-400">
            Для юристов, кадровиков, бухгалтеров и вузов
          </span>
        </motion.div>

        {/* Заголовок: слова проявляются по очереди */}
        <h1 className="mt-7 max-w-4xl text-[2.5rem] font-medium leading-[1.06] tracking-[-0.035em] text-white sm:text-6xl">
          {HEADLINE.map((chunk, index) => (
            <motion.span
              key={chunk}
              initial={reduceMotion ? undefined : { opacity: 0, y: 26 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={{
                duration: 0.65,
                delay: 0.12 + index * 0.07,
                ease: [0.22, 0.61, 0.36, 1],
              }}
              className="mr-[0.28em] inline-block"
            >
              {chunk}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="mt-7 max-w-2xl text-lg leading-relaxed text-stone-400"
        >
          Алетейя берёт на себя рутину: анализирует файлы, извлекает реквизиты,
          помнит контекст каждой задачи и собирает сотни документов без ошибок
          в данных.
        </motion.p>

        <motion.div
          initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.65 }}
          className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center"
        >
          <MagneticLink
            href="/auth/register"
            className="group inline-flex h-11 items-center gap-2 rounded-md bg-white px-6 text-sm font-medium text-stone-950 transition-colors hover:bg-stone-200"
          >
            Начать работу
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </MagneticLink>

          <Link
            href="#features"
            className="group inline-flex h-11 items-center px-1 text-sm font-medium text-stone-300 transition-colors hover:text-white"
          >
            <span className="border-b border-stone-700 pb-0.5 transition-colors group-hover:border-stone-300">
              Посмотреть, как это работает
            </span>
          </Link>
        </motion.div>

        <motion.ul
          initial={reduceMotion ? undefined : { opacity: 0 }}
          animate={reduceMotion ? undefined : { opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-stone-800 pt-6"
        >
          {FACTS.map((fact) => (
            <li
              key={fact}
              className="font-mono text-[11px] uppercase tracking-[0.12em] text-stone-500"
            >
              {fact}
            </li>
          ))}
        </motion.ul>

        {/* Продукт: светлая карточка на тёмном, наклон выпрямляется при скролле */}
        <div ref={previewRef} className="mt-16" style={{ perspective: 1600 }}>
          <motion.div
            style={
              reduceMotion
                ? undefined
                : { rotateX, scale, transformOrigin: "center top" }
            }
            className="relative"
          >
            {/* Свечение под продуктом */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-x-10 -bottom-8 top-10 rounded-[2rem] bg-violet-500/20 blur-3xl"
            />
            <div className="relative">
              <ProductPreview />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
