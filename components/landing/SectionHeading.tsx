import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Reveal } from "@/components/landing/Reveal";

interface SectionHeadingProps {
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
      <span
        className={cn(
          "inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium tracking-wide",
          isDark
            ? "border-white/10 bg-white/5 text-violet-300"
            : "border-violet-200/70 bg-violet-50 text-violet-700"
        )}
      >
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            isDark ? "bg-violet-400" : "bg-violet-500"
          )}
        />
        {eyebrow}
      </span>

      <h2
        className={cn(
          "mt-6 max-w-3xl text-[2rem] font-medium leading-[1.12] tracking-[-0.025em] sm:text-[2.75rem]",
          isDark ? "text-white" : "text-stone-900",
          align === "center" && "mx-auto"
        )}
      >
        {title}
      </h2>

      {description && (
        <p
          className={cn(
            "mt-5 max-w-xl text-base leading-relaxed sm:text-[17px]",
            isDark ? "text-stone-400" : "text-stone-600",
            align === "center" && "mx-auto"
          )}
        >
          {description}
        </p>
      )}
    </Reveal>
  );
}
