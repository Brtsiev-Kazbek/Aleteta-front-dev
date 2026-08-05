"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

import { Reveal } from "@/components/landing/Reveal";
import { SectionHeading } from "@/components/landing/SectionHeading";
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
      "Рабочее пространство, где у каждого дела есть свои документы и объекты. Реквизиты объектов проверяются автоматически, а пакет документов собирается по вашим шаблонам одним действием. Плюс AI-ассистент, который отвечает по материалам конкретного дела, и разбор договоров по пунктам.",
  },
  {
    id: "q2",
    question: "Чем это отличается от обычного чата с нейросетью?",
    answer:
      "Чат не помнит ваши дела и не проверяет реквизиты. Алетейя хранит контекст: какие файлы загружены, какие данные из них извлечены, где пробел. И главное — генерация пакета идёт по вашим шаблонам с подстановкой проверенных данных, а не «сочиняется» заново каждый раз. Поэтому в реквизитах не бывает выдуманных значений.",
  },
  {
    id: "q3",
    question: "Насколько точна проверка? Можно ли доверять результату?",
    answer:
      "Проверка обязательных полей и форматов (кадастровый номер, ИНН, КПП, СНИЛС, паспорт) выполняется по строгим правилам, а не моделью — здесь ошибок нет по определению. Извлечение данных из сканов делает модель, поэтому подставленные значения помечаются как требующие подтверждения. Итоговый документ всегда остаётся на вашей проверке: Алетейя убирает рутину, а не ответственность.",
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
      "Создайте свой. Вы задаёте название типа и произвольный список реквизитов, отмечаете, какие из них обязательны. Дальше они работают наравне со встроенными: становятся колонками таблицы, проверяются перед генерацией и подставляются в документы.",
  },
  {
    id: "q7",
    question: "Как начать?",
    answer:
      "Заведите дело, загрузите документы, проверьте таблицу объектов. Бесплатный тариф не требует карты — можно попробовать на своих реальных файлах и решить, подходит ли.",
  },
];

export function FAQ() {
  const [openId, setOpenId] = useState<string | null>(ITEMS[0]?.id ?? null);

  return (
    <section id="faq" className="mx-auto max-w-3xl px-6 py-24">
      <SectionHeading eyebrow="Вопросы" title="Частые вопросы" />

      <div className="mt-12 flex flex-col border-t border-stone-200">
        {ITEMS.map((item, index) => {
          const isOpen = openId === item.id;

          return (
            <Reveal key={item.id} delay={index * 0.04}>
              <div className="border-b border-stone-200">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenId(isOpen ? null : item.id)}
                  className="group flex w-full items-start gap-4 py-5 text-left"
                >
                  <span className="mt-0.5 shrink-0 font-mono text-[10px] tabular-nums text-stone-300">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span
                    className={cn(
                      "flex-1 text-sm transition-colors",
                      isOpen
                        ? "font-medium text-stone-900"
                        : "text-stone-700 group-hover:text-stone-900"
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
                        isOpen ? "text-stone-900" : "text-stone-300"
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
                      <p className="max-w-2xl pb-6 pl-[2.1rem] text-sm leading-relaxed text-stone-600">
                        {item.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
