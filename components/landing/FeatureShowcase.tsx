"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { SectionHeading } from "@/components/landing/SectionHeading";
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
 * Блок возможностей: вертикальный указатель слева, живая демонстрация справа.
 * Переиспользуется для нескольких групп возможностей.
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
    <section id={id} className={cn("border-b border-stone-200", className)}>
      <div className="mx-auto max-w-6xl px-6 py-24">
        <SectionHeading
          eyebrow={eyebrow}
          title={title}
          description={description}
        />

        <div
          className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-12"
          onMouseEnter={() => setPaused(true)}
        >
          {/* Навигация */}
          <div className="lg:col-span-4">
            <div className="flex flex-col border-l border-stone-200">
              {features.map((feature, i) => {
                const isActive = i === activeIndex;

                return (
                  <button
                    key={feature.id}
                    type="button"
                    aria-current={isActive}
                    onClick={() => {
                      setActiveIndex(i);
                      setPaused(true);
                    }}
                    className="relative py-3.5 pl-5 pr-2 text-left"
                  >
                    <span
                      className={cn(
                        "absolute -left-px top-0 h-full w-px transition-colors",
                        isActive ? "bg-stone-900" : "bg-transparent"
                      )}
                    />

                    {isActive && !isPaused && !reduceMotion && (
                      <motion.span
                        key={`progress-${activeIndex}`}
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{
                          duration: AUTO_ADVANCE_MS / 1000,
                          ease: "linear",
                        }}
                        style={{ transformOrigin: "top" }}
                        className="absolute -left-px top-0 h-full w-px bg-violet-600"
                      />
                    )}

                    <span className="flex items-baseline gap-3">
                      <span
                        className={cn(
                          "font-mono text-[10px] tabular-nums transition-colors",
                          isActive ? "text-violet-600" : "text-stone-300"
                        )}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>

                      <span
                        className={cn(
                          "text-sm transition-colors",
                          isActive
                            ? "font-medium text-stone-900"
                            : "text-stone-500 hover:text-stone-700"
                        )}
                      >
                        {feature.tab}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={`text-${active.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="mt-8"
              >
                <h3 className="text-lg font-medium leading-snug tracking-[-0.01em] text-stone-900">
                  {active.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-stone-600">
                  {active.description}
                </p>

                <ul className="mt-5 flex flex-col divide-y divide-stone-100 border-y border-stone-100">
                  {active.bullets.map((bullet) => (
                    <li key={bullet} className="py-2.5 text-sm text-stone-700">
                      {bullet}
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Демонстрация */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`demo-${active.id}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.3 }}
              className="min-h-[420px] lg:col-span-8"
            >
              {active.demo}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
