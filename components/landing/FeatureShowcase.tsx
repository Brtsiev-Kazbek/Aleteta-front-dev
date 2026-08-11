"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { DemoStage } from "@/components/landing/DemoStage";
import { SectionShell } from "@/components/landing/SectionShell";
import { cn } from "@/lib/utils";

export interface Feature {
  id: string;
  tab: string;
  title: string;
  description: string;
  bullets: string[];
  demo: ReactNode;
}

interface FeatureShowcaseProps {
  id?: string;
  eyebrow: string;
  title: string;
  description?: string;
  features: Feature[];
  className?: string;
}

const AUTO_ADVANCE_MS = 9000;

/**
 * Показ возможностей: переключатель сверху, живая демонстрация под ним.
 *
 * Переключатель горизонтальный, а не колонкой сбоку, и это не вкусовщина.
 * Колонка слева забирала треть ширины у самого ценного, что здесь есть, —
 * у снимка продукта. Строка вкладок стоит одну строку, а демонстрация получает
 * всю ширину и наконец читается.
 *
 * Заодно это чинит телефон: колонка на 375 точках схлопывалась в список из
 * пяти строк, который нужно было пролистать, чтобы дойти до картинки. Строка
 * прокручивается вбок и не отнимает высоту.
 *
 * Активную вкладку держит не рамка, а подложка, переезжающая между вкладками
 * через `layoutId`. Переезд занимает четверть секунды и объясняет глазу, что
 * сменилось, — без него смена демонстрации выглядит как перезагрузка блока.
 */
export function FeatureShowcase({
  id,
  eyebrow,
  title,
  description,
  features,
  className,
}: FeatureShowcaseProps) {
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setPaused] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (reduceMotion || isPaused) return;

    timerRef.current = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % features.length);
    }, AUTO_ADVANCE_MS);

    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [activeIndex, isPaused, reduceMotion, features.length]);

  const active = features[activeIndex];
  if (!active) return null;

  return (
    <SectionShell
      id={id}
      eyebrow={eyebrow}
      title={title}
      lead={description}
      className={className}
    >
      <div onMouseEnter={() => setPaused(true)}>
        {/* Переключатель */}
        <div className="-mx-6 overflow-x-auto px-6 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="mx-auto flex w-max gap-1 rounded-full border border-line bg-surface p-1">
            {features.map((feature, index) => {
              const isActive = index === activeIndex;

              return (
                <button
                  key={feature.id}
                  type="button"
                  aria-current={isActive}
                  onClick={() => {
                    setActiveIndex(index);
                    setPaused(true);
                  }}
                  className={cn(
                    "relative shrink-0 rounded-full px-4 py-2 text-body transition-colors",
                    isActive ? "text-inverse-fg" : "text-fg-subtle hover:text-fg"
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId={`tab-${id ?? eyebrow}`}
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 420, damping: 38 }
                      }
                      className="absolute inset-0 rounded-full bg-inverse"
                    />
                  )}
                  <span className="relative whitespace-nowrap">
                    {feature.tab}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
          {/* Демонстрация — ей отдана бо́льшая часть ширины */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`demo-${active.id}`}
              initial={reduceMotion ? undefined : { opacity: 0, y: 12 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
              transition={{ duration: 0.28 }}
              className="min-h-[420px] lg:col-span-8"
            >
              <DemoStage>{active.demo}</DemoStage>
            </motion.div>
          </AnimatePresence>

          {/* Пояснение */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`text-${active.id}`}
              initial={reduceMotion ? undefined : { opacity: 0, y: 12 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
              transition={{ duration: 0.28, delay: 0.04 }}
              className="lg:col-span-4"
            >
              <h3 className="text-title font-medium text-fg">{active.title}</h3>
              <p className="mt-4 text-body leading-relaxed text-fg-subtle">
                {active.description}
              </p>

              <ul className="mt-6 flex flex-col gap-3">
                {active.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-3 text-body text-fg-muted">
                    <span
                      aria-hidden
                      className="mt-[0.4375rem] h-1 w-1 shrink-0 rounded-full bg-brand"
                    />
                    {bullet}
                  </li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </SectionShell>
  );
}
