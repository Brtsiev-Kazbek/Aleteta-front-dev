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
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-6 py-20">
        {/* Показатели */}
        <Reveal>
          <div className="grid grid-cols-1 border-y border-stone-200 sm:grid-cols-3">
            {FACTS.map((fact, index) => (
              <div
                key={fact.label}
                className={
                  index < FACTS.length - 1
                    ? "border-b border-stone-200 px-6 py-8 sm:border-b-0 sm:border-r"
                    : "px-6 py-8"
                }
              >
                <CountUp
                  to={fact.value}
                  className="font-mono text-4xl tabular-nums tracking-tight text-stone-900"
                />
                <p className="mt-3 text-sm text-stone-700">{fact.label}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-stone-400">
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

        <div className="mt-12 grid grid-cols-1 gap-px bg-stone-200 md:grid-cols-3">
          {TESTIMONIALS.map((testimonial, index) => (
            <Reveal key={testimonial.id} delay={index * 0.08}>
              <figure className="flex h-full flex-col bg-stone-50 p-7">
                <blockquote className="flex-1 text-sm leading-relaxed text-stone-500">
                  {testimonial.quote}
                </blockquote>

                <figcaption className="mt-6 border-t border-stone-200 pt-4">
                  <span className="block text-sm text-stone-600">
                    {testimonial.name}
                  </span>
                  <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.12em] text-stone-400">
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
