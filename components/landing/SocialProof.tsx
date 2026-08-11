"use client";

import { CountUp } from "@/components/landing/CountUp";
import { Reveal } from "@/components/landing/Reveal";
import { SectionHeading } from "@/components/landing/SectionHeading";

/* ------------------------------------------------------------------ */
/*  ⚠️  ЗАПОЛНИТЕ ПЕРЕД ПУБЛИКАЦИЕЙ                                    */
/*                                                                     */
/*  Ниже — ШАБЛОНЫ, а не настоящие отзывы. Публиковать выдуманные      */
/*  цитаты от лица несуществующих людей нельзя: это недобросовестная   */
/*  реклама (ст. 5 ФЗ «О рекламе»).                                    */
/*                                                                     */
/*  1. Соберите отзывы у пилотных пользователей.                       */
/*  2. Возьмите письменное согласие на публикацию имени и должности.   */
/*  3. Замените содержимое TESTIMONIALS.                               */
/*  4. Если отзывов нет — удалите блок, оставив только показатели.     */
/* ------------------------------------------------------------------ */

interface Testimonial {
  id: string;
  quote: string;
  name: string;
  role: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: "t1",
    quote:
      "[Шаблон] Цитата о том, сколько времени занимает подготовка пакета документов сейчас.",
    name: "Имя Фамилия",
    role: "должность, организация",
  },
  {
    id: "t2",
    quote:
      "[Шаблон] Цитата о том, как контроль реквизитов помог избежать приостановки регистрации.",
    name: "Имя Фамилия",
    role: "должность, организация",
  },
  {
    id: "t3",
    quote:
      "[Шаблон] Цитата о работе ассистента и разборе договора по пунктам.",
    name: "Имя Фамилия",
    role: "должность, организация",
  },
];

/** Проверяемые характеристики продукта вместо выдуманных метрик. */
const FACTS = [
  { value: 3, label: "типа объектов из коробки", hint: "плюс собственные" },
  { value: 7, label: "шаблонов документов", hint: "список расширяется" },
  { value: 0, label: "расхождений в реквизитах", hint: "проверка до генерации" },
];

export function SocialProof() {
  return (
    <section className="bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-20">
        {/* Показатели */}
        <Reveal>
          <div className="grid grid-cols-1 border-y border-line sm:grid-cols-3">
            {FACTS.map((fact, index) => (
              <div
                key={fact.label}
                className={
                  index < FACTS.length - 1
                    ? "border-b border-line px-6 py-8 sm:border-b-0 sm:border-r"
                    : "px-6 py-8"
                }
              >
                <CountUp
                  to={fact.value}
                  className="font-mono text-4xl tabular-nums tracking-tight text-fg"
                />
                <p className="mt-3 text-sm text-fg-muted">{fact.label}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-fg-faint">
                  {fact.hint}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        <SectionHeading
          className="mt-20"
          index="11"
          eyebrow="Отзывы"
          title="Что говорят пользователи"
          description="Продукт в раннем доступе — раздел заполняется по мере пилотных внедрений."
        />

        <div className="mt-12 grid grid-cols-1 gap-px bg-surface-3 md:grid-cols-3">
          {TESTIMONIALS.map((testimonial, index) => (
            <Reveal key={testimonial.id} delay={index * 0.08}>
              <figure className="flex h-full flex-col bg-bg p-7">
                <blockquote className="flex-1 text-sm leading-relaxed text-fg-subtle">
                  {testimonial.quote}
                </blockquote>

                <figcaption className="mt-6 border-t border-line pt-4">
                  <span className="block text-sm text-fg-soft">
                    {testimonial.name}
                  </span>
                  <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.12em] text-fg-faint">
                    {testimonial.role}
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
