"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Download, FileText, Sparkles } from "lucide-react";

import { Reveal } from "@/components/landing/Reveal";
import { cn } from "@/lib/utils";

const SOURCES = [
  { name: "Участок №12", type: "Недвижимость" },
  { name: "Участок №14", type: "Недвижимость" },
  { name: "ООО «Вектор-Строй»", type: "Контрагент" },
  { name: "Петров С. С.", type: "Физлицо" },
];

const OUTPUT = [
  "Договор купли-продажи · Участок №12",
  "Акт приёма-передачи · Участок №12",
  "Заявление в Росреестр · Участок №12",
  "Договор купли-продажи · Участок №14",
  "Акт приёма-передачи · Участок №14",
  "Заявление в Росреестр · Участок №14",
  "Договор оказания услуг · Вектор-Строй",
  "Карточка контрагента · Вектор-Строй",
  "Трудовой договор · Петров С. С.",
  "Согласие на обработку ПДн · Петров С. С.",
];

type Phase = "idle" | "running" | "done";

export function GenerationShowcase() {
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>(reduceMotion ? "done" : "idle");
  const [ready, setReady] = useState(reduceMotion ? OUTPUT.length : 0);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    if (reduceMotion) return;

    function clear() {
      for (const id of timers.current) window.clearTimeout(id);
      timers.current = [];
    }

    function schedule(fn: () => void, delay: number) {
      timers.current.push(window.setTimeout(fn, delay));
    }

    function run() {
      clear();
      setPhase("idle");
      setReady(0);

      schedule(() => setPhase("running"), 1200);

      // Документы «прилетают» один за другим.
      OUTPUT.forEach((_, index) => {
        schedule(() => setReady(index + 1), 1500 + index * 180);
      });

      schedule(() => setPhase("done"), 1500 + OUTPUT.length * 180 + 350);
      schedule(run, 1500 + OUTPUT.length * 180 + 4200);
    }

    run();
    return clear;
  }, [reduceMotion]);

  const progress = (ready / OUTPUT.length) * 100;

  return (
    <section className="grain relative overflow-hidden bg-inverse">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="mesh-dark absolute inset-0 opacity-60" />
        <div className="bg-grid-dark absolute inset-0 opacity-50" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <span className="font-mono text-label uppercase text-brand-line/70">
              Генерация пакета
            </span>

            <h2 className="mt-4 text-section font-medium text-inverse-fg">
              Четыре объекта — десять документов. Одно нажатие.
            </h2>
          </div>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Источник */}
          <Reveal className="lg:col-span-4">
            <span className="font-mono text-label uppercase text-fg-soft">
              Объекты дела
            </span>

            <div className="mt-4 flex flex-col gap-2">
              {SOURCES.map((source, index) => (
                <motion.div
                  key={source.name}
                  animate={{
                    borderColor:
                      phase === "idle"
                        ? "rgb(41 37 36)"
                        : "rgb(109 40 217)",
                  }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  className="flex items-center gap-2.5 rounded-xl border bg-fg/60 px-3 py-2.5"
                >
                  <FileText className="h-3.5 w-3.5 shrink-0 text-fg-soft" />
                  <span className="min-w-0 flex-1 truncate text-caption text-fg-ghost">
                    {source.name}
                  </span>
                  <span className="shrink-0 font-mono text-label uppercase text-fg-soft">
                    {source.type}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Кнопка запуска */}
            <div className="relative mt-6">
              <motion.div
                animate={
                  phase === "idle"
                    ? { backgroundColor: "rgb(255 255 255)", color: "rgb(12 10 9)" }
                    : phase === "running"
                      ? { backgroundColor: "rgb(109 40 217)", color: "rgb(255 255 255)" }
                      : { backgroundColor: "rgb(5 150 105)", color: "rgb(255 255 255)" }
                }
                transition={{ duration: 0.35 }}
                className="flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-body font-medium"
              >
                {phase === "done" ? (
                  <Check className="h-4 w-4" strokeWidth={3} />
                ) : (
                  <Sparkles
                    className={cn("h-4 w-4", phase === "running" && "animate-pulse")}
                  />
                )}
                {phase === "idle" && "Сгенерировать пакет"}
                {phase === "running" && "Формируем документы…"}
                {phase === "done" && "Пакет готов"}
              </motion.div>

              {phase === "idle" && !reduceMotion && (
                <motion.span
                  aria-hidden
                  initial={{ opacity: 0.6, scale: 1 }}
                  animate={{ opacity: 0, scale: 1.15 }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                  className="absolute inset-0 rounded-lg bg-surface"
                />
              )}
            </div>

            {/* Прогресс */}
            <div className="mt-5">
              <div className="h-px w-full bg-inverse-3">
                <motion.div
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.25 }}
                  className="h-px bg-brand"
                />
              </div>

              <div className="mt-2.5 flex items-baseline justify-between">
                <span className="font-mono text-label uppercase text-fg-soft">
                  Готово
                </span>
                <span className="font-mono text-body tabular-nums text-inverse-fg">
                  {ready} / {OUTPUT.length}
                </span>
              </div>
            </div>
          </Reveal>

          {/* Стрелка */}
          <div className="hidden items-center justify-center lg:col-span-1 lg:flex">
            <motion.div
              animate={
                phase === "running" ? { x: [-4, 4, -4] } : { x: 0 }
              }
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              <ArrowRight className="h-5 w-5 text-fg-muted" />
            </motion.div>
          </div>

          {/* Результат */}
          <Reveal delay={0.1} className="lg:col-span-7">
            <div className="flex items-center justify-between">
              <span className="font-mono text-label uppercase text-fg-soft">
                Готовые документы
              </span>

              <AnimatePresence>
                {phase === "done" && (
                  <motion.span
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-inverse-line px-2.5 py-1 font-mono text-label uppercase text-fg-ghost"
                  >
                    <Download className="h-3 w-3" />
                    Скачать .zip
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {OUTPUT.map((document, index) => {
                const isReady = index < ready;

                return (
                  <motion.div
                    key={document}
                    animate={{
                      opacity: isReady ? 1 : 0.22,
                      y: isReady ? 0 : 6,
                      borderColor: isReady
                        ? "rgb(41 37 36)"
                        : "rgb(28 25 23)",
                    }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-2.5 rounded-xl border bg-fg/50 px-3 py-2.5"
                  >
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                      {isReady ? (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 480, damping: 20 }}
                        >
                          <Check
                            className="h-3.5 w-3.5 text-ok-fg"
                            strokeWidth={3}
                          />
                        </motion.span>
                      ) : (
                        <FileText className="h-3 w-3 text-fg-muted" />
                      )}
                    </span>

                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate text-label transition-colors",
                        isReady ? "text-fg-ghost" : "text-fg-soft"
                      )}
                    >
                      {document}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            <AnimatePresence>
              {phase === "done" && (
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 text-caption leading-relaxed text-fg-subtle"
                >
                  Значения взяты из проверенных карточек объектов и не сочиняются
                  заново — поэтому расхождений между документами пакета не
                  возникает.
                </motion.p>
              )}
            </AnimatePresence>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
