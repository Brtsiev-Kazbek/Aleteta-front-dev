"use client";

import { motion } from "framer-motion";
import { FileUp, Sparkles, Table2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Reveal } from "@/components/landing/Reveal";

interface Step {
  number: string;
  icon: LucideIcon;
  title: string;
  text: string;
}

const STEPS: Step[] = [
  {
    number: "01",
    icon: FileUp,
    title: "Загрузите файлы",
    text: "Выписки, уставы, сканы паспортов. Алетейя распознаёт текст и вытаскивает реквизиты в структурированный вид.",
  },
  {
    number: "02",
    icon: Table2,
    title: "Проверьте матрицу",
    text: "Сущности собираются в таблицу. Незаполненные обязательные поля подсвечиваются красным — их видно сразу.",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "Сгенерируйте пакет",
    text: "Один клик — и по каждой сущности собирается полный комплект документов из ваших шаблонов.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="border-y border-zinc-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-medium uppercase tracking-wider text-indigo-600">
            Как это работает
          </span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            От папки со сканами до пакета документов
          </h2>
        </Reveal>

        <div className="relative mt-16">
          {/* Соединительная линия, «прорисовывается» при скролле */}
          <motion.span
            aria-hidden
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.1, ease: "easeInOut" }}
            style={{ transformOrigin: "left" }}
            className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-indigo-200 via-zinc-200 to-transparent md:block"
          />

          <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
            {STEPS.map((step, index) => (
              <Reveal key={step.number} delay={index * 0.14}>
                <div className="relative flex flex-col">
                  <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-200 bg-white shadow-sm">
                    <step.icon className="h-5 w-5 text-indigo-600" />
                  </div>

                  <span className="mt-5 text-xs font-semibold tabular-nums text-indigo-600">
                    {step.number}
                  </span>
                  <h3 className="mt-1.5 text-base font-semibold text-zinc-900">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                    {step.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
