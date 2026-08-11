"use client";

import { motion, useReducedMotion } from "framer-motion";
import { FileUp, ScanText, Sparkles } from "lucide-react";

import { SectionShell } from "@/components/landing/SectionShell";

/**
 * Три шага — весь продукт.
 *
 * Сложные продукты продаются простым объяснением: человек должен за десять
 * секунд понять, что от него потребуется. Три шага — предел, который читают до
 * конца; на пятом бросают.
 *
 * Внутри каждого шага стоит не иконка ради иконки, а маленькая сцена из
 * настоящего интерфейса: строка файла с состоянием распознавания, карточка
 * реквизитов, список готовых документов. Иллюстрация, повторяющая то, что
 * человек увидит после входа, работает как обещание, которое можно проверить.
 */

const STEPS = [
  {
    icon: FileUp,
    title: "Загрузите файл",
    text: "Скан, фотография, PDF. Хоть на сто девятнадцать страниц — читается волнами, ничего не теряется.",
    scene: <UploadScene />,
  },
  {
    icon: ScanText,
    title: "Реквизиты вынимаются из скана",
    text: "Кадастровый номер, ИНН, адрес, даты. То, в чём модель не уверена, помечается — проверить нужно три поля, а не сорок.",
    scene: <ExtractScene />,
  },
  {
    icon: Sparkles,
    title: "Пакет готовится по вашим шаблонам",
    text: "Договор, акт и заявление — на основе карточки объекта. Что попадёт в документ, видно до выпуска, а не после.",
    scene: <PackageScene />,
  },
];

export function HowItWorks() {
  const reduceMotion = useReducedMotion();

  return (
    <SectionShell
      id="how"
      eyebrow="Как это работает"
      title="Три шага от скана до пакета документов"
      lead="Никаких настроек, интеграций и обучения. Всё, что нужно, — файл."
    >
      <div className="grid gap-5 lg:grid-cols-3">
        {STEPS.map((step, index) => (
          <motion.article
            key={step.title}
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{
              duration: 0.55,
              delay: index * 0.08,
              ease: [0.22, 0.61, 0.36, 1],
            }}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-bg p-7 transition-colors duration-300 hover:border-line-strong"
          >
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-fg text-inverse-fg">
                <step.icon className="h-4 w-4" />
              </span>
              <span className="font-mono text-label uppercase text-fg-faint">
                Шаг {index + 1}
              </span>
            </span>

            <h3 className="mt-6 text-title font-medium text-fg">{step.title}</h3>
            <p className="mt-3 text-body leading-relaxed text-fg-subtle">
              {step.text}
            </p>

            <div className="mt-8 flex-1">{step.scene}</div>
          </motion.article>
        ))}
      </div>
    </SectionShell>
  );
}

/* ------------------------------------------------------------------ */
/*  СЦЕНЫ                                                              */
/* ------------------------------------------------------------------ */

/*
 * Сцены нарочно статичны и минимальны. Их работа — узнаваемость: человек,
 * дошедший до продукта, должен увидеть ровно то, что ему обещали. Анимация
 * здесь только отвлекала бы от заголовка, ради которого блок и существует.
 */

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      {children}
    </div>
  );
}

function UploadScene() {
  return (
    <Frame>
      <div className="flex items-center gap-2.5 border-b border-line px-3.5 py-3">
        <span className="h-6 w-5 shrink-0 rounded-sm bg-surface-3" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-body-sm text-fg">
            Выписка_ЕГРН.pdf
          </span>
          <span className="mt-0.5 block font-mono text-label uppercase text-fg-faint">
            6,4 МБ · 10 страниц
          </span>
        </span>
      </div>

      <div className="px-3.5 py-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-label uppercase text-fg-faint">
            Распознаётся
          </span>
          <span className="font-mono text-label tabular-nums text-fg-subtle">
            7 / 10
          </span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-3">
          <div className="h-full w-[70%] rounded-full bg-fg" />
        </div>
      </div>
    </Frame>
  );
}

function ExtractScene() {
  const fields = [
    { label: "Кадастровый номер", value: "15:09:0000000:0000", sure: true },
    { label: "Площадь", value: "440 кв.м.", sure: true },
    { label: "Правообладатель", value: "Брциев К. Р.", sure: false },
  ];

  return (
    <Frame>
      <div className="divide-y divide-line">
        {fields.map((field) => (
          <div
            key={field.label}
            className="flex items-center justify-between gap-3 px-3.5 py-2.5"
          >
            <span className="shrink-0 text-label text-fg-faint">
              {field.label}
            </span>
            <span
              className={
                field.sure
                  ? "truncate text-body-sm text-fg"
                  : "truncate rounded-md bg-warn-bg px-1.5 py-0.5 text-body-sm text-warn-fg"
              }
            >
              {field.value}
            </span>
          </div>
        ))}
      </div>
    </Frame>
  );
}

function PackageScene() {
  const documents = [
    "Договор купли-продажи",
    "Акт приёма-передачи",
    "Заявление в Росреестр",
  ];

  return (
    <Frame>
      <div className="divide-y divide-line">
        {documents.map((name) => (
          <div key={name} className="flex items-center gap-2.5 px-3.5 py-2.5">
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ok-bg">
              <span className="h-1.5 w-1.5 rounded-full bg-ok" />
            </span>
            <span className="min-w-0 flex-1 truncate text-body-sm text-fg">
              {name}
            </span>
            <span className="shrink-0 font-mono text-label uppercase text-fg-faint">
              DOCX
            </span>
          </div>
        ))}
      </div>
    </Frame>
  );
}
