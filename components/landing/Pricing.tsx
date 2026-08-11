"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";

import { SectionShell } from "@/components/landing/SectionShell";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  ⚠️  ЦЕНЫ ПРЕДВАРИТЕЛЬНЫЕ — подставьте свои перед публикацией.      */
/*  Не указывайте зачёркнутую «старую» цену, по которой не продавали:  */
/*  это нарушение ст. 10 Закона «О защите прав потребителей».          */
/* ------------------------------------------------------------------ */

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  highlighted: boolean;
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Знакомство",
    price: "0 ₽",
    period: "",
    description: "Проверить на своих документах",
    features: [
      "Одно дело",
      "До 10 объектов",
      "Генерация пакета по шаблонам",
      "Контроль обязательных реквизитов",
      "20 обращений к ассистенту в месяц",
    ],
    cta: "Начать бесплатно",
    highlighted: false,
  },
  {
    id: "pro",
    name: "Практика",
    price: "2 900 ₽",
    period: "в месяц",
    description: "Частная практика и небольшая команда",
    features: [
      "Дела и объекты без ограничений",
      "Свои типы объектов и шаблоны",
      "Ассистент без лимитов",
      "Разбор договоров по пунктам",
      "Генерация сразу по нескольким делам",
      "Экспорт в DOCX и PDF",
    ],
    cta: "Получить ранний доступ",
    highlighted: true,
  },
  {
    id: "team",
    name: "Организация",
    price: "по запросу",
    period: "",
    description: "Фирмы, отделы и учреждения",
    features: [
      "Всё из тарифа «Практика»",
      "Совместная работа над делами",
      "Роли и права доступа",
      "Журнал действий по делу",
      "Приоритетная поддержка",
    ],
    cta: "Обсудить условия",
    highlighted: false,
  },
];

/**
 * Тарифы.
 *
 * Средний тариф тёмный и приподнят над соседями — приём столь же старый, сколь
 * и надёжный: глазу нужно указать, что выбрать, иначе выбор из трёх равных
 * откладывается навсегда.
 *
 * Карточки разнесены промежутком, а не сложены в бесшовное полотно: полотно
 * читается как таблица, где тарифы сравнивают построчно, а сравнивать тут
 * нечего — наборы возможностей разной длины.
 */
export function Pricing() {
  const reduceMotion = useReducedMotion();

  return (
    <SectionShell
      id="pricing"
      eyebrow="Тарифы"
      title="Начните бесплатно, платите когда увидите пользу"
      lead="Без привязки карты на старте. Отказаться можно в любой момент."
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-center">
        {PLANS.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={reduceMotion ? undefined : { opacity: 0, y: 24 }}
            whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{
              duration: 0.55,
              delay: index * 0.08,
              ease: [0.22, 0.61, 0.36, 1],
            }}
            className={cn(
              "relative flex h-full flex-col overflow-hidden rounded-3xl p-8",
              plan.highlighted
                ? "border border-inverse-line bg-inverse lg:py-11 lg:shadow-[0_40px_80px_-50px_rgb(var(--fg)/0.6)]"
                : "border border-line bg-surface"
            )}
          >
            {plan.highlighted && (
              <div
                aria-hidden
                className="mesh-dark pointer-events-none absolute inset-0 opacity-70"
              />
            )}

            <div className="relative flex items-baseline justify-between gap-3">
              <h3
                className={cn(
                  "text-title-sm font-medium",
                  plan.highlighted ? "text-inverse-fg" : "text-fg"
                )}
              >
                {plan.name}
              </h3>

              {plan.highlighted && (
                <span className="rounded-full bg-brand px-2.5 py-1 font-mono text-label uppercase text-brand-fg">
                  Рекомендуем
                </span>
              )}
            </div>

            <p
              className={cn(
                "relative mt-2 text-body",
                plan.highlighted ? "text-inverse-fg/55" : "text-fg-subtle"
              )}
            >
              {plan.description}
            </p>

            <div className="relative mt-8 flex items-baseline gap-2">
              <span
                className={cn(
                  "text-display font-medium tabular-nums",
                  plan.highlighted ? "text-inverse-fg" : "text-fg"
                )}
              >
                {plan.price}
              </span>
              {plan.period && (
                <span
                  className={cn(
                    "text-body",
                    plan.highlighted ? "text-inverse-fg/45" : "text-fg-faint"
                  )}
                >
                  {plan.period}
                </span>
              )}
            </div>

            <Link
              href="/auth/register"
              className={cn(
                "relative mt-7 inline-flex h-11 items-center justify-center rounded-full text-body font-medium transition-colors",
                plan.highlighted
                  ? "bg-inverse-fg text-inverse hover:bg-inverse-fg/90"
                  : "border border-line bg-bg text-fg hover:bg-surface-2"
              )}
            >
              {plan.cta}
            </Link>

            <ul className="relative mt-8 flex flex-1 flex-col gap-3">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5">
                  <Check
                    className={cn(
                      "mt-0.5 h-3.5 w-3.5 shrink-0",
                      plan.highlighted ? "text-brand-line" : "text-brand"
                    )}
                    strokeWidth={2.5}
                  />
                  <span
                    className={cn(
                      "text-body leading-snug",
                      plan.highlighted ? "text-inverse-fg/70" : "text-fg-muted"
                    )}
                  >
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      <p className="mt-8 text-center text-caption text-fg-faint">
        Данные дела можно выгрузить и удалить в любой момент
      </p>
    </SectionShell>
  );
}
