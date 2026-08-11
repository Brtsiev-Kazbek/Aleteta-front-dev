"use client";

import { useRef, type MouseEvent } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

import { Reveal } from "@/components/landing/Reveal";

const STEPS = [
  {
    number: "01",
    title: "Загрузите документы",
    text: "Уставы, паспорта, выписки, счета. Система распознаёт текст и вытаскивает реквизиты в структурированный вид.",
  },
  {
    number: "02",
    title: "Проверьте матрицу",
    text: "Объекты сведены в таблицу. Незаполненные и некорректные реквизиты отмечены — их видно до генерации.",
  },
  {
    number: "03",
    title: "Соберите пакет",
    text: "По каждому объекту формируется комплект документов из ваших шаблонов с подставленными значениями.",
  },
];

export function HowItWorks() {
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  // Мягкий световой круг, следующий за курсором.
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const springX = useSpring(x, { stiffness: 120, damping: 24 });
  const springY = useSpring(y, { stiffness: 120, damping: 24 });

  function handleMove(event: MouseEvent<HTMLElement>) {
    if (reduceMotion) return;
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    x.set(event.clientX - rect.left);
    y.set(event.clientY - rect.top);
  }

  return (
    <section
      id="how"
      ref={sectionRef}
      onMouseMove={handleMove}
      className="grain relative overflow-hidden border-b border-inverse-line bg-inverse"
    >
      {/* Свет за курсором */}
      {!reduceMotion && (
        <motion.div
          aria-hidden
          style={{ left: springX, top: springY }}
          className="pointer-events-none absolute z-0 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70"
        >
          <div className="h-full w-full rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.16),transparent_65%)]" />
        </motion.div>
      )}

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-20">
        <Reveal>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] tabular-nums text-violet-400">
              10
            </span>
            <span className="h-px w-8 bg-inverse-3" />
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-subtle">
              Как это работает
            </span>
          </div>

          <h2 className="mt-5 max-w-2xl text-3xl font-medium leading-[1.15] tracking-[-0.02em] text-inverse-fg sm:text-[2.5rem]">
            От папки со сканами до готового пакета — три шага
          </h2>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-lg bg-inverse-3 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <Reveal key={step.number} delay={index * 0.12}>
              <motion.div
                whileHover={{ backgroundColor: "rgb(24 24 27)" }}
                transition={{ duration: 0.25 }}
                className="flex h-full flex-col bg-inverse p-7 lg:p-8"
              >
                <span className="font-mono text-[11px] tabular-nums text-violet-400">
                  {step.number}
                </span>

                <h3 className="mt-5 text-lg font-medium text-inverse-fg">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-fg-faint">
                  {step.text}
                </p>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
