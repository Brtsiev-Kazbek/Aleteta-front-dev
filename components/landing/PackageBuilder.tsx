"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, Minus, Plus } from "lucide-react";

import { SectionHeading } from "@/components/landing/SectionHeading";
import { cn, plural } from "@/lib/utils";

interface EntityKind {
  id: string;
  label: string;
  hint: string;
  documents: string[];
}

const KINDS: EntityKind[] = [
  {
    id: "real_estate",
    label: "Объект недвижимости",
    hint: "кадастровый номер, площадь, назначение",
    documents: [
      "Договор купли-продажи",
      "Акт приёма-передачи",
      "Заявление в Росреестр",
    ],
  },
  {
    id: "legal_entity",
    label: "Контрагент",
    hint: "ИНН, КПП, адрес, директор",
    documents: ["Договор оказания услуг", "Карточка контрагента"],
  },
  {
    id: "individual",
    label: "Сотрудник",
    hint: "паспорт, СНИЛС, адрес регистрации",
    documents: ["Трудовой договор", "Согласие на обработку ПДн"],
  },
  {
    id: "custom",
    label: "Свой тип объекта",
    hint: "любые реквизиты и свои шаблоны",
    documents: ["Документ по вашему шаблону"],
  },
];

const MINUTES_PRESETS = [8, 15, 25, 40];

export function PackageBuilder() {
  const [counts, setCounts] = useState<Record<string, number>>({
    real_estate: 12,
    legal_entity: 0,
    individual: 0,
    custom: 0,
  });
  const [minutesPerDoc, setMinutesPerDoc] = useState(15);
  const [hourlyRate, setHourlyRate] = useState(2500);

  function change(id: string, delta: number) {
    setCounts((current) => ({
      ...current,
      [id]: Math.max(0, Math.min(999, (current[id] ?? 0) + delta)),
    }));
  }

  /** Строки расчёта: объекты × шаблоны = документы. */
  const lines = KINDS.map((kind) => {
    const objects = counts[kind.id] ?? 0;
    return {
      kind,
      objects,
      templates: kind.documents.length,
      documents: objects * kind.documents.length,
    };
  }).filter((line) => line.objects > 0);

  const totalObjects = lines.reduce((sum, line) => sum + line.objects, 0);
  const totalDocuments = lines.reduce((sum, line) => sum + line.documents, 0);

  const totalMinutes = totalDocuments * minutesPerDoc;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const cost = Math.round((totalMinutes / 60) * hourlyRate);

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <SectionHeading
          eyebrow="Расчёт"
          title="Посчитайте на своём объёме"
          description="Укажите объекты и свою оценку трудозатрат. Расчёт показан по шагам — его можно проверить."
        />

        <div className="mt-12 grid grid-cols-1 gap-px border border-stone-200 bg-stone-200 lg:grid-cols-2">
          {/* Ввод */}
          <div className="bg-white p-6 lg:p-8">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400">
              Объекты в деле
            </span>

            <div className="mt-4 flex flex-col divide-y divide-stone-100 border-y border-stone-100">
              {KINDS.map((kind) => {
                const count = counts[kind.id] ?? 0;

                return (
                  <div key={kind.id} className="flex items-center gap-4 py-3.5">
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span
                        className={cn(
                          "text-sm transition-colors",
                          count > 0
                            ? "font-medium text-stone-900"
                            : "text-stone-500"
                        )}
                      >
                        {kind.label}
                      </span>
                      <span className="mt-0.5 truncate text-[11px] text-stone-400">
                        {kind.documents.length}{" "}
                        {plural(
                          kind.documents.length,
                          "шаблон",
                          "шаблона",
                          "шаблонов"
                        )}{" "}
                        · {kind.hint}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => change(kind.id, -1)}
                        disabled={count === 0}
                        aria-label={`Убавить: ${kind.label}`}
                        className="flex h-8 w-8 items-center justify-center rounded border border-stone-200 text-stone-500 transition-colors hover:border-stone-300 hover:text-stone-900 disabled:opacity-30"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>

                      <span className="w-10 text-center font-mono text-sm tabular-nums text-stone-900">
                        {count}
                      </span>

                      <button
                        type="button"
                        onClick={() => change(kind.id, 1)}
                        aria-label={`Добавить: ${kind.label}`}
                        className="flex h-8 w-8 items-center justify-center rounded border border-stone-200 text-stone-500 transition-colors hover:border-stone-300 hover:text-stone-900"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Допущения задаёт пользователь */}
            <div className="mt-7">
              <label
                htmlFor="minutes"
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400"
              >
                Минут на один документ вручную
              </label>

              <div className="mt-2.5 flex items-center gap-3">
                <input
                  id="minutes"
                  type="range"
                  min={3}
                  max={60}
                  step={1}
                  value={minutesPerDoc}
                  onChange={(event) =>
                    setMinutesPerDoc(Number(event.target.value))
                  }
                  className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-stone-200 accent-violet-600"
                />
                <span className="w-14 shrink-0 text-right font-mono text-sm tabular-nums text-stone-900">
                  {minutesPerDoc} мин
                </span>
              </div>

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {MINUTES_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setMinutesPerDoc(preset)}
                    className={cn(
                      "rounded border px-2 py-1 font-mono text-[10px] transition-colors",
                      minutesPerDoc === preset
                        ? "border-stone-900 bg-stone-900 text-white"
                        : "border-stone-200 text-stone-500 hover:border-stone-300"
                    )}
                  >
                    {preset} мин
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <label
                htmlFor="rate"
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400"
              >
                Стоимость часа работы, ₽
              </label>

              <input
                id="rate"
                type="number"
                min={0}
                step={100}
                value={hourlyRate}
                onChange={(event) =>
                  setHourlyRate(Math.max(0, Number(event.target.value)))
                }
                className="mt-2.5 h-10 w-full rounded border border-stone-200 px-3 font-mono text-sm text-stone-900 outline-none transition-colors focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
              />
            </div>
          </div>

          {/* Результат */}
          <div className="flex flex-col bg-stone-950 p-6 lg:p-8">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-500">
              Соберётся одним действием
            </span>

            {totalObjects === 0 ? (
              <p className="mt-8 text-sm text-stone-500">
                Добавьте хотя бы один объект, чтобы увидеть расчёт.
              </p>
            ) : (
              <>
                <div className="mt-5 flex items-baseline gap-3">
                  <motion.span
                    key={totalDocuments}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="font-mono text-5xl tabular-nums tracking-tight text-white"
                  >
                    {totalDocuments}
                  </motion.span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-stone-500">
                    {plural(totalDocuments, "документ", "документа", "документов")}
                  </span>
                </div>

                {/* Открытая арифметика — расчёт можно проверить */}
                <div className="mt-6 flex flex-col gap-2 border-t border-stone-800 pt-4">
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-stone-600">
                    Как получилось
                  </span>

                  <AnimatePresence initial={false}>
                    {lines.map((line) => (
                      <motion.div
                        key={line.kind.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-baseline justify-between gap-3"
                      >
                        <span className="min-w-0 truncate text-[12px] text-stone-400">
                          {line.kind.label}
                        </span>
                        <span className="shrink-0 font-mono text-[11px] tabular-nums text-stone-500">
                          {line.objects} × {line.templates} ={" "}
                          <span className="text-stone-200">{line.documents}</span>
                        </span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Состав пакета */}
                <div className="mt-5 flex flex-1 flex-col gap-3 border-t border-stone-800 pt-4">
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-stone-600">
                    Состав пакета
                  </span>

                  {lines.map((line) => (
                    <div key={line.kind.id} className="flex flex-col gap-1.5">
                      {line.kind.documents.map((document) => (
                        <div
                          key={document}
                          className="flex items-center gap-2.5"
                        >
                          <FileText className="h-3 w-3 shrink-0 text-violet-400" />
                          <span className="min-w-0 flex-1 truncate text-[13px] text-stone-300">
                            {document}
                          </span>
                          <span className="shrink-0 font-mono text-[10px] tabular-nums text-stone-600">
                            ×{line.objects}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Трудозатраты */}
                <div className="mt-5 grid grid-cols-2 gap-4 border-t border-stone-800 pt-4">
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-stone-600">
                      Вручную
                    </span>
                    <p className="mt-1.5 font-mono text-xl tabular-nums text-white">
                      {hours > 0 ? `${hours} ч ` : ""}
                      {minutes > 0 || hours === 0 ? `${minutes} мин` : ""}
                    </p>
                    <p className="mt-1 font-mono text-[10px] text-stone-600">
                      {totalDocuments} × {minutesPerDoc} мин
                    </p>
                  </div>

                  {hourlyRate > 0 && (
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-stone-600">
                        В деньгах
                      </span>
                      <p className="mt-1.5 font-mono text-xl tabular-nums text-white">
                        {cost.toLocaleString("ru-RU")} ₽
                      </p>
                      <p className="mt-1 font-mono text-[10px] text-stone-600">
                        по {hourlyRate.toLocaleString("ru-RU")} ₽/час
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Честная сноска об источниках */}
        <div className="mt-6 flex flex-col gap-2 border-l-2 border-stone-200 pl-4">
          <p className="max-w-3xl text-[12px] leading-relaxed text-stone-500">
            <span className="font-medium text-stone-700">
              О цифрах.
            </span>{" "}
            Время на один документ вы задаёте сами — универсального норматива
            нет, он сильно зависит от типа документа и вашего процесса.
            Общеотраслевой контекст: по данным McKinsey Global Institute
            («The social economy», 2012), сотрудники умственного труда тратят
            около 19% рабочей недели на поиск и сбор информации.
          </p>
          <p className="max-w-3xl text-[12px] leading-relaxed text-stone-400">
            Расчёт выше — оценка на ваших допущениях, а не обещание результата.
          </p>
        </div>
      </div>
    </section>
  );
}
