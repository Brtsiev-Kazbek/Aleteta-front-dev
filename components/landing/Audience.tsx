"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { SectionShell } from "@/components/landing/SectionShell";
import { cn } from "@/lib/utils";

interface Segment {
  id: string;
  /** Полное название роли — в заголовке карточки. */
  role: string;
  /** Короткое — на вкладке: шесть полных названий не помещаются в строку. */
  short: string;
  headline: string;
  today: string;
  tasks: string[];
}

const SEGMENTS: Segment[] = [
  {
    id: "lawyer",
    role: "Юристы и юридические фирмы",
    short: "Юристы",
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
    short: "Кадастр и риелторы",
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
    short: "Кадры",
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
    short: "Бизнес и бухгалтерия",
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
    short: "Муниципалитеты",
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
    short: "Учебные заведения",
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

/**
 * Кому подходит.
 *
 * Продукт для шести разных профессий рискует не подойти никому: человек читает
 * общие слова и не узнаёт своей работы. Поэтому здесь не список отраслей, а
 * переключатель: выбрал роль — увидел собственный вторник.
 *
 * Внутри каждой роли сначала «как сейчас» и только потом «что делает Алетейя».
 * Порядок обратный привычному и выбран нарочно: пока человек не узнал свою
 * боль, обещание её снять читается как реклама.
 */
export function Audience() {
  const reduceMotion = useReducedMotion();
  const [activeId, setActiveId] = useState(SEGMENTS[0]?.id ?? "");
  const active = SEGMENTS.find((item) => item.id === activeId) ?? SEGMENTS[0];

  if (!active) return null;

  return (
    <SectionShell
      id="audience"
      tone="muted"
      eyebrow="Кому подходит"
      title="Везде, где документов много, а ошибаться нельзя"
      lead="Выберите роль — покажем, что именно меняется в работе."
    >
      {/* Роли */}
      <div className="-mx-6 overflow-x-auto px-6 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="mx-auto flex w-max gap-1 rounded-full border border-line bg-surface p-1">
          {SEGMENTS.map((segment) => {
            const isActive = segment.id === activeId;

            return (
              <button
                key={segment.id}
                type="button"
                aria-current={isActive}
                onClick={() => setActiveId(segment.id)}
                className={cn(
                  "relative shrink-0 rounded-full px-4 py-2 text-body transition-colors",
                  isActive ? "text-inverse-fg" : "text-fg-subtle hover:text-fg"
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="audience-tab"
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 420, damping: 38 }
                    }
                    className="absolute inset-0 rounded-full bg-inverse"
                  />
                )}
                <span className="relative whitespace-nowrap">
                  {segment.short}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Детали */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active.id}
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
          transition={{ duration: 0.28 }}
          className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-12"
        >
          <div className="rounded-3xl border border-line bg-surface p-7 lg:col-span-5">
            <span className="font-mono text-label uppercase text-fg-faint">
              {active.role} · как сейчас
            </span>
            <h3 className="mt-4 text-title font-medium leading-snug text-fg">
              {active.headline}
            </h3>
            <p className="mt-4 text-body leading-relaxed text-fg-subtle">
              {active.today}
            </p>
          </div>

          <div className="rounded-3xl border border-line bg-surface p-7 lg:col-span-7">
            <span className="font-mono text-label uppercase text-brand">
              Что делает Алетейя
            </span>

            <ul className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
              {active.tasks.map((task) => (
                <li key={task} className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-[0.4375rem] h-1 w-1 shrink-0 rounded-full bg-brand"
                  />
                  <span className="text-body leading-snug text-fg-muted">
                    {task}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </AnimatePresence>
    </SectionShell>
  );
}
