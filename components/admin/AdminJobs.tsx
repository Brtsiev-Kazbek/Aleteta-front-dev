import { Panel } from "@/components/layout/Panel";
import { cn, formatDateTime } from "@/lib/utils";
import type { AdminJob } from "@/lib/data/admin";

/**
 * Последние задания к модели.
 *
 * Журнал, а не отчёт: сюда приходят с вопросом «что случилось у этого
 * пользователя пять минут назад». Поэтому порядок обратный хронологическому, а
 * текст ошибки показан целиком в строке, а не спрятан под раскрытие: ради
 * одного клика на каждую строку журнал и перестают читать.
 */

const TASK_LABELS: Record<string, string> = {
  ocr: "Распознавание",
  extract: "Разбор реквизитов",
  review: "Разбор договора",
  chat: "Ассистент",
  generate: "Генерация",
  embed: "Индексация",
};

const STATUS_META: Record<string, { label: string; className: string }> = {
  queued: {
    label: "В очереди",
    className: "border-line bg-bg text-fg-subtle",
  },
  running: {
    label: "В работе",
    className: "border-brand-line bg-brand-soft text-brand-strong",
  },
  done: { label: "Готово", className: "border-ok-line bg-ok-bg text-ok-fg" },
  failed: {
    label: "Ошибка",
    className: "border-danger-line bg-danger-bg text-danger-fg",
  },
  canceled: {
    label: "Отменено",
    className: "border-line bg-bg text-fg-faint",
  },
};

export function AdminJobs({ jobs }: { jobs: AdminJob[] }) {
  return (
    <Panel title="Последние задания" meta={`${jobs.length} записей`} bodyClassName="p-2">
      {jobs.length === 0 ? (
        <p className="px-3 py-6 text-body text-fg-subtle">
          Заданий пока не было.
        </p>
      ) : (
        <ul className="flex flex-col">
          {jobs.map((job) => {
            const status = STATUS_META[job.status] ?? {
              label: job.status,
              className: "border-line bg-bg text-fg-subtle",
            };

            return (
              <li
                key={job.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl px-3 py-3 transition-colors hover:bg-bg"
              >
                <span
                  className={cn(
                    "shrink-0 rounded-full border px-2.5 py-1 font-mono text-label uppercase",
                    status.className
                  )}
                >
                  {status.label}
                </span>

                <span className="text-body text-fg">
                  {TASK_LABELS[job.task] ?? job.task}
                </span>

                <span className="min-w-0 flex-1 truncate font-mono text-label uppercase text-fg-faint">
                  {job.workspaceName}
                  {job.model ? ` · ${job.model}` : ""}
                  {job.attempts > 1 ? ` · попытка ${job.attempts}` : ""}
                </span>

                {job.cost > 0 && (
                  <span className="shrink-0 font-mono text-label tabular-nums text-fg-subtle">
                    ${job.cost.toFixed(4)}
                  </span>
                )}

                <span className="shrink-0 whitespace-nowrap font-mono text-label uppercase text-fg-ghost">
                  {formatDateTime(job.createdAt)}
                </span>

                {job.error && (
                  <span className="w-full break-words text-caption text-danger-fg">
                    {job.error}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
