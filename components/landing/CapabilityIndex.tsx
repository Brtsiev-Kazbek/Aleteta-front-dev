"use client";

import { useState } from "react";
import { motion } from "framer-motion";

import { Reveal } from "@/components/landing/Reveal";
import { SectionHeading } from "@/components/landing/SectionHeading";
import { cn } from "@/lib/utils";

interface Group {
  id: string;
  title: string;
  items: { name: string; note: string }[];
}

/** Полный перечень того, что умеет продукт, — без пропусков. */
const GROUPS: Group[] = [
  {
    id: "cases",
    title: "Дела и объекты",
    items: [
      { name: "Дела со статусами и тегами", note: "в работе, сбор данных, активно" },
      { name: "Обзор дела", note: "готовность в %, статистика, что требует внимания" },
      { name: "Лента активности", note: "кто и что менял по делу" },
      { name: "Объекты трёх встроенных типов", note: "недвижимость, контрагенты, физлица" },
      { name: "Свои типы объектов", note: "произвольные реквизиты и признак обязательности" },
      { name: "Инлайн-правка в таблице", note: "без отдельных форм и модальных окон" },
      { name: "Дублирование и удаление объектов", note: "прямо из строки таблицы" },
    ],
  },
  {
    id: "validation",
    title: "Контроль данных",
    items: [
      { name: "Проверка обязательных полей", note: "пакет не соберётся с пробелом" },
      { name: "Проверка форматов", note: "ИНН, КПП, СНИЛС, паспорт, кадастровый номер" },
      { name: "Подсветка проблемных ячеек", note: "с причиной в подсказке" },
      { name: "Переход к первой ошибке", note: "кнопка «Исправить»" },
      { name: "Счётчик готовности", note: "сколько объектов готово к генерации" },
      { name: "Пометка неуверенных значений", note: "извлечённое из скана требует подтверждения" },
    ],
  },
  {
    id: "documents",
    title: "Документы",
    items: [
      { name: "Пакет по шаблонам", note: "все объекты дела одним действием" },
      { name: "Документ без шаблона", note: "составляется с нуля по описанию" },
      { name: "Генерация по нескольким делам", note: "один запрос — документ в каждом деле" },
      { name: "Загрузка файлов", note: "перетаскиванием, PDF, DOCX, сканы" },
      { name: "Распознавание текста", note: "включая сканы и фотографии" },
      { name: "Извлечение реквизитов", note: "заполнение пустых полей из файлов" },
      { name: "Библиотека шаблонов", note: "свои шаблоны по типам объектов" },
      { name: "Экспорт", note: "DOCX и архив пакетом" },
    ],
  },
  {
    id: "analysis",
    title: "Анализ и право",
    items: [
      { name: "Разбор договора по пунктам", note: "риски с привязкой к абзацу" },
      { name: "Проверка пачкой", note: "несколько документов за один раз" },
      { name: "Судебная практика по пункту", note: "позиции судов по спорному условию" },
      { name: "Готовые формулировки правок", note: "к каждому замечанию" },
      { name: "Исправленная редакция", note: "формируется по итогам разбора" },
      { name: "Ассистент по материалам дела", note: "ответы со ссылкой на пункт и страницу" },
    ],
  },
];

export function CapabilityIndex() {
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  const total = GROUPS.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <section id="capabilities" className="bg-bg">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <SectionHeading
          index="07"
          eyebrow="Полный перечень"
          title={`${total} возможностей — весь цикл работы с документами`}
          description="Ничего из перечисленного не требует отдельной настройки или доработки."
        />

        <div className="mt-12 grid grid-cols-1 gap-px border border-line bg-surface-3 md:grid-cols-2 lg:grid-cols-4">
          {GROUPS.map((group, groupIndex) => {
            const isDimmed = activeGroup !== null && activeGroup !== group.id;

            return (
              <Reveal key={group.id} delay={groupIndex * 0.07}>
                <motion.div
                  onMouseEnter={() => setActiveGroup(group.id)}
                  onMouseLeave={() => setActiveGroup(null)}
                  animate={{ opacity: isDimmed ? 0.45 : 1 }}
                  transition={{ duration: 0.25 }}
                  className="flex h-full flex-col bg-surface p-6"
                >
                  <div className="flex items-baseline gap-2.5">
                    <span className="font-mono text-label tabular-nums text-brand">
                      {String(groupIndex + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-body font-medium text-fg">
                      {group.title}
                    </h3>
                    <span className="ml-auto font-mono text-label tabular-nums text-fg-ghost">
                      {group.items.length}
                    </span>
                  </div>

                  <ul className="mt-5 flex flex-col divide-y divide-line-soft border-t border-line-soft">
                    {group.items.map((item) => (
                      <li key={item.name} className="group/item py-3">
                        <span
                          className={cn(
                            "block text-body leading-snug transition-colors",
                            "text-fg group-hover/item:text-brand-strong"
                          )}
                        >
                          {item.name}
                        </span>
                        <span className="mt-0.5 block text-label leading-snug text-fg-faint">
                          {item.note}
                        </span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
