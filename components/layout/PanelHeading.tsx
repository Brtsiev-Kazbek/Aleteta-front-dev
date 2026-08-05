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
 * Рубрика экрана приложения — тот же язык, что и разделы лендинга:
 * метка-пилюля, крупный заголовок с плотным трекингом, подпись.
 */
export function PanelHeading({
  eyebrow,
  title,
  description,
  action,
  className,
}: PanelHeadingProps) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="flex min-w-0 flex-col">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-violet-200/70 bg-violet-50 px-3 py-1.5 text-[11px] font-medium tracking-wide text-violet-700">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
          {eyebrow}
        </span>

        <h1 className="mt-4 text-2xl font-medium leading-[1.15] tracking-[-0.025em] text-stone-900 sm:text-[1.75rem]">
          {title}
        </h1>

        {description && (
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone-600">
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
