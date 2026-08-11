"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  ScanText,
} from "lucide-react";

import { useWorkspaceHealth } from "@/components/dashboard/health";
import { cn, plural } from "@/lib/utils";

/**
 * Бенто кабинета: что требует человека и насколько всё готово.
 *
 * Порядок плиток — порядок вопросов, с которыми сюда заходят. Сначала «что от
 * меня нужно прямо сейчас», и под это отдана самая крупная плитка; рядом, вдвое
 * у́же, — «сколько осталось до готовности»; ниже — вход в распознавание, потому
 * что оно чаще всего и есть ответ на первый вопрос.
 *
 * ПОЧЕМУ СПИСОК, А НЕ ЦИФРА. Плитка «три ошибки» заставляет искать эти три
 * ошибки самому: открыть дела по очереди, пройти таблицы. Список из четырёх
 * строк с прямыми ссылками закрывает задачу целиком — от «что не так» до
 * «исправлено» один переход.
 *
 * ЧЕТЫРЕ СТРОКИ — предел. Дальше плитка превращается в реестр, а реестр уже
 * есть: это таблица объектов внутри дела. Остаток честно назван числом.
 */

const VISIBLE = 4;

export function CabinetBento() {
  const reduceMotion = useReducedMotion();
  const health = useWorkspaceHealth();

  const appear = (index: number) => ({
    initial: reduceMotion ? (false as const) : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.5,
      delay: index * 0.06,
      ease: [0.22, 0.61, 0.36, 1] as const,
    },
  });

  const shown = health.attention.slice(0, VISIBLE);
  const rest = health.attention.length - shown.length;

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      {/* Требуют внимания */}
      <motion.section
        {...appear(0)}
        className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface lg:col-span-8"
      >
        <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 className="min-w-0 truncate text-body font-medium text-fg">
            Требуют внимания
          </h2>

          {health.attention.length > 0 && (
            <span className="flex shrink-0 items-center gap-2">
              {health.errorCount > 0 && (
                <span className="whitespace-nowrap rounded-full border border-danger-line bg-danger-bg px-2.5 py-1 font-mono text-label uppercase text-danger-fg">
                  {health.errorCount}{" "}
                  {plural(health.errorCount, "ошибка", "ошибки", "ошибок")}
                </span>
              )}
              {health.uncertainCount > 0 && (
                <span className="whitespace-nowrap rounded-full border border-warn-line bg-warn-bg px-2.5 py-1 font-mono text-label uppercase text-warn-fg">
                  {health.uncertainCount} на подтверждение
                </span>
              )}
            </span>
          )}
        </header>

        {shown.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ok-bg text-ok">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <p className="text-body text-fg">
              {health.total === 0
                ? "Объектов пока нет"
                : "Все объекты заполнены и проверены"}
            </p>
            <p className="max-w-sm text-body-sm leading-relaxed text-fg-subtle">
              {health.total === 0
                ? "Заведите дело и добавьте объекты — их состояние появится здесь."
                : "Ничего чинить не нужно: пакет документов можно собирать."}
            </p>
          </div>
        ) : (
          <div className="flex flex-1 flex-col p-2">
            {shown.map((item) => {
              const isError = item.errors.length > 0;

              return (
                <Link
                  key={item.entity.id}
                  href={`/cases/${item.caseItem.id}`}
                  className="group flex items-center gap-3.5 rounded-xl px-3 py-3 transition-colors hover:bg-bg"
                >
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      isError
                        ? "bg-danger-bg text-danger-fg"
                        : "bg-warn-bg text-warn-fg"
                    )}
                  >
                    {isError ? (
                      <AlertTriangle className="h-3.5 w-3.5" />
                    ) : (
                      <HelpCircle className="h-3.5 w-3.5" />
                    )}
                  </span>

                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-body text-fg">
                      {item.title}
                    </span>
                    <span
                      className={cn(
                        "mt-0.5 truncate text-caption",
                        isError ? "text-danger-fg" : "text-warn-fg"
                      )}
                    >
                      {isError
                        ? item.errors[0]
                        : `${item.uncertain.length} ${plural(
                            item.uncertain.length,
                            "поле ждёт",
                            "поля ждут",
                            "полей ждут"
                          )} подтверждения`}
                    </span>
                  </span>

                  <span className="hidden min-w-0 max-w-[32%] shrink-0 truncate font-mono text-label uppercase text-fg-faint lg:block">
                    {item.caseItem.title}
                  </span>

                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-fg-ghost transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-fg" />
                </Link>
              );
            })}

            {/*
              Выход из плитки есть всегда, а не только когда список не поместился.
              Плитка тянется по высоте соседней, и без нижней строки под одним
              объектом остаётся пустое поле в половину карточки — оно читается
              как «здесь что-то не догрузилось».
            */}
            <Link
              href="/dashboard/cases"
              className="mt-auto flex items-center justify-between gap-3 rounded-xl px-3 py-3 font-mono text-label uppercase text-fg-faint transition-colors hover:bg-bg hover:text-fg"
            >
              {rest > 0
                ? `Ещё ${rest} ${plural(rest, "объект", "объекта", "объектов")} во всех делах`
                : "Все дела"}
              <ArrowRight className="h-3.5 w-3.5 shrink-0" />
            </Link>
          </div>
        )}
      </motion.section>

      {/* Готовность */}
      <motion.section
        {...appear(1)}
        className="flex flex-col rounded-2xl border border-line bg-surface p-5 lg:col-span-4"
      >
        <h2 className="text-body font-medium text-fg">Готовность</h2>

        <div className="mt-6 flex flex-1 flex-col items-center justify-center">
          <ReadinessRing percent={health.percent} ready={health.ready === health.total && health.total > 0} />

          <p className="mt-5 text-center text-body text-fg-subtle">
            {health.total === 0
              ? "Объектов пока нет"
              : `${health.ready} из ${health.total} ${plural(
                  health.total,
                  "объекта",
                  "объектов",
                  "объектов"
                )} готовы к генерации`}
          </p>
        </div>
      </motion.section>

      {/* Распознавание — единственное, что работает на настоящих файлах */}
      <motion.section
        {...appear(2)}
        className="relative overflow-hidden rounded-2xl bg-inverse p-6 lg:col-span-12"
      >
        <div aria-hidden className="mesh-dark pointer-events-none absolute inset-0 opacity-80" />

        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div className="flex min-w-0 items-center gap-4">
            <span className="glass flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-inverse-fg">
              <ScanText className="h-5 w-5" />
            </span>

            <div className="min-w-0">
              <h2 className="text-title-sm font-medium text-inverse-fg">
                Загрузите скан — получите текст
              </h2>
              <p className="mt-1 text-body text-inverse-fg/55">
                Файл читается постранично, текст остаётся в поиске по делу
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/recognize"
            className="group inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-inverse-fg px-5 text-body font-medium text-inverse transition-transform duration-200 hover:scale-[1.02]"
          >
            Открыть распознавание
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </motion.section>
    </div>
  );
}

/**
 * Кольцо готовности.
 *
 * Кольцо, а не полоса: полоса требует ширины, а плитка здесь узкая и высокая.
 * Дуга рисуется через `stroke-dasharray` — это единственный способ обойтись без
 * библиотеки и без канваса, и он же даёт бесплатную анимацию длины.
 */
function ReadinessRing({ percent, ready }: { percent: number; ready: boolean }) {
  const reduceMotion = useReducedMotion();
  const radius = 46;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative flex h-[128px] w-[128px] items-center justify-center">
      <svg viewBox="0 0 112 112" className="h-full w-full -rotate-90">
        <circle
          cx="56"
          cy="56"
          r={radius}
          fill="none"
          strokeWidth="8"
          className="stroke-surface-3"
        />
        <motion.circle
          cx="56"
          cy="56"
          r={radius}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={reduceMotion ? false : { strokeDashoffset: circumference }}
          animate={{
            strokeDashoffset: circumference - (circumference * percent) / 100,
          }}
          transition={{ duration: 0.9, ease: [0.22, 0.61, 0.36, 1] }}
          className={ready ? "stroke-ok" : "stroke-brand"}
        />
      </svg>

      <span
        className={cn(
          "absolute font-mono text-heading tabular-nums",
          ready ? "text-ok-fg" : "text-fg"
        )}
      >
        {percent}
        <span className="text-title text-fg-ghost">%</span>
      </span>
    </div>
  );
}
