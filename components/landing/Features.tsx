"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Brain, Layers } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Reveal } from "@/components/landing/Reveal";
import { cn } from "@/lib/utils";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  iconClassName: string;
  glowClassName: string;
  points: string[];
}

const FEATURES: Feature[] = [
  {
    icon: Brain,
    title: "Умная память дел",
    description:
      "Работа строится вокруг дела, а не вокруг чата. Алетейя держит в контексте загруженные файлы, извлечённые реквизиты и историю правок.",
    iconClassName: "bg-indigo-50 text-indigo-600",
    glowClassName: "group-hover:bg-indigo-500/10",
    points: ["Контекст не теряется", "История действий по делу"],
  },
  {
    icon: Layers,
    title: "Массовая генерация без ошибок",
    description:
      "Сущности собираются в таблицу с проверкой обязательных реквизитов. Пока хотя бы одно поле не заполнено, кнопка генерации заблокирована.",
    iconClassName: "bg-emerald-50 text-emerald-600",
    glowClassName: "group-hover:bg-emerald-500/10",
    points: ["Подсветка проблемных ячеек", "Правка прямо в таблице"],
  },
  {
    icon: AlertTriangle,
    title: "AI-анализ рисков",
    description:
      "Загрузите договор — Алетейя разберёт его по пунктам, покажет отсутствующую ответственность и неточные формулировки с привязкой к абзацам.",
    iconClassName: "bg-amber-50 text-amber-600",
    glowClassName: "group-hover:bg-amber-500/10",
    points: ["Риски по пунктам договора", "Готовые формулировки правок"],
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-medium uppercase tracking-wider text-indigo-600">
          Возможности
        </span>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
          Три вещи, которые забирают время
        </h2>
        <p className="mt-3 text-base text-zinc-500">
          И которые Алетейя берёт на себя целиком.
        </p>
      </Reveal>

      <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
        {FEATURES.map((feature, index) => (
          <Reveal key={feature.title} delay={index * 0.1}>
            <motion.article
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-xl"
            >
              {/* Свечение при наведении */}
              <span
                aria-hidden
                className={cn(
                  "pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-transparent blur-2xl transition-colors duration-500",
                  feature.glowClassName
                )}
              />

              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
                  feature.iconClassName
                )}
              >
                <feature.icon className="h-5 w-5" />
              </div>

              <h3 className="mt-5 text-base font-semibold text-zinc-900">
                {feature.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-500">
                {feature.description}
              </p>

              <ul className="mt-5 flex flex-col gap-2 border-t border-zinc-100 pt-4">
                {feature.points.map((point) => (
                  <li
                    key={point}
                    className="flex items-center gap-2 text-xs text-zinc-500"
                  >
                    <span className="h-1 w-1 shrink-0 rounded-full bg-zinc-300" />
                    {point}
                  </li>
                ))}
              </ul>
            </motion.article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
