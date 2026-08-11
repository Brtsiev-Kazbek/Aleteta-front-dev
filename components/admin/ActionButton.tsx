"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

import type { ActionResult } from "@/app/actions/admin";
import { cn } from "@/lib/utils";

/**
 * Кнопка управляющего действия.
 *
 * ТРИ ВЕЩИ, БЕЗ КОТОРЫХ КНОПКА В АДМИНКЕ ОПАСНА, и все три здесь:
 *
 * 1. Подтверждение на необратимом. Архивирование пространства и снятие прав
 *    делаются одним нажатием, а объясняются потом. Спрашиваем до.
 * 2. Видимое ожидание. Действие идёт через сеть и перерисовку страницы; без
 *    признака работы человек нажимает второй раз, и запрос уходит дважды.
 * 3. Текст отказа рядом с кнопкой. «Это последний администратор установки» —
 *    ровно то, что нужно прочесть, и прятать это в консоль нельзя.
 *
 * Отказ показывается всплывающей подписью под кнопкой, а не общим уведомлением
 * наверху экрана: в таблице из сорока строк общее уведомление не говорит, к
 * какой строке относится.
 */
export function ActionButton({
  action,
  children,
  confirm,
  tone = "quiet",
  className,
  disabled,
}: {
  action: () => Promise<ActionResult>;
  children: ReactNode;
  /** Текст вопроса. Без него действие выполняется сразу. */
  confirm?: string;
  tone?: "quiet" | "danger" | "primary";
  className?: string;
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handle() {
    if (confirm && !window.confirm(confirm)) return;

    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error ?? "Не получилось.");
    });
  }

  return (
    <span className="relative inline-flex flex-col items-stretch">
      <button
        type="button"
        onClick={handle}
        disabled={disabled || pending}
        className={cn(
          "inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border px-3 text-caption transition-colors",
          "disabled:pointer-events-none disabled:opacity-50",
          tone === "danger" &&
            "border-danger-line bg-danger-bg text-danger-fg hover:border-danger",
          tone === "primary" &&
            "border-transparent bg-inverse text-inverse-fg hover:bg-fg",
          tone === "quiet" &&
            "border-line bg-bg text-fg-muted hover:border-line-strong hover:text-fg",
          className
        )}
      >
        {pending && <Loader2 className="h-3 w-3 animate-spin" />}
        {children}
      </button>

      {error && (
        <span className="mt-1 max-w-[18rem] text-caption leading-snug text-danger-fg">
          {error}
        </span>
      )}
    </span>
  );
}
