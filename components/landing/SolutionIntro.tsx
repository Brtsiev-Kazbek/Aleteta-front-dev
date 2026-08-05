"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Reveal } from "@/components/landing/Reveal";
import { SectionHeading } from "@/components/landing/SectionHeading";

const PILLARS = [
  {
    id: "case",
    title: "Единица работы — дело, а не файл",
    text: "У дела есть документы, объекты, реквизиты и история изменений. Контекст не теряется между задачами и не требует повторных объяснений.",
  },
  {
    id: "check",
    title: "Проверка выполняется до генерации",
    text: "Пакет не соберётся, пока в обязательных реквизитах есть пробел или несоответствие формату. Ошибка видна до подачи, а не после.",
  },
  {
    id: "batch",
    title: "Документы формируются пачкой",
    text: "Реквизиты подставляются из карточек объектов по вашим шаблонам. Значения не сочиняются заново — поэтому в них не появляется расхождений.",
  },
];

export function SolutionIntro() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <SectionHeading
              eyebrow="Решение"
              title="Алетейя — рабочее пространство для дел и документов"
              description="Не чат с нейросетью и не облачная папка. Среда, где документы, реквизиты и проверки связаны между собой."
            />

            <Reveal delay={0.2} className="mt-8">
              <Link
                href="#features"
                className="group inline-flex items-center gap-2 text-sm font-medium text-stone-900"
              >
                <span className="border-b border-stone-300 pb-0.5 transition-colors group-hover:border-stone-900">
                  Посмотреть возможности
                </span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </Reveal>
          </div>

          <div className="lg:col-span-7">
            <div className="flex flex-col divide-y divide-stone-200 border-y border-stone-200">
              {PILLARS.map((pillar, index) => (
                <Reveal key={pillar.id} delay={index * 0.09}>
                  <div className="group flex gap-6 py-7 transition-colors">
                    <span className="shrink-0 font-mono text-[11px] tabular-nums text-stone-300 transition-colors group-hover:text-violet-600">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <div className="flex flex-col">
                      <h3 className="text-base font-medium text-stone-900">
                        {pillar.title}
                      </h3>
                      <p className="mt-2 max-w-lg text-sm leading-relaxed text-stone-600">
                        {pillar.text}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
