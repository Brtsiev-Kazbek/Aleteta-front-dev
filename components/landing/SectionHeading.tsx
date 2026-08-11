import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Reveal } from "@/components/landing/Reveal";

interface SectionHeadingProps {
  /** Порядковый номер раздела: «01», «02». Страница длинная, и нумерация
   *  подсказывает, сколько уже пройдено. */
  index?: string;
  eyebrow: string;
  title: ReactNode;
  description?: string;
  align?: "left" | "center";
  tone?: "light" | "dark";
  className?: string;
}

/**
 * Рубрика раздела: компактная метка-пилюля, крупный заголовок, подзаголовок.
 * Единый ритм для всех разделов страницы.
 */
export function SectionHeading({
  index,
  eyebrow,
  title,
  description,
  align = "left",
  tone = "light",
  className,
}: SectionHeadingProps) {
  const isDark = tone === "dark";

  return (
    <Reveal
      className={cn(
        "flex flex-col",
        align === "center" && "items-center text-center",
        className
      )}
    >
      <div
        className={cn(
          "flex items-center gap-3",
          align === "center" && "justify-center"
        )}
      >
        {index && (
          <span
            className={cn(
              "font-mono text-label tabular-nums",
              isDark ? "text-fg-soft" : "text-fg-ghost"
            )}
          >
            {index}
          </span>
        )}

        <span
          className={cn(
            "inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-label font-medium ",
            isDark
              ? "border-white/10 bg-surface/5 text-brand-line"
              : "border-brand-line/70 bg-brand-soft text-brand-strong"
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              isDark ? "bg-brand" : "bg-brand"
            )}
          />
          {eyebrow}
        </span>

        {/* Линия добирает строку до края: рубрика перестаёт висеть в пустоте. */}
        <span
          aria-hidden
          className={cn(
            "h-px flex-1",
            isDark
              ? "bg-gradient-to-r from-inverse-line to-transparent"
              : "bg-gradient-to-r from-line to-transparent",
            align === "center" && "hidden"
          )}
        />
      </div>

      <h2
        className={cn(
          "mt-6 max-w-3xl text-display font-medium leading-[1.12] sm:text-display-lg",
          isDark ? "text-inverse-fg" : "text-fg",
          align === "center" && "mx-auto"
        )}
      >
        {title}
      </h2>

      {description && (
        <p
          className={cn(
            "mt-5 max-w-xl text-body-lg leading-relaxed sm:text-title-sm",
            isDark ? "text-fg-faint" : "text-fg-soft",
            align === "center" && "mx-auto"
          )}
        >
          {description}
        </p>
      )}
    </Reveal>
  );
}
