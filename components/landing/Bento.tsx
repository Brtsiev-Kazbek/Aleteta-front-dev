"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  BadgeCheck,
  Boxes,
  FileDown,
  MessageSquareText,
  ScanLine,
  Wand2,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Сетка возможностей.
 *
 * Приём, которым сегодня показывают продукт все, у кого получается: плитки
 * разного размера, и размер плитки — это и есть расстановка приоритетов.
 * Список из шести одинаковых карточек говорит, что все шесть одинаково важны;
 * это неправда и читается как отписка.
 *
 * Поэтому первая плитка вдвое выше остальных: распознавание — то, ради чего
 * продукт заводят. Дальше по убыванию.
 *
 * ВНУТРИ КАЖДОЙ — КУСОК НАСТОЯЩЕГО ИНТЕРФЕЙСА, а не иконка в кружке. Иконка
 * ничего не доказывает; строка таблицы с подсвеченной ошибкой формата
 * доказывает, что проверка существует. Сцены собраны из тех же токенов, что и
 * приложение, — человек, дошедший до входа, увидит ровно это.
 */

export function Bento() {
  const reduceMotion = useReducedMotion();

  const appear = (index: number) => ({
    initial: reduceMotion ? (false as const) : { opacity: 0, y: 22 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" },
    transition: {
      duration: 0.55,
      delay: (index % 3) * 0.07,
      ease: [0.22, 0.61, 0.36, 1] as const,
    },
  });

  return (
    <section id="features" className="relative overflow-hidden bg-bg">
      <div aria-hidden className="mesh-light pointer-events-none absolute inset-0" />

      <div className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32">
        <motion.header
          {...appear(0)}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="font-mono text-label uppercase text-brand">
            Возможности
          </span>
          <h2 className="mt-4 text-section font-medium text-fg">
            Всё, что происходит между сканом и готовым документом
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lead text-fg-subtle">
            Ни одного шага, который пришлось бы делать в другой программе.
          </p>
        </motion.header>

        <div className="mt-14 grid gap-4 sm:mt-16 lg:grid-cols-6">
          <Tile
            {...appear(1)}
            className="lg:col-span-3 lg:row-span-2"
            icon={ScanLine}
            title="Одна карточка объекта вместо папки сканов"
            text="Кадастровый номер, площадь, правообладатель, даты — всё в одном месте и заполнено один раз. Дальше эти значения идут во все документы дела, и переписывать их из выписки в каждый шаблон не нужно."
          >
            <ExtractScene />
          </Tile>

          <Tile
            {...appear(2)}
            className="lg:col-span-3"
            icon={BadgeCheck}
            title="Ошибка видна до генерации, а не после"
            text="Форматы ИНН, КПП, СНИЛС и кадастрового номера проверяются правилами. Пока хотя бы одно обязательное поле пустое, кнопка выпуска заблокирована."
          >
            <ValidationScene />
          </Tile>

          <Tile
            {...appear(3)}
            className="lg:col-span-3"
            icon={Boxes}
            title="Свои типы объектов"
            text="Транспорт, оборудование, объекты аренды — задайте название и список реквизитов. Дальше они работают наравне со встроенными."
          >
            <TypesScene />
          </Tile>

          <Tile
            {...appear(4)}
            className="lg:col-span-2"
            icon={Wand2}
            title="Документ без шаблона"
            text="Опишите нужное словами — Алетейя составит документ, опираясь на данные дела."
          />

          <Tile
            {...appear(5)}
            className="lg:col-span-2"
            icon={MessageSquareText}
            title="Ассистент по делу"
            text="Отвечает по загруженным файлам со ссылкой на пункт, а не общими словами."
          />

          <Tile
            {...appear(6)}
            className="lg:col-span-2"
            icon={FileDown}
            title="Экспорт в DOCX"
            text="Готовый файл открывается в Word и правится дальше как обычный документ."
          />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function Tile({
  icon: Icon,
  title,
  text,
  className,
  children,
  ...motionProps
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
  className?: string;
  children?: React.ReactNode;
} & React.ComponentProps<typeof motion.article>) {
  return (
    <motion.article
      {...motionProps}
      className={cn(
        /*
         * Скругление крупнее интерфейсного и заливка светлее фона: плитка
         * должна читаться как предмет, лежащий на странице. Внутренняя тень по
         * верхней кромке даёт ту же кромку, что у стекла в первом экране, —
         * страница остаётся одним материалом.
         */
        "group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-surface p-7 transition-all duration-300",
        "hover:border-line-strong hover:shadow-[0_24px_60px_-40px_rgb(var(--fg)/0.4)]",
        className
      )}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-soft text-brand">
        <Icon className="h-[1.125rem] w-[1.125rem]" />
      </span>

      <h3 className="mt-5 text-title-sm font-medium text-fg">{title}</h3>
      <p className="mt-2.5 max-w-prose text-body leading-relaxed text-fg-subtle">
        {text}
      </p>

      {/*
        Сцена прижата к низу: плитки разной высоты стоят в одном ряду, и если
        сцена идёт сразу за текстом, у высокой плитки снизу остаётся пустое
        поле в треть карточки. Прижатая сцена выравнивает ряд по нижней кромке.
      */}
      {children && <div className="mt-auto pt-7">{children}</div>}
    </motion.article>
  );
}

/* ------------------------------------------------------------------ */
/*  СЦЕНЫ                                                              */
/* ------------------------------------------------------------------ */

function Frame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-line bg-bg",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Карточка объекта после разбора: часть значений подтверждена, часть — нет. */
function ExtractScene() {
  const fields = [
    { label: "Кадастровый номер", value: "15:09:0301012:118", sure: true },
    { label: "Площадь", value: "440 кв.м.", sure: true },
    { label: "Категория земель", value: "Земли населённых пунктов", sure: true },
    { label: "Правообладатель", value: "Брциев К. Р.", sure: true },
    { label: "Дата регистрации", value: "14.03.2024", sure: true },
  ];

  return (
    <Frame>
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <span className="truncate text-body-sm font-medium text-fg">
          Выписка_ЕГРН.pdf
        </span>
        <span className="shrink-0 font-mono text-label uppercase text-fg-faint">
          10 стр.
        </span>
      </div>

      <div className="divide-y divide-line-soft">
        {fields.map((field) => (
          <div
            key={field.label}
            className="flex items-center justify-between gap-3 px-4 py-2.5"
          >
            <span className="shrink-0 text-caption text-fg-faint">
              {field.label}
            </span>
            <span
              className={cn(
                "truncate text-body-sm",
                field.sure
                  ? "text-fg"
                  : "rounded-md bg-warn-bg px-1.5 py-0.5 text-warn-fg"
              )}
            >
              {field.value}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 border-t border-line px-4 py-2.5">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ok" />
        <span className="text-caption text-fg-subtle">
          Форматы проверены — объект готов к генерации
        </span>
      </div>
    </Frame>
  );
}

/** Строка таблицы с ошибкой формата — то самое, что блокирует выпуск. */
function ValidationScene() {
  return (
    <Frame>
      <div className="divide-y divide-line-soft">
        <div className="flex items-center gap-3 px-4 py-2.5">
          <span className="w-24 shrink-0 text-caption text-fg-faint">ИНН</span>
          <span className="flex-1 truncate text-body-sm text-fg">
            1513000000
          </span>
          <span className="shrink-0 font-mono text-label uppercase text-ok">
            Верно
          </span>
        </div>

        <div className="flex items-center gap-3 bg-danger-bg px-4 py-2.5">
          <span className="w-24 shrink-0 text-caption text-danger-fg">КПП</span>
          <span className="flex-1 truncate text-body-sm text-danger-fg">
            15130100
          </span>
          <span className="shrink-0 font-mono text-label uppercase text-danger">
            9 цифр
          </span>
        </div>

        <div className="flex items-center gap-3 px-4 py-2.5">
          <span className="w-24 shrink-0 text-caption text-fg-faint">ОГРН</span>
          <span className="flex-1 truncate text-body-sm text-fg-ghost">
            не заполнено
          </span>
          <span className="shrink-0 font-mono text-label uppercase text-warn">
            Обязательно
          </span>
        </div>
      </div>

      <div className="border-t border-line px-4 py-3">
        <span className="inline-flex h-8 items-center rounded-lg border border-line bg-surface-2 px-3 text-body-sm text-fg-faint">
          Собрать пакет — недоступно
        </span>
      </div>
    </Frame>
  );
}

/** Конструктор типа: имя и список реквизитов. */
function TypesScene() {
  const fields = [
    "Марка",
    "VIN",
    "Гос. номер",
    "Год выпуска",
    "Собственник",
    "ПТС",
  ];

  return (
    <Frame className="p-4">
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-label uppercase text-fg-faint">
          Тип объекта
        </span>
        <span className="text-body-sm font-medium text-fg">
          Транспортное средство
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {fields.map((field) => (
          <span
            key={field}
            className="rounded-full border border-line bg-surface px-2.5 py-1 text-caption text-fg-muted"
          >
            {field}
          </span>
        ))}
        <span className="rounded-full border border-dashed border-line-strong px-2.5 py-1 text-caption text-fg-faint">
          + реквизит
        </span>
      </div>
    </Frame>
  );
}
