"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { RotateCcw, XCircle } from "lucide-react";

import { cancelJobAction, requeueJobAction } from "@/app/actions/admin";
import { ActionButton } from "@/components/admin/ActionButton";
import { Panel } from "@/components/layout/Panel";
import { cn, formatDateTime } from "@/lib/utils";
import type { AdminJob, AiTask, JobStatus } from "@/lib/data/admin";

/**
 * Журнал заданий с фильтрами и починкой.
 *
 * ФИЛЬТР ЖИВЁТ В АДРЕСЕ, а не в состоянии компонента. Причина простая:
 * администратор, разобравшийся с упавшим распознаванием, кидает ссылку на этот
 * же срез второму человеку — а ссылка без фильтра ведёт на общий список, где
 * искать надо заново. Побочно это чинит и кнопку «назад».
 *
 * ТЕКСТ ОШИБКИ ПОКАЗАН ЦЕЛИКОМ И СРАЗУ, без раскрытия. Ради одного нажатия на
 * каждую строку журнал перестают читать, а он ровно для того и нужен, чтобы
 * прочесть причину не вставая.
 */

const TASKS: { value: AiTask; label: string }[] = [
  { value: "ocr", label: "Распознавание" },
  { value: "extract", label: "Разбор реквизитов" },
  { value: "review", label: "Разбор договора" },
  { value: "assistant", label: "Ассистент" },
  { value: "freeform", label: "Свободный документ" },
  { value: "bulk", label: "По нескольким делам" },
  { value: "package", label: "Пакет документов" },
  { value: "embed", label: "Индексация" },
];

const STATUSES: { value: JobStatus; label: string }[] = [
  { value: "queued", label: "В очереди" },
  { value: "running", label: "В работе" },
  { value: "done", label: "Готово" },
  { value: "failed", label: "Ошибка" },
  { value: "cancelled", label: "Отменено" },
];

const STATUS_STYLE: Record<JobStatus, string> = {
  queued: "border-line bg-bg text-fg-subtle",
  running: "border-brand-line bg-brand-soft text-brand-strong",
  done: "border-ok-line bg-ok-bg text-ok-fg",
  failed: "border-danger-line bg-danger-bg text-danger-fg",
  cancelled: "border-line bg-bg text-fg-faint",
};

export function JobsTable({ jobs }: { jobs: AdminJob[] }) {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const status = params.get("status");
  const task = params.get("task");

  /** Ссылка на тот же список с изменённым фильтром. */
  function withParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const query = next.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  return (
    <Panel
      title="Задания"
      meta={`${jobs.length} последних`}
      bodyClassName="p-2"
      action={
        <select
          value={task ?? ""}
          onChange={(event) =>
            router.push(withParam("task", event.target.value || null))
          }
          className="h-9 rounded-lg border border-line bg-bg px-2.5 text-body text-fg outline-none transition-colors focus:border-fg"
        >
          <option value="">Все задачи</option>
          {TASKS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      }
    >
      {/* Состояния — капсулами: их пять, и по ним щёлкают чаще всего */}
      <div className="flex flex-wrap gap-1.5 px-1 pb-3">
        <FilterChip href={withParam("status", null)} active={!status}>
          Все
        </FilterChip>

        {STATUSES.map((item) => (
          <FilterChip
            key={item.value}
            href={withParam("status", item.value)}
            active={status === item.value}
          >
            {item.label}
          </FilterChip>
        ))}
      </div>

      {jobs.length === 0 ? (
        <p className="px-3 py-8 text-body text-fg-subtle">
          По этому срезу заданий нет.
        </p>
      ) : (
        <ul className="flex flex-col">
          {jobs.map((job) => (
            <li
              key={job.id}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl px-3 py-3 transition-colors hover:bg-bg"
            >
              <span
                className={cn(
                  "shrink-0 rounded-full border px-2.5 py-1 font-mono text-label uppercase",
                  STATUS_STYLE[job.status]
                )}
              >
                {STATUSES.find((item) => item.value === job.status)?.label ??
                  job.status}
              </span>

              <span className="text-body text-fg">
                {TASKS.find((item) => item.value === job.task)?.label ??
                  job.task}
              </span>

              <span className="min-w-0 flex-1 truncate font-mono text-label uppercase text-fg-faint">
                {job.workspaceName ?? "—"}
                {job.actorEmail ? ` · ${job.actorEmail}` : ""}
                {job.model ? ` · ${job.model}` : ""}
                {job.attempts > 1 ? ` · попыток ${job.attempts}` : ""}
              </span>

              {job.cost > 0 && (
                <span className="shrink-0 font-mono text-label tabular-nums text-fg-subtle">
                  ${job.cost.toFixed(4)}
                </span>
              )}

              <span className="shrink-0 whitespace-nowrap font-mono text-label uppercase text-fg-ghost">
                {formatDateTime(job.createdAt)}
              </span>

              <span className="flex shrink-0 items-start gap-1.5">
                {(job.status === "failed" || job.status === "cancelled") && (
                  <ActionButton action={() => requeueJobAction(job.id)}>
                    <RotateCcw className="h-3 w-3" />
                    Повторить
                  </ActionButton>
                )}

                {(job.status === "queued" || job.status === "running") && (
                  <ActionButton
                    tone="danger"
                    action={() => cancelJobAction(job.id)}
                    confirm="Отменить задание?"
                  >
                    <XCircle className="h-3 w-3" />
                    Отменить
                  </ActionButton>
                )}
              </span>

              {job.error && (
                <span className="w-full break-words text-caption leading-relaxed text-danger-fg">
                  {job.error}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      className={cn(
        "rounded-full border px-3 py-1.5 text-caption transition-colors",
        active
          ? "border-transparent bg-inverse text-inverse-fg"
          : "border-line bg-bg text-fg-subtle hover:border-line-strong hover:text-fg"
      )}
    >
      {children}
    </Link>
  );
}
