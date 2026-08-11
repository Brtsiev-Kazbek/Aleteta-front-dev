import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Подиум под демонстрацией.
 *
 * Сами демонстрации — это куски продукта: белая карточка на белом разделе.
 * Без подложки они сливаются с фоном страницы и читаются как ещё один блок
 * вёрстки, а не как экран приложения. Подиум даёт им границу, лёгкую тень и
 * сетку под ней — тот же приём, что под превью в герое, поэтому продукт на
 * лендинге везде выглядит одним и тем же объектом.
 *
 * Содержимое не трогаем: тень навешивается на первого потомка селектором,
 * иначе пришлось бы править все восемь демонстраций ради одной рамки.
 */
export function DemoStage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border border-line/80 bg-gradient-to-b from-white to-stone-50/60 p-2.5 sm:p-3.5",
        className
      )}
    >
      {/* Сетка под демонстрацией: гаснет к краям, чтобы не спорить с контентом. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
      >
        <div className="absolute inset-0 bg-grid opacity-[0.35] mask-fade-b" />
      </div>

      {/* Волосяной акцент сверху — тот же, что у выделенного тарифа. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent"
      />

      <div className="relative [&>*]:shadow-panel">{children}</div>
    </div>
  );
}
