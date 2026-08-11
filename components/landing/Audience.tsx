"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { Reveal } from "@/components/landing/Reveal";
import { SectionHeading } from "@/components/landing/SectionHeading";
import { cn } from "@/lib/utils";

interface Segment {
  id: string;
  role: string;
  headline: string;
  today: string;
  tasks: string[];
}

const SEGMENTS: Segment[] = [
  {
    id: "lawyer",
    role: "Юристы и юридические фирмы",
    headline: "Сделки с недвижимостью, где объектов десятки",
    today:
      "Сорок участков — сорок договоров, актов и заявлений. Реквизиты переносятся из выписки в шаблон вручную.",
    tasks: [
      "Пакет документов на все объекты сделки",
      "Контроль реквизитов до подачи в Росреестр",
      "Разбор входящего договора по пунктам",
      "Поиск формулировки по материалам дела",
    ],
  },
  {
    id: "cadastral",
    role: "Кадастровые инженеры и риелторы",
    headline: "Межевание, постановка на учёт, купля-продажа",
    today:
      "Выписки ЕГРН, межевые планы, схемы. Данные из них растекаются по десятку форм.",
    tasks: [
      "Кадастровый номер, площадь и ВРИ из выписки",
      "Блокировка генерации при пустом назначении земель",
      "Единая карточка объекта вместо папки сканов",
      "Свои типы: здания, помещения, сооружения",
    ],
  },
  {
    id: "hr",
    role: "Кадровые службы",
    headline: "Приём, перевод и увольнение потоком",
    today:
      "Паспорт, СНИЛС и ИНН из сканов переписываются в трудовой договор, приказ и согласие на обработку данных.",
    tasks: [
      "Реквизиты сотрудника из скана паспорта",
      "Комплект кадровых документов на группу",
      "Проверка полноты данных до подписания",
      "Хранение по сотруднику, а не по папкам",
    ],
  },
  {
    id: "business",
    role: "Предприниматели и бухгалтеры",
    headline: "Договоры с контрагентами и первичные документы",
    today:
      "ИНН и КПП из устава, реквизиты из карточки, договор из прошлогоднего шаблона с чужим наименованием внутри.",
    tasks: [
      "Карточка контрагента с проверкой ИНН и КПП",
      "Договоры и акты по единому шаблону",
      "Анализ входящего договора до подписания",
      "Типовые документы сразу по всем контрагентам",
    ],
  },
  {
    id: "gov",
    role: "Муниципалитеты и заказчики",
    headline: "Программы благоустройства, работа с подрядчиками",
    today:
      "Документация подрядчиков собирается по почте, комплектность проверяется вручную.",
    tasks: [
      "Проверка комплектности документов подрядчика",
      "Единый реестр объектов программы",
      "Уведомления сразу по всем контрактам",
      "История изменений по каждому объекту",
    ],
  },
  {
    id: "education",
    role: "Кафедры и учебные заведения",
    headline: "Проверка работ на соответствие требованиям",
    today:
      "Методические указания в одном файле, тридцать работ — в другом. Сверка идёт вручную по каждой.",
    tasks: [
      "Разбор работы по пунктам требований",
      "Замечания с привязкой к абзацу",
      "Реестр работ и их статусов",
      "Типовые рецензии по итогам проверки",
    ],
  },
];

export function Audience() {
  const [activeId, setActiveId] = useState(SEGMENTS[0]?.id ?? "");
  const active = SEGMENTS.find((item) => item.id === activeId) ?? SEGMENTS[0];

  if (!active) return null;

  return (
    <section id="audience" className="bg-stone-50">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <SectionHeading
          index="09"
          eyebrow="Кому подходит"
          title="Везде, где документов много, а ошибаться нельзя"
          description="Выберите роль — покажем, что именно меняется в работе."
        />

        <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Роли */}
          <Reveal className="lg:col-span-4">
            <div className="flex flex-col border-l border-line">
              {SEGMENTS.map((segment, index) => {
                const isActive = segment.id === activeId;

                return (
                  <button
                    key={segment.id}
                    type="button"
                    onClick={() => setActiveId(segment.id)}
                    className="relative py-3.5 pl-5 pr-2 text-left"
                  >
                    <span
                      className={cn(
                        "absolute -left-px top-0 h-full w-px transition-colors",
                        isActive ? "bg-stone-900" : "bg-transparent"
                      )}
                    />

                    <span className="flex items-baseline gap-3">
                      <span
                        className={cn(
                          "font-mono text-[10px] tabular-nums transition-colors",
                          isActive ? "text-violet-600" : "text-fg-ghost"
                        )}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span
                        className={cn(
                          "text-sm transition-colors",
                          isActive
                            ? "font-medium text-fg"
                            : "text-fg-subtle hover:text-fg-muted"
                        )}
                      >
                        {segment.role}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </Reveal>

          {/* Детали */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
              >
                <h3 className="text-xl font-medium leading-snug tracking-[-0.01em] text-fg">
                  {active.headline}
                </h3>

                <div className="mt-6 border-l-2 border-line pl-5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-fg-faint">
                    Как сейчас
                  </span>
                  <p className="mt-2 text-sm leading-relaxed text-fg-soft">
                    {active.today}
                  </p>
                </div>

                <div className="mt-8">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-violet-600">
                    Что делает Алетейя
                  </span>

                  <ul className="mt-3 grid grid-cols-1 divide-y divide-line-soft border-y border-line-soft sm:grid-cols-2 sm:divide-y-0">
                    {active.tasks.map((task) => (
                      <li
                        key={task}
                        className="flex items-start gap-3 py-3 sm:py-3.5"
                      >
                        <span className="mt-2 h-px w-3 shrink-0 bg-stone-300" />
                        <span className="text-sm leading-snug text-fg-muted">
                          {task}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
