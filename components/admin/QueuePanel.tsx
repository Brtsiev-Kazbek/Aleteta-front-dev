import { Panel } from "@/components/layout/Panel";
import { ActionButton } from "@/components/admin/ActionButton";
import { requeueFailedAction } from "@/app/actions/admin";
import { cn, formatDateTime } from "@/lib/utils";
import type { JobStatus, QueueRow } from "@/lib/data/admin";

/**
 * Очередь заданий по состояниям — и кнопка, которой её чинят.
 *
 * ПОЧЕМУ ЭТО ПЕРВЫЙ БЛОК РАЗДЕЛА. Задание, застрявшее в работе, пользователь
 * видит как «ничего не происходит»: файл загружен, текста нет, жаловаться не
 * на что. Администратор должен узнать об этом раньше, чем ему напишут.
 *
 * ВОЗРАСТ САМОГО СТАРОГО важнее числа. Три задания в очереди — норма, если
 * старшему полминуты, и авария, если ему четвёртые сутки. Число без возраста
 * не отличает одно от другого.
 *
 * МАССОВЫЙ ПЕРЕЗАПУСК СТОИТ ЗДЕСЬ, а не в журнале: чинят обычно не одно
 * задание, а последствие одной причины — не выложенного исполнителя, кончившегося
 * ключа. Перебирать четырнадцать строк руками ради этого незачем.
 */

const META: Record<
  JobStatus,
  { label: string; bar: string; dot: string; alarming: boolean }
> = {
  queued: { label: "В очереди", bar: "bg-fg-ghost", dot: "bg-fg-ghost", alarming: false },
  running: { label: "В работе", bar: "bg-brand", dot: "bg-brand", alarming: false },
  done: { label: "Готово", bar: "bg-ok", dot: "bg-ok", alarming: false },
  failed: { label: "Ошибка", bar: "bg-danger", dot: "bg-danger", alarming: true },
  cancelled: { label: "Отменено", bar: "bg-surface-3", dot: "bg-surface-3", alarming: false },
};

/** Порядок жизни задания — в нём же и показываем. */
const ORDER: JobStatus[] = ["queued", "running", "done", "failed", "cancelled"];

export function QueuePanel({
  queue,
  className,
}: {
  queue: QueueRow[];
  className?: string;
}) {
  const byStatus = new Map(queue.map((row) => [row.status, row]));
  const total = queue.reduce((sum, row) => sum + row.jobs, 0);
  const failed = byStatus.get("failed")?.jobs ?? 0;
  const inFlight =
    (byStatus.get("queued")?.jobs ?? 0) + (byStatus.get("running")?.jobs ?? 0);

  const shown = ORDER.filter((status) => (byStatus.get(status)?.jobs ?? 0) > 0);

  return (
    <Panel
      title="Очередь заданий"
      meta={`${total} всего`}
      className={className}
      action={
        failed > 0 ? (
          <ActionButton
            tone="danger"
            action={() => requeueFailedAction()}
            confirm={`Вернуть в очередь все упавшие задания (${failed})? Счётчик попыток сбросится.`}
          >
            Перезапустить упавшие
          </ActionButton>
        ) : inFlight > 0 ? (
          <span className="rounded-full border border-brand-line bg-brand-soft px-2.5 py-1 font-mono text-label uppercase text-brand-strong">
            {inFlight} в работе
          </span>
        ) : (
          <span className="rounded-full border border-ok-line bg-ok-bg px-2.5 py-1 font-mono text-label uppercase text-ok-fg">
            Чисто
          </span>
        )
      }
    >
      {total === 0 ? (
        <p className="py-6 text-body text-fg-subtle">
          Заданий не было. Первое появится после загрузки документа.
        </p>
      ) : (
        <>
          <div className="flex h-2.5 overflow-hidden rounded-full bg-surface-3">
            {shown.map((status) => (
              <div
                key={status}
                style={{
                  width: `${((byStatus.get(status)?.jobs ?? 0) / total) * 100}%`,
                }}
                className={META[status].bar}
              />
            ))}
          </div>

          <ul className="mt-5 flex flex-col divide-y divide-line-soft">
            {shown.map((status) => {
              const row = byStatus.get(status);
              const meta = META[status];

              return (
                <li key={status} className="flex items-center gap-3 py-2.5">
                  <span
                    aria-hidden
                    className={cn("h-2 w-2 shrink-0 rounded-full", meta.dot)}
                  />

                  <span className="text-body text-fg-muted">{meta.label}</span>

                  {row?.oldest && (status === "queued" || status === "running") && (
                    <span className="truncate font-mono text-label uppercase text-fg-faint">
                      старшему с {formatDateTime(row.oldest)}
                    </span>
                  )}

                  <span
                    className={cn(
                      "ml-auto font-mono text-body tabular-nums",
                      meta.alarming ? "text-danger-fg" : "text-fg"
                    )}
                  >
                    {row?.jobs ?? 0}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Panel>
  );
}
