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
 * Рубрика экрана приложения — та же, что над разделами лендинга: моноширинная
 * метка фирменным цветом, под ней крупный заголовок с плотным трекингом.
 *
 * Волосяная линия перед меткой убрана. На лендинге её нет, и держалась она на
 * одном соображении — «чтобы метка не висела в воздухе»; на деле метка,
 * набранная цветом, стоит сама, а линия добавляла экрану ещё одну горизонталь
 * там, где их и так хватает.
 *
 * Заголовок остаётся выключенным влево и того же кегля: рабочий экран человек
 * открывает по сорок раз в день, и заголовок во весь кадр здесь был бы
 * издевательством. Одинаковый язык — не одинаковый размер.
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
        <span className="font-mono text-label uppercase text-brand">
          {eyebrow}
        </span>

        <h1 className="mt-4 max-w-2xl text-heading font-medium leading-[1.12] text-fg">
          {title}
        </h1>

        {description && (
          <p className="mt-3 max-w-xl text-body leading-relaxed text-fg-subtle">
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
        "font-mono text-label uppercase text-fg-faint",
        className
      )}
    >
      {children}
    </span>
  );
}
