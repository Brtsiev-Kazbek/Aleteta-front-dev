"use client";

import { useId, useState, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";

import { Input, type InputProps } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { measurePassword } from "@/lib/auth/validation";

/**
 * Поля форм аутентификации.
 *
 * Ошибка показывается под конкретным полем, а не общим списком сверху: когда
 * форма из пяти строк, «проверьте данные» заставляет искать проблему глазами.
 */

/*
 * Поля форм заметно выше продуктовых: на экране входа их три, а не тридцать,
 * и попадание пальцем важнее плотности. Кольцо фокуса — не украшение: рамка
 * толщиной в пиксель на светлом фоне почти не читается, а по клавиатуре
 * ходить по форме надо не глядя.
 */
const FIELD_CLASSES =
  "h-11 rounded-md transition-shadow focus-visible:border-stone-900 focus-visible:ring-4 focus-visible:ring-stone-900/5";

const FIELD_ERROR_CLASSES =
  "border-red-300 focus-visible:border-red-500 focus-visible:ring-red-500/10";

export function Field({
  label,
  error,
  hint,
  children,
  htmlFor,
}: {
  label: string;
  error?: string | null;
  hint?: ReactNode;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      {/*
        Подпись и подсказка — соседи, а не вложенные элементы: в подсказке
        бывает ссылка («Забыли пароль?»), а внутри <label> нажатие на неё
        уходит полю ввода вместо перехода.
      */}
      <div className="flex items-baseline justify-between gap-3">
        <label
          htmlFor={htmlFor}
          className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400"
        >
          {label}
        </label>
        {hint}
      </div>

      {children}

      {error && (
        <span className="flex items-start gap-1.5 text-[12px] leading-relaxed text-red-700">
          <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-500" />
          {error}
        </span>
      )}
    </div>
  );
}

export function TextField({
  label,
  error,
  hint,
  className,
  ...props
}: InputProps & { label: string; error?: string | null; hint?: ReactNode }) {
  const generatedId = useId();
  const id = props.id ?? generatedId;

  return (
    <Field label={label} error={error} hint={hint} htmlFor={id}>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        className={cn(FIELD_CLASSES, error && FIELD_ERROR_CLASSES, className)}
        {...props}
      />
    </Field>
  );
}

/**
 * Пароль с возможностью подсмотреть введённое и полоской надёжности.
 *
 * Показ пароля — не украшение: на телефоне вслепую промахиваются, и человек
 * уходит с формы, решив, что не помнит пароль.
 */
export function PasswordField({
  label,
  error,
  strength = false,
  className,
  hint,
  ...props
}: InputProps & {
  label: string;
  error?: string | null;
  /** Полоска надёжности — только там, где пароль придумывают. */
  strength?: boolean;
  hint?: ReactNode;
}) {
  const generatedId = useId();
  const id = props.id ?? generatedId;
  const [isVisible, setVisible] = useState(false);

  const value = typeof props.value === "string" ? props.value : "";
  const measured = measurePassword(value);

  return (
    <Field label={label} error={error} hint={hint} htmlFor={id}>
      <div className="relative">
        <Input
          id={id}
          type={isVisible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          className={cn(
            FIELD_CLASSES,
            "pr-11",
            error && FIELD_ERROR_CLASSES,
            className
          )}
          {...props}
        />

        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute inset-y-1 right-1 flex w-9 items-center justify-center rounded text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-900"
          aria-label={isVisible ? "Скрыть пароль" : "Показать пароль"}
        >
          {isVisible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>

      {strength && measured.score > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex h-0.5 flex-1 gap-1">
            {[1, 2, 3].map((step) => (
              <span
                key={step}
                className={cn(
                  "h-full flex-1 rounded-full transition-colors",
                  measured.score >= step
                    ? measured.score === 1
                      ? "bg-red-400"
                      : measured.score === 2
                        ? "bg-amber-400"
                        : "bg-emerald-500"
                    : "bg-stone-200"
                )}
              />
            ))}
          </div>
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-stone-400">
            {measured.label}
          </span>
        </div>
      )}
    </Field>
  );
}

/** Общая ошибка формы: то, что относится не к полю, а ко всей отправке. */
export function FormError({ children }: { children: ReactNode }) {
  if (!children) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 border-l-2 border-red-300 bg-red-50/60 py-2.5 pl-3 pr-3"
    >
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
      <span className="text-[13px] leading-relaxed text-red-800">{children}</span>
    </div>
  );
}

/** Подтверждение успеха там, где после отправки на экране ничего не меняется. */
export function FormSuccess({ children }: { children: ReactNode }) {
  if (!children) return null;

  return (
    <div className="flex items-start gap-2.5 border-l-2 border-emerald-300 bg-emerald-50/60 py-2.5 pl-3 pr-3">
      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
      <span className="text-[13px] leading-relaxed text-emerald-900">
        {children}
      </span>
    </div>
  );
}

/** Заголовок формы: рубрика, название, пояснение. */
export function FormHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <span className="flex items-center gap-2.5">
        <span aria-hidden className="h-px w-6 bg-violet-500" />
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400">
          {eyebrow}
        </span>
      </span>

      <h1 className="mt-5 text-[1.75rem] font-medium leading-[1.12] tracking-[-0.03em] text-stone-900">
        {title}
      </h1>

      {description && (
        <p className="mt-3 text-sm leading-relaxed text-stone-500">
          {description}
        </p>
      )}
    </div>
  );
}
