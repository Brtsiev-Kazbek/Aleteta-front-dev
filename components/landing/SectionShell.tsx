"use client";

import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

/**
 * Оболочка раздела: один ритм на всю страницу.
 *
 * Ритм — то, из-за чего страница читается как сделанная одним человеком, а не
 * собранная из кусков. Он держится на трёх вещах, и все три заданы здесь:
 * одинаковые вертикальные поля, одинаковая ширина колонки и одинаковый способ
 * подать заголовок.
 *
 * Заголовок раздела набран крупно и в одну мысль — как первый экран, только
 * тише. Человек листает страницу глазами, читая одни заголовки, и по ним должен
 * собрать всю историю продукта, ни разу не остановившись на подробностях.
 */

export function SectionShell({
  id,
  eyebrow,
  title,
  lead,
  tone = "light",
  className,
  children,
}: {
  id?: string;
  /** Короткая рубрика над заголовком. */
  eyebrow?: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  /**
   * Три тона вместо двух.
   *
   * `light` и `muted` различаются на один шаг серого — ровно настолько, чтобы
   * соседние разделы не слипались в одну простыню, но не настолько, чтобы
   * читалось как смена темы. `dark` — приём, а не оттенок: тёмный раздел
   * останавливает прокрутку, поэтому их на странице два, в начале и в конце.
   */
  tone?: "light" | "muted" | "dark";
  className?: string;
  children?: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const isDark = tone === "dark";
  const ground =
    tone === "dark" ? "bg-inverse" : tone === "muted" ? "bg-bg" : "bg-surface";

  const appear = {
    initial: reduceMotion ? (false as const) : { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.6, ease: [0.22, 0.61, 0.36, 1] as const },
  };

  return (
    <section
      id={id}
      className={cn("relative overflow-hidden", ground, className)}
    >
      {isDark && (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="mesh-dark absolute inset-0 opacity-70" />
        </div>
      )}

      <div className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32">
        {(eyebrow || title || lead) && (
          <motion.header {...appear} className="mx-auto max-w-3xl text-center">
            {eyebrow && (
              <span
                className={cn(
                  "font-mono text-label uppercase",
                  isDark ? "text-brand-line/70" : "text-brand"
                )}
              >
                {eyebrow}
              </span>
            )}

            <h2
              className={cn(
                "mt-4 text-section font-medium",
                isDark ? "text-inverse-fg" : "text-fg"
              )}
            >
              {title}
            </h2>

            {lead && (
              <p
                className={cn(
                  "mx-auto mt-5 max-w-2xl text-lead",
                  isDark ? "text-inverse-fg/55" : "text-fg-subtle"
                )}
              >
                {lead}
              </p>
            )}
          </motion.header>
        )}

        {children && <div className="mt-14 sm:mt-16">{children}</div>}
      </div>
    </section>
  );
}
