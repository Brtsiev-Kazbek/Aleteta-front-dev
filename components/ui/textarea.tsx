"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-line bg-surface px-3 py-2 text-body text-fg outline-none transition-colors placeholder:text-fg-faint focus:border-fg disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

/**
 * Textarea, которая автоматически растёт под содержимое.
 * Используется в AI-генераторе — поле не должно скроллиться внутри себя.
 */
const AutoGrowTextarea = React.forwardRef<
  HTMLTextAreaElement,
  TextareaProps & { maxHeight?: number }
>(({ className, maxHeight = 320, onChange, value, ...props }, forwardedRef) => {
  const innerRef = React.useRef<HTMLTextAreaElement | null>(null);

  // Пробрасываем реальный узел наружу, не подменяя его на возможный null.
  const setRefs = React.useCallback(
    (node: HTMLTextAreaElement | null) => {
      innerRef.current = node;
      if (typeof forwardedRef === "function") forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    },
    [forwardedRef]
  );

  const resize = React.useCallback(() => {
    const el = innerRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [maxHeight]);

  React.useLayoutEffect(() => {
    resize();
  }, [resize, value]);

  return (
    <textarea
      ref={setRefs}
      value={value}
      rows={1}
      onChange={(event) => {
        onChange?.(event);
        resize();
      }}
      className={cn(
        "w-full resize-none bg-transparent text-body leading-relaxed text-fg outline-none placeholder:text-fg-faint",
        className
      )}
      {...props}
    />
  );
});
AutoGrowTextarea.displayName = "AutoGrowTextarea";

export { Textarea, AutoGrowTextarea };
