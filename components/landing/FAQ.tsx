"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

import { SectionShell } from "@/components/landing/SectionShell";
import { cn } from "@/lib/utils";

interface QA {
  id: string;
  question: string;
  answer: string;
}

const ITEMS: QA[] = [
  {
    id: "q1",
    question: "Что именно я получаю?",
    answer:
      "Рабочее пространство, где у каждого дела есть свои документы и объекты. Реквизиты объектов проверяются по форматам, а пакет документов готовится по вашим шаблонам одним действием. Плюс AI-ассистент, который отвечает по материалам конкретного дела, и разбор договоров по пунктам.",
  },
  {
    id: "q2",
    question: "Чем это отличается от обычного чата с нейросетью?",
    answer:
      "Чат не помнит ваши дела и не проверяет реквизиты. Алетейя хранит контекст: какие файлы загружены, какие данные из них извлечены, где пробел. И главное — генерация пакета идёт по вашим шаблонам и опирается на данные, которые вы подтвердили, а не «сочиняется» заново каждый раз. Поэтому в реквизитах не бывает выдуманных значений.",
  },
  {
    id: "q3",
    question: "Насколько точна проверка? Можно ли доверять результату?",
    answer:
      "Проверка обязательных полей и форматов (кадастровый номер, ИНН, КПП, СНИЛС, паспорт) выполняется по строгим правилам, а не моделью — здесь ошибок нет по определению. Извлечение данных из сканов делает модель, поэтому найденные ею значения помечаются как требующие подтверждения. Итоговый документ всегда остаётся на вашей проверке: Алетейя убирает рутину, а не ответственность.",
  },
  {
    id: "q4",
    question: "Что происходит с моими документами?",
    answer:
      "Файлы хранятся в вашем аккаунте. Доступ есть у вас и у тех, кому вы его дали. Дело вместе со всеми файлами удаляется по вашей команде, выгрузить материалы можно в любой момент.",
  },
  {
    id: "q5",
    question: "Нужно ли что-то устанавливать?",
    answer:
      "Нет. Алетейя работает в браузере. Достаточно завести дело и загрузить первые файлы — настройка не требуется.",
  },
  {
    id: "q6",
    question: "А если мой тип объекта не предусмотрен?",
    answer:
      "Создайте свой. Вы задаёте название типа и произвольный список реквизитов, отмечаете, какие из них обязательны. Дальше они работают наравне со встроенными: становятся колонками таблицы и проверяются перед генерацией.",
  },
  {
    id: "q7",
    question: "Как начать?",
    answer:
      "Заведите дело, загрузите документы, проверьте таблицу объектов. Бесплатный тариф не требует карты — можно попробовать на своих реальных файлах и решить, подходит ли.",
  },
];

/**
 * Вопросы.
 *
 * Раскрыт по умолчанию первый: закрытый список из семи строк не читается как
 * ответы, он читается как оглавление, и человек его пролистывает.
 *
 * Каждый вопрос — отдельная карточка, а не строка в общем списке с разделителями.
 * Так открытый ответ виден как отдельный предмет, а не как разъехавшаяся таблица.
 */
export function FAQ() {
  const [openId, setOpenId] = useState<string | null>(ITEMS[0]?.id ?? null);

  return (
    <SectionShell id="faq" tone="muted" eyebrow="Вопросы" title="Частые вопросы">
      <div className="mx-auto flex max-w-3xl flex-col gap-2.5">
        {ITEMS.map((item) => {
          const isOpen = openId === item.id;

          return (
            <div
              key={item.id}
              className={cn(
                "overflow-hidden rounded-2xl border bg-surface transition-colors",
                isOpen ? "border-line-strong" : "border-line hover:border-line-strong"
              )}
            >
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setOpenId(isOpen ? null : item.id)}
                className="flex w-full items-start gap-4 px-6 py-5 text-left"
              >
                <span
                  className={cn(
                    "flex-1 text-body-lg transition-colors",
                    isOpen ? "font-medium text-fg" : "text-fg-muted"
                  )}
                >
                  {item.question}
                </span>

                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-0.5 shrink-0"
                >
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition-colors",
                      isOpen ? "text-fg" : "text-fg-ghost"
                    )}
                  />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                  >
                    <p className="px-6 pb-6 text-body leading-relaxed text-fg-subtle">
                      {item.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </SectionShell>
  );
}
