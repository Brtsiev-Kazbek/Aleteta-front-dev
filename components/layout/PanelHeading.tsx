import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PanelHeadingProps {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  /** Действия справа от заголовка. */
  action?: ReactNode;
  className?: string;
}

/**
 * Рубрика экрана приложения набирается тем же приёмом, что и первый экран
 * лендинга: волосяная линия, моноширинная метка, крупный заголовок с плотным
 * трекингом. Плашка с заливкой уместна в маркетинге, но на рабочем экране
 * она перетягивает внимание с содержимого.
 */
export function PanelHeading({
  eyebrow,
  title,
  description,
  action,
  className,
}: PanelHeadingProps) {
  return (
    <div
      className={cn("flex flex-wrap items-end justify-between gap-4", className)}
    >
      <div className="flex min-w-0 flex-col">
        <span className="flex items-center gap-2.5">
          <span aria-hidden className="h-px w-6 bg-violet-500" />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400">
            {eyebrow}
          </span>
        </span>

        <h1 className="mt-5 max-w-2xl text-[1.75rem] font-medium leading-[1.12] tracking-[-0.03em] text-stone-900">
          {title}
        </h1>

        {description && (
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-stone-500">
            {description}
          </p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** Мелкая моноширинная подпись — для метаданных и заголовков блоков. */
export function MetaLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400",
        className
      )}
    >
      {children}
    </span>
  );
}
