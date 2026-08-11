import { Panel } from "@/components/layout/Panel";
import { cn } from "@/lib/utils";

/**
 * Очередь заданий по состояниям.
 *
 * ПОЧЕМУ ЭТО ПЕРВЫЙ БЛОК. Задание, застрявшее в `running`, для пользователя
 * выглядит как «ничего не происходит»: файл загружен, а текста нет и жалобы
 * нет. Узнать об этом администратор должен раньше, чем ему напишут.
 *
 * ПОЛОСА, А НЕ ПОНЧИК. Состояний пять, и три из них в норме почти пустые.
 * Круговая диаграмма на таких данных превращается в кольцо одного цвета с
 * тремя невидимыми полосками; горизонтальная полоса честно показывает, что
 * почти всё готово, и заодно даёт место подписям.
 */

/** Порядок жизни задания — в нём же и показываем. */
const ORDER = ["queued", "running", "done", "failed", "canceled"] as const;

const META: Record<
  string,
  { label: string; bar: string; dot: string; alarming: boolean }
> = {
  queued: {
    label: "В очереди",
    bar: "bg-fg-ghost",
    dot: "bg-fg-ghost",
    alarming: false,
  },
  running: {
    label: "В работе",
    bar: "bg-brand",
    dot: "bg-brand",
    alarming: false,
  },
  done: { label: "Готово", bar: "bg-ok", dot: "bg-ok", alarming: false },
  failed: {
    label: "Ошибка",
    bar: "bg-danger",
    dot: "bg-danger",
    alarming: true,
  },
  canceled: {
    label: "Отменено",
    bar: "bg-surface-3",
    dot: "bg-surface-3",
    alarming: false,
  },
};

export function AdminQueue({
  queue,
  className,
}: {
  queue: Record<string, number>;
  className?: string;
}) {
  const known = ORDER.filter((status) => (queue[status] ?? 0) > 0);

  /* Состояние, которого нет в списке, — признак смены схемы, а не пустяк. */
  const unknown = Object.keys(queue).filter(
    (status) => !ORDER.includes(status as (typeof ORDER)[number])
  );

  const total = Object.values(queue).reduce((sum, value) => sum + value, 0);
  const failed = queue.failed ?? 0;
  const stuck = (queue.queued ?? 0) + (queue.running ?? 0);

  return (
    <Panel
      title="Очередь заданий"
      meta={`${total} всего`}
      className={className}
      action={
        failed > 0 ? (
          <span className="rounded-full border border-danger-line bg-danger-bg px-2.5 py-1 font-mono text-label uppercase text-danger-fg">
            {failed} с ошибкой
          </span>
        ) : stuck > 0 ? (
          <span className="rounded-full border border-brand-line bg-brand-soft px-2.5 py-1 font-mono text-label uppercase text-brand-strong">
            {stuck} в работе
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
          Заданий пока не было. Первое появится после загрузки документа.
        </p>
      ) : (
        <>
          {/* Полоса состояний */}
          <div className="flex h-2.5 overflow-hidden rounded-full bg-surface-3">
            {known.map((status) => (
              <div
                key={status}
                style={{ width: `${((queue[status] ?? 0) / total) * 100}%` }}
                className={META[status]?.bar}
              />
            ))}
          </div>

          <ul className="mt-5 flex flex-col divide-y divide-line-soft">
            {known.map((status) => {
              const meta = META[status];
              const value = queue[status] ?? 0;

              return (
                <li
                  key={status}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      className={cn("h-2 w-2 rounded-full", meta?.dot)}
                      aria-hidden
                    />
                    <span className="text-body text-fg-muted">
                      {meta?.label ?? status}
                    </span>
                  </span>

                  <span
                    className={cn(
                      "font-mono text-body tabular-nums",
                      meta?.alarming && value > 0 ? "text-danger-fg" : "text-fg"
                    )}
                  >
                    {value}
                  </span>
                </li>
              );
            })}

            {unknown.map((status) => (
              <li
                key={status}
                className="flex items-center justify-between gap-3 py-2.5"
              >
                <span className="text-body text-warn-fg">
                  Неизвестное состояние: {status}
                </span>
                <span className="font-mono text-body tabular-nums text-fg">
                  {queue[status]}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  );
}
