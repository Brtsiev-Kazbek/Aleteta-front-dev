"use client";

import { useState, useTransition } from "react";

import { getUsageAction } from "@/app/actions/usage";
import { MetaLabel } from "@/components/layout/PanelHeading";
import { cn } from "@/lib/utils";
import type { UsageReport } from "@/lib/data/usage";

/**
 * Расход на модель: кто и по каким делам обращался.
 *
 * Зачем это в настройках, а не в отдельном разделе аналитики. Вопрос «почему
 * в этом месяце вышло дороже» задают не аналитику, а тому, кто платит, и
 * ответить на него надо там же, где он управляет участниками. Две таблицы
 * закрывают оба практических случая: сотрудник, который что-то запустил в
 * цикле, и дело, которое оказалось дороже остальных.
 *
 * Токены показываем рядом с деньгами намеренно. Деньги отвечают «сколько», а
 * токены — «почему»: тысяча страниц по копейке и десять по рублю дают одну
 * сумму, но это разные истории.
 */

const PERIODS = [
  { days: 7, label: "Неделя" },
  { days: 30, label: "Месяц" },
  { days: 90, label: "Квартал" },
];

export function UsagePanel({ initial }: { initial: UsageReport }) {
  const [report, setReport] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const choosePeriod = (days: number) => {
    startTransition(async () => {
      const result = await getUsageAction(days);

      if (result.ok && result.data) {
        setReport(result.data);
        setError(null);
        return;
      }

      setError(result.ok ? null : result.error || "Отчёт не собрался.");
    });
  };

  const isEmpty = report.totals.requests === 0;

  return (
    <div className="flex flex-col gap-8">
      {/* Период */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {PERIODS.map((period) => (
            <button
              key={period.days}
              type="button"
              onClick={() => choosePeriod(period.days)}
              disabled={isPending}
              className={cn(
                "rounded border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors",
                report.days === period.days
                  ? "border-fg text-fg"
                  : "border-line text-fg-subtle hover:border-fg-faint hover:text-fg",
                isPending && "opacity-60"
              )}
            >
              {period.label}
            </button>
          ))}
        </div>

        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-fg-faint">
          Валюта маршрутизатора
        </span>
      </div>

      {error && (
        <p className="rounded border border-red-200 bg-red-50/60 px-4 py-3 text-[13px] text-red-700">
          {error}
        </p>
      )}

      {isEmpty ? (
        <p className="rounded-lg border border-dashed border-line-strong px-5 py-8 text-center text-[13px] text-fg-subtle">
          За этот период обращений к модели не было.
        </p>
      ) : (
        <>
          {/* Итог */}
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-surface-3 sm:grid-cols-4">
            <Total label="Расход" value={formatMoney(report.totals.cost)} />
            <Total label="Запросов" value={String(report.totals.requests)} />
            <Total
              label="Токенов"
              value={formatTokens(report.totals.tokensIn + report.totals.tokensOut)}
            />
            <Total
              label="Неудачных"
              value={String(report.totals.failed)}
              alarm={report.totals.failed > 0}
            />
          </div>

          <Table
            caption="По участникам"
            head={["Участник", "Запросы", "Токены", "Расход"]}
            rows={report.members.map((member) => ({
              key: member.memberId ?? "worker",
              cells: [
                <span key="name" className="flex min-w-0 flex-col">
                  <span className="truncate text-fg">{member.fullName}</span>
                  {member.email && (
                    <span className="truncate text-[11px] text-fg-faint">
                      {member.email}
                    </span>
                  )}
                </span>,
                <Requests key="req" total={member.requests} failed={member.failed} />,
                formatTokens(member.tokensIn + member.tokensOut),
                formatMoney(member.cost),
              ],
            }))}
          />

          <Table
            caption="По делам"
            head={["Дело", "Запросы", "Токены", "Расход"]}
            rows={report.cases.map((item) => ({
              key: item.caseId,
              cells: [
                <span key="title" className="flex min-w-0 flex-col">
                  <span className="truncate text-fg">{item.title}</span>
                  <span className="truncate text-[11px] text-fg-faint">
                    {item.documents} {plural(item.documents)}
                  </span>
                </span>,
                <Requests key="req" total={item.requests} failed={item.failed} />,
                formatTokens(item.tokensIn + item.tokensOut),
                formatMoney(item.cost),
              ],
            }))}
          />
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Total({
  label,
  value,
  alarm,
}: {
  label: string;
  value: string;
  alarm?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5 bg-surface px-4 py-4">
      <MetaLabel>{label}</MetaLabel>
      <span
        className={cn(
          "text-[19px] font-medium tabular-nums tracking-[-0.02em]",
          alarm ? "text-red-600" : "text-fg"
        )}
      >
        {value}
      </span>
    </div>
  );
}

function Requests({ total, failed }: { total: number; failed: number }) {
  return (
    <span className="tabular-nums">
      {total}
      {failed > 0 && (
        <span className="ml-1.5 text-red-600" title="Неудачных заданий">
          −{failed}
        </span>
      )}
    </span>
  );
}

function Table({
  caption,
  head,
  rows,
}: {
  caption: string;
  head: string[];
  rows: { key: string; cells: React.ReactNode[] }[];
}) {
  if (rows.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <MetaLabel>{caption}</MetaLabel>

      <div className="scrollable-area overflow-x-auto">
        <table className="w-full border-collapse text-left text-[13px]">
          <thead>
            <tr className="border-b border-line">
              {head.map((title, index) => (
                <th
                  key={title}
                  className={cn(
                    "py-2 pr-6 font-mono text-[10px] font-normal uppercase tracking-[0.12em] text-fg-faint",
                    index > 0 && "text-right"
                  )}
                >
                  {title}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-line-soft">
                {row.cells.map((cell, index) => (
                  <td
                    key={index}
                    className={cn(
                      "max-w-[16rem] py-3 pr-6 align-top text-fg-soft",
                      index > 0 && "text-right tabular-nums"
                    )}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Деньги с точностью до копейки.
 *
 * Округлять до рублей нельзя: страница распознавания стоит семь копеек, и
 * после округления весь отчёт превратился бы в столбец нулей.
 */
function formatMoney(value: number): string {
  return `${value.toFixed(2)} ₽`;
}

/** Токены тысячами: точное число здесь никому не нужно, порядок — нужен. */
function formatTokens(value: number): string {
  if (value < 1000) return String(value);
  return `${(value / 1000).toFixed(1)}K`;
}

function plural(count: number): string {
  const last = count % 10;
  const teen = count % 100;

  if (teen >= 11 && teen <= 14) return "документов";
  if (last === 1) return "документ";
  if (last >= 2 && last <= 4) return "документа";
  return "документов";
}
