"use client";

import { Reveal } from "@/components/landing/Reveal";
import { SectionHeading } from "@/components/landing/SectionHeading";

interface Pain {
  metric: string;
  unit: string;
  title: string;
  text: string;
}

const PAINS: Pain[] = [
  {
    metric: "×10",
    unit: "повторов",
    title: "Один реквизит переносится вручную во все документы",
    text: "ИНН контрагента идёт в договор, затем в акт, затем в счёт. Паспорт сотрудника — в трудовой договор, приказ и согласие. Каждый перенос — отдельный шанс ошибиться.",
  },
  {
    metric: "7",
    unit: "дней",
    title: "Ошибка всплывает уже у принимающей стороны",
    text: "Пропущенный реквизит замечает регистратор, инспектор или контрагент. Об этом становится известно через неделю, а не в момент подготовки.",
  },
  {
    metric: "80",
    unit: "страниц",
    title: "Нужный пункт ищется листанием",
    text: "Условие об ответственности где-то в договоре. Поиск по тексту находит слово, но не формулировку целиком и не её последствия.",
  },
  {
    metric: "40",
    unit: "комплектов",
    title: "Механическая работа занимает больше времени, чем сама задача",
    text: "Сорок объектов, контрагентов или сотрудников — сорок комплектов документов, в которых нет ни одного профессионального решения.",
  },
];

export function ProblemSection() {
  return (
    <section className="bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <SectionHeading
          index="01"
          eyebrow="Проблема"
          title="Документы отнимают больше времени, чем работа с делом"
          description="Не потому, что задача сложная. Потому, что она повторяется."
        />

        <div className="mt-12 grid grid-cols-1 border-t border-line md:grid-cols-2">
          {PAINS.map((pain, index) => (
            <Reveal
              key={pain.title}
              delay={index * 0.07}
              className={
                index % 2 === 0
                  ? "border-b border-line md:border-r"
                  : "border-b border-line"
              }
            >
              <div className="flex h-full flex-col p-6 lg:p-8">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-heading tabular-nums text-fg">
                    {pain.metric}
                  </span>
                  <span className="font-mono text-label uppercase text-fg-faint">
                    {pain.unit}
                  </span>
                </div>

                <h3 className="mt-4 text-body-lg font-medium leading-snug text-fg">
                  {pain.title}
                </h3>
                <p className="mt-2.5 text-body leading-relaxed text-fg-soft">
                  {pain.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
