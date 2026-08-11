import { Panel } from "@/components/layout/Panel";
import { cn } from "@/lib/utils";
import type { SpendDay } from "@/lib/data/admin";

/**
 * Расход и нагрузка по дням.
 *
 * СТОЛБИКИ, А НЕ ЛИНИЯ. Линия говорит о непрерывной величине — температуре,
 * остатке; здесь же каждый день это отдельная порция работы, и промежуточных
 * значений между вторником и средой не существует. Столбик честнее.
 *
 * КРАСНАЯ ЧАСТЬ СТОЛБИКА — доля упавших заданий в этот день, а не отдельный
 * ряд. Так видно и объём, и качество разом: тридцать заданий, из них двадцать
 * красных, читается с одного взгляда, а два ряда рядом пришлось бы сличать.
 *
 * СЕТКА НЕ РИСУЕТСЯ. Точные числа нужны редко и лежат под графиком; линии
 * сетки на тридцати столбиках дают частокол, в котором теряются сами столбики.
 */
export function SpendChart({
  spend,
  className,
}: {
  spend: SpendDay[];
  className?: string;
}) {
  const maxJobs = Math.max(1, ...spend.map((day) => day.jobs));
  const totalCost = spend.reduce((sum, day) => sum + day.cost, 0);
  const totalJobs = spend.reduce((sum, day) => sum + day.jobs, 0);
  const totalFailed = spend.reduce((sum, day) => sum + day.failed, 0);

  return (
    <Panel
      title="Нагрузка и расход"
      meta={`${spend.length} дней`}
      className={className}
    >
      <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
        <Figure value={`$${totalCost.toFixed(2)}`} label="расход" />
        <Figure value={String(totalJobs)} label="заданий" />
        <Figure
          value={String(totalFailed)}
          label="упало"
          alarming={totalFailed > 0}
        />
      </div>

      {/* Столбики */}
      <div className="mt-6 flex h-28 items-end gap-[3px]">
        {spend.map((day) => {
          const height = day.jobs === 0 ? 0 : (day.jobs / maxJobs) * 100;
          const failedShare = day.jobs === 0 ? 0 : (day.failed / day.jobs) * 100;

          return (
            <div
              key={day.day}
              title={`${day.day}: ${day.jobs} заданий, ${day.failed} упало, $${day.cost.toFixed(4)}`}
              className="flex h-full flex-1 flex-col justify-end"
            >
              {day.jobs === 0 ? (
                /* День без заданий — волосок у основания, а не пустота:
                   иначе провал в середине читается как обрыв данных. */
                <span className="h-px w-full rounded-full bg-line" />
              ) : (
                <span
                  style={{ height: `${Math.max(height, 6)}%` }}
                  className="flex w-full flex-col justify-end overflow-hidden rounded-[3px] bg-brand"
                >
                  <span
                    style={{ height: `${failedShare}%` }}
                    className="w-full bg-danger"
                  />
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between font-mono text-label uppercase text-fg-faint">
        <span>{spend[0]?.day ?? ""}</span>
        <span>{spend[spend.length - 1]?.day ?? ""}</span>
      </div>
    </Panel>
  );
}

function Figure({
  value,
  label,
  alarming,
}: {
  value: string;
  label: string;
  alarming?: boolean;
}) {
  return (
    <span className="flex items-baseline gap-2">
      <span
        className={cn(
          "font-mono text-title tabular-nums",
          alarming ? "text-danger-fg" : "text-fg"
        )}
      >
        {value}
      </span>
      <span className="font-mono text-label uppercase text-fg-faint">
        {label}
      </span>
    </span>
  );
}
