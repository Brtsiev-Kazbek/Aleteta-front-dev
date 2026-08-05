"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Check, MoveHorizontal } from "lucide-react";

import { Reveal } from "@/components/landing/Reveal";
import { SectionHeading } from "@/components/landing/SectionHeading";
import { cn } from "@/lib/utils";

const ROWS = [
  {
    name: "ООО «Альфа-Консалт»",
    inn: "1513000000",
    kpp: "151301001",
    director: "Иванов И. И.",
    broken: { kpp: "" },
  },
  {
    name: "ООО «Вектор-Строй»",
    inn: "1513000241",
    kpp: "151301001",
    director: "Сидоров П. А.",
    broken: { inn: "15130002" },
  },
  {
    name: "ИП Кузнецова А. В.",
    inn: "151300112233",
    kpp: "—",
    director: "Кузнецова А. В.",
    broken: {},
  },
];

export function ComparisonSlider() {
  const [position, setPosition] = useState(50);
  const [isDragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateFromClientX = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(96, Math.max(4, next)));
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    function onMove(event: PointerEvent) {
      updateFromClientX(event.clientX);
    }
    function onUp() {
      setDragging(false);
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [isDragging, updateFromClientX]);

  return (
    <section className="bg-stone-50">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <SectionHeading
          eyebrow="Сравнение"
          title="Одни и те же данные — до и после"
          description="Потяните разделитель. Слева таблица, собранная вручную. Справа — она же после проверки реквизитов."
        />

        <Reveal delay={0.15} className="mt-12">
          <div
            ref={containerRef}
            onPointerDown={(event) => {
              setDragging(true);
              updateFromClientX(event.clientX);
            }}
            className="relative select-none overflow-hidden rounded-lg border border-stone-200 bg-white"
          >
            {/* Слой «после» — базовый */}
            <TableLayer variant="after" />

            {/* Слой «до» — обрезается разделителем */}
            <div
              className="absolute inset-0"
              style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
            >
              <TableLayer variant="before" />
            </div>

            {/* Разделитель */}
            <div
              className="absolute inset-y-0 z-20 w-px bg-stone-900"
              style={{ left: `${position}%` }}
            >
              <button
                type="button"
                aria-label="Передвинуть разделитель сравнения"
                aria-valuenow={Math.round(position)}
                aria-valuemin={0}
                aria-valuemax={100}
                role="slider"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "ArrowLeft") {
                    event.preventDefault();
                    setPosition((p) => Math.max(4, p - 4));
                  }
                  if (event.key === "ArrowRight") {
                    event.preventDefault();
                    setPosition((p) => Math.min(96, p + 4));
                  }
                }}
                className={cn(
                  "absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full border border-stone-300 bg-white shadow-md transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-900",
                  isDragging && "scale-110"
                )}
              >
                <MoveHorizontal className="h-4 w-4 text-stone-600" />
              </button>
            </div>

            {/* Подписи сторон */}
            <span className="pointer-events-none absolute left-4 top-4 z-10 rounded bg-white/90 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-stone-500 backdrop-blur">
              Как сейчас
            </span>
            <span className="pointer-events-none absolute right-4 top-4 z-10 rounded bg-stone-950 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white">
              С Алетейей
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function TableLayer({ variant }: { variant: "before" | "after" }) {
  const isBefore = variant === "before";

  return (
    <div className={cn("min-w-full", isBefore && "bg-stone-50")}>
      <table className="w-full min-w-[640px] border-separate border-spacing-0 text-left">
        <thead>
          <tr>
            {["Наименование", "ИНН", "КПП", "Директор", "Статус"].map((column) => (
              <th
                key={column}
                className="whitespace-nowrap border-b border-stone-200 px-4 pb-2.5 pt-14 font-mono text-[10px] font-normal uppercase tracking-[0.12em] text-stone-400"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {ROWS.map((row) => {
            const inn = isBefore ? (row.broken.inn ?? row.inn) : row.inn;
            const kpp = isBefore ? (row.broken.kpp ?? row.kpp) : row.kpp;
            const hasError = isBefore && Object.keys(row.broken).length > 0;

            return (
              <tr key={row.name}>
                <td className="whitespace-nowrap border-b border-stone-100 px-4 py-3.5 text-sm text-stone-800">
                  {row.name}
                </td>

                <Cell
                  value={inn}
                  mono
                  invalid={isBefore && row.broken.inn !== undefined}
                />
                <Cell
                  value={kpp}
                  mono
                  invalid={isBefore && row.broken.kpp !== undefined}
                />

                <td className="whitespace-nowrap border-b border-stone-100 px-4 py-3.5 text-sm text-stone-700">
                  {row.director}
                </td>

                <td className="whitespace-nowrap border-b border-stone-100 px-4 py-3.5">
                  {hasError ? (
                    <span className="inline-flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-red-700">
                      <AlertCircle className="h-3 w-3" />
                      Ошибка
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded border border-emerald-200 bg-emerald-50 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-emerald-700">
                      <Check className="h-3 w-3" strokeWidth={3} />
                      Валидно
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Нижняя строка со счётчиком */}
      <div className="flex items-center justify-between gap-4 border-t border-stone-200 px-4 py-3.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-stone-400">
          Готово к генерации{" "}
          <span
            className={cn(
              "ml-1 text-sm",
              isBefore ? "text-stone-900" : "text-emerald-600"
            )}
          >
            {isBefore ? "1 / 3" : "3 / 3"}
          </span>
        </span>

        <span
          className={cn(
            "whitespace-nowrap rounded px-4 py-2 text-sm font-medium",
            isBefore
              ? "bg-stone-200 text-stone-400"
              : "bg-stone-950 text-white"
          )}
        >
          Сгенерировать пакет
        </span>
      </div>
    </div>
  );
}

function Cell({
  value,
  mono,
  invalid,
}: {
  value: string;
  mono?: boolean;
  invalid?: boolean;
}) {
  return (
    <td className="whitespace-nowrap border-b border-stone-100 px-4 py-3.5">
      {invalid ? (
        <span className="inline-flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-2 py-1">
          <AlertCircle className="h-3 w-3 shrink-0 text-red-500" />
          <span
            className={cn("text-[13px] text-red-800", mono && "font-mono")}
          >
            {value || "Не заполнено"}
          </span>
        </span>
      ) : (
        <span className={cn("text-sm text-stone-700", mono && "font-mono text-[13px]")}>
          {value}
        </span>
      )}
    </td>
  );
}
