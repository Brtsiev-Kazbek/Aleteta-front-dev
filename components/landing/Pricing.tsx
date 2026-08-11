"use client";

import Link from "next/link";

import { Reveal } from "@/components/landing/Reveal";
import { SectionHeading } from "@/components/landing/SectionHeading";
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

export function Pricing() {
  return (
    <section id="pricing" className="bg-bg">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <SectionHeading
          index="12"
          eyebrow="Тарифы"
          title="Начните бесплатно, платите когда увидите пользу"
          description="Без привязки карты на старте. Отказаться можно в любой момент."
        />

        <div className="mt-12 grid grid-cols-1 gap-px border border-line bg-surface-3 lg:grid-cols-3">
          {PLANS.map((plan, index) => (
            <Reveal key={plan.id} delay={index * 0.08}>
              <div
                className={cn(
                  /*
                    Тарифы сложены в сетку без промежутков, поэтому подъём
                    карточки здесь неуместен — он разорвал бы полотно. Отклик
                    даём заливкой: колонка под курсором чуть светлеет.
                  */
                  "group relative flex h-full flex-col p-7 transition-colors lg:p-8",
                  plan.highlighted
                    ? "bg-inverse"
                    : "bg-surface hover:bg-bg/80"
                )}
              >
                {plan.highlighted && (
                  <span
                    aria-hidden
                    className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500 to-transparent"
                  />
                )}
                <div className="flex items-baseline justify-between gap-3">
                  <h3
                    className={cn(
                      "text-sm font-medium",
                      plan.highlighted ? "text-inverse-fg" : "text-fg"
                    )}
                  >
                    {plan.name}
                  </h3>

                  {plan.highlighted && (
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-violet-400">
                      Рекомендуем
                    </span>
                  )}
                </div>

                <p
                  className={cn(
                    "mt-1.5 text-xs",
                    plan.highlighted ? "text-fg-faint" : "text-fg-subtle"
                  )}
                >
                  {plan.description}
                </p>

                <div className="mt-7 flex items-baseline gap-2">
                  <span
                    className={cn(
                      "font-mono text-3xl tracking-tight",
                      plan.highlighted ? "text-inverse-fg" : "text-fg"
                    )}
                  >
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span
                      className={cn(
                        "text-xs",
                        plan.highlighted ? "text-fg-subtle" : "text-fg-faint"
                      )}
                    >
                      {plan.period}
                    </span>
                  )}
                </div>

                <ul
                  className={cn(
                    "mt-7 flex flex-1 flex-col divide-y border-y",
                    plan.highlighted
                      ? "divide-inverse-line border-inverse-line"
                      : "divide-line-soft border-line-soft"
                  )}
                >
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className={cn(
                        "py-2.5 text-sm",
                        plan.highlighted ? "text-fg-ghost" : "text-fg-muted"
                      )}
                    >
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/auth/register"
                  className={cn(
                    "mt-7 inline-flex h-11 items-center justify-center rounded-md text-sm font-medium transition-colors",
                    plan.highlighted
                      ? "bg-surface text-fg hover:bg-surface-2"
                      : "border border-line text-fg hover:bg-bg"
                  )}
                >
                  {plan.cta}
                </Link>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.25}>
          <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.12em] text-fg-faint">
            Данные дела можно выгрузить и удалить в любой момент
          </p>
        </Reveal>
      </div>
    </section>
  );
}
