"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/landing/Reveal";

export function FinalCTA() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-slate-900 px-6 py-16 text-center shadow-xl">
          {/* Подсветка внутри карточки */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-90"
            style={{
              backgroundImage:
                "radial-gradient(32rem 18rem at 50% -10%, rgba(99,102,241,0.45), transparent 65%)",
            }}
          />

          {!reduceMotion && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -bottom-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-violet-500/20 blur-3xl"
              animate={{ opacity: [0.35, 0.6, 0.35] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
          )}

          <div className="relative flex flex-col items-center">
            <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Перестаньте собирать документы вручную
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-zinc-300 sm:text-base">
              Заведите первое дело за минуту — Алетейя возьмёт на себя
              остальное.
            </p>

            <Button
              asChild
              size="lg"
              className="group mt-8 gap-2 bg-white text-slate-900 hover:bg-zinc-100"
            >
              <Link href="/dashboard">
                Начать работу
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
