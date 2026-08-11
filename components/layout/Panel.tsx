import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Панель — прямоугольник со своим краем, в который сложено одно смысловое целое.
 *
 * ЗАЧЕМ ОТДЕЛЬНЫЙ КОМПОНЕНТ. Раньше каждый экран собирал такой блок сам: где-то
 * `border-b` под заголовком, где-то полная рамка, где-то ничего. Из-за этого
 * рабочие экраны выглядели набором несогласованных кусков, а лендинг — цельным,
 * хотя приёмы там ровно те же.
 *
 * ПОЧЕМУ КРУПНЫЙ РАДИУС ТОЛЬКО ЗДЕСЬ. Радиус привязан к размеру предмета:
 * шестнадцать точек на панели в пол-экрана читаются как мягкий край, те же
 * шестнадцать на кнопке высотой тридцать шесть — как таблетка. Поэтому панели
 * скруглены крупно, а элементы управления остались на своих восьми: одинаковый
 * средний радиус на всём подряд — то, из-за чего интерфейс выглядит собранным
 * из готовых частей.
 */
export function Panel({
  title,
  meta,
  action,
  className,
  bodyClassName,
  children,
}: {
  title?: ReactNode;
  /** Мелкая подпись справа от заголовка: счётчик, пояснение, состояние. */
  meta?: ReactNode;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  const hasHeader = Boolean(title || meta || action);

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-line bg-surface",
        className
      )}
    >
      {hasHeader && (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div className="flex min-w-0 items-baseline gap-3">
            {title && (
              <h2 className="truncate text-body font-medium text-fg">{title}</h2>
            )}
            {meta && (
              <span className="shrink-0 font-mono text-label uppercase text-fg-faint">
                {meta}
              </span>
            )}
          </div>

          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}

      <div className={cn("px-5 py-4", bodyClassName)}>{children}</div>
    </section>
  );
}
