"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Plus, ScanText } from "lucide-react";

import { AnimatedNumber } from "@/components/ui/animated-number";
import { useWorkspaceHealth } from "@/components/dashboard/health";
import { plural } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

/**
 * Шапка кабинета.
 *
 * Было: первый экран лендинга, повторённый внутри продукта, — заголовок в две
 * строки во весь кадр и обещание «девять инструментов, весь цикл работы».
 * Человеку, который зашёл сюда в четвёртый раз за день, это обещание не нужно:
 * он уже купил. Ему нужно знать, где он и что у него происходит.
 *
 * Стало: та же тёмная полоса со свечением — вход в продукт должен оставаться
 * узнаваемым, — но вдвое ниже и с другим содержимым. Обращение по имени,
 * название рабочего пространства, одна строка состояния и два действия, с
 * которых работа начинается чаще всего.
 *
 * ПОЧЕМУ СОСТОЯНИЕ, А НЕ ЛОЗУНГ. Строка «два объекта требуют внимания» решает
 * за человека главный вопрос входа: можно ли сегодня не открывать дела вообще.
 * Лозунг на этот вопрос не отвечает никогда.
 */
export function CabinetHeader() {
  const reduceMotion = useReducedMotion();
  const health = useWorkspaceHealth();
  const attentionCount = health.attention.length;

  const viewer = useAppStore((state) => state.viewer);
  const cases = useAppStore((state) => state.cases);
  const entities = useAppStore((state) => state.entities);
  const documents = useAppStore((state) => state.documents);
  const isBackedByDatabase = useAppStore((state) => state.isBackedByDatabase);

  /*
   * Время суток читается только после монтирования. На сервере часа нет — вернее,
   * есть, но чужой, — и если поздороваться прямо в разметке, серверный текст и
   * клиентский разойдутся, а React сочтёт это ошибкой гидратации.
   */
  const [greeting, setGreeting] = useState("С возвращением");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 5) setGreeting("Доброй ночи");
    else if (hour < 12) setGreeting("Доброе утро");
    else if (hour < 18) setGreeting("Добрый день");
    else setGreeting("Добрый вечер");
  }, []);

  /** Имя, а не полное ФИО: обращение по фамилии звучит как вызов к доске. */
  const firstName = (viewer?.fullName ?? "").split(/\s+/).filter(Boolean)[1];

  const stats = [
    { value: cases.length, label: plural(cases.length, "дело", "дела", "дел") },
    {
      value: entities.length,
      label: plural(entities.length, "объект", "объекта", "объектов"),
    },
    {
      value: documents.length,
      label: plural(documents.length, "документ", "документа", "документов"),
    },
  ];

  /*
   * `initial: false` — «начать сразу с конечных значений», и это единственная
   * правильная форма отказа от движения. Соблазн вернуть пустой объект велик и
   * дважды приводил к пустому экрану: первый клиентский рендер проходит, когда
   * хук ещё не ответил, прозрачность уходит в ноль, а на втором рендере
   * пропсов уже нет — анимировать нечего, и блок остаётся невидимым навсегда.
   */
  const appear = (delay: number) => ({
    initial: reduceMotion ? (false as const) : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay, ease: [0.22, 0.61, 0.36, 1] },
  });

  return (
    <section className="relative overflow-hidden bg-inverse">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="mesh-dark absolute inset-0 opacity-90" />
        <div className="bg-grid-dark absolute inset-0 opacity-50" />
        {/*
          Нижняя кромка растворяется. Резкая граница под карточками бенто
          читалась как обрыв: карточки будто стояли на ступеньке. Растворение
          делает переход к светлой части плавным, и предметы выглядят
          положенными на поле, а не приклеенными к его краю.
        */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-inverse" />
      </div>

      <div className="relative mx-auto max-w-6xl px-8 pb-16 pt-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <motion.div {...appear(0)} className="min-w-0">
            <span className="font-mono text-label uppercase text-brand-line/70">
              {isBackedByDatabase
                ? (viewer?.workspaceName ?? "Рабочее пространство")
                : "Демонстрационный режим"}
            </span>

            <h1 className="mt-3 text-heading font-medium text-inverse-fg">
              {greeting}
              {firstName ? `, ${firstName}` : ""}
            </h1>

            <p className="mt-2 text-body-lg text-inverse-fg/55">
              {attentionCount > 0
                ? `${attentionCount} ${plural(
                    attentionCount,
                    "объект ждёт",
                    "объекта ждут",
                    "объектов ждут"
                  )} проверки`
                : cases.length === 0
                  ? "Пустое пространство. Заведите первое дело и загрузите документы"
                  : "Всё заполнено — можно собирать пакеты документов"}
            </p>
          </motion.div>

          <motion.div {...appear(0.08)} className="flex flex-wrap gap-2.5">
            <Link
              href="/dashboard/recognize"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-inverse-fg px-5 text-body font-medium text-inverse transition-transform duration-200 hover:scale-[1.02]"
            >
              <ScanText className="h-4 w-4" />
              Распознать документ
            </Link>

            <NewCaseButton />
          </motion.div>
        </div>

        {/* Состояние пространства одной строкой */}
        <motion.ul
          {...appear(0.16)}
          className="mt-9 flex flex-wrap items-baseline gap-x-8 gap-y-3 border-t border-inverse-fg/10 pt-5"
        >
          {stats.map((stat) => (
            <li key={stat.label} className="flex items-baseline gap-2">
              <span className="font-mono text-title-sm tabular-nums text-inverse-fg">
                <AnimatedNumber value={stat.value} />
              </span>
              <span className="font-mono text-label uppercase text-inverse-fg/40">
                {stat.label}
              </span>
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}

/** Открывает общий диалог создания дела — он живёт в сайдбаре. */
function NewCaseButton() {
  const setCreateCaseOpen = useAppStore((state) => state.setCreateCaseOpen);

  return (
    <button
      type="button"
      onClick={() => setCreateCaseOpen(true)}
      className="glass inline-flex h-11 items-center gap-2 rounded-full px-5 text-body font-medium text-inverse-fg transition-colors hover:bg-inverse-fg/10"
    >
      <Plus className="h-4 w-4" />
      Новое дело
    </button>
  );
}
