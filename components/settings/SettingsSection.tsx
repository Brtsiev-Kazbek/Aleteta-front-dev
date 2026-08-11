import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * Раздел настроек: заголовок, пояснение, содержимое.
 *
 * Вынесен отдельно, потому что разделов пять и каждый норовит обзавестись
 * собственными отступами. Общий каркас держит страницу единообразной.
 */
export function SettingsSection({
  id,
  icon: Icon,
  title,
  description,
  aside,
  children,
}: {
  /** Якорь для боковой навигации. */
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  /** Правый верхний угол: роль, тариф, состояние. */
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    /*
     * scroll-mt: без отступа переход по якорю прижимает заголовок к самому
     * краю прокручиваемой области, и раздел выглядит обрезанным.
     */
    <section
      id={id}
      className="scroll-mt-8 overflow-hidden rounded-2xl border border-line bg-surface"
    >
      <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <Icon className="h-4 w-4" />
          </span>
          <div className="flex min-w-0 flex-col">
            <h2 className="text-body font-medium text-fg">{title}</h2>
            <span className="mt-1 text-body text-fg-subtle">{description}</span>
          </div>
        </div>

        {aside}
      </div>

      <div className="px-6 py-6">{children}</div>
    </section>
  );
}
