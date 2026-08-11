"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";

import { updatePasswordAction } from "@/app/actions/auth";
import {
  FormError,
  FormHeading,
  PasswordField,
} from "@/components/auth/fields";
import { Button } from "@/components/ui/button";
import { validatePassword } from "@/lib/auth/validation";

/**
 * Новый пароль по ссылке из письма.
 *
 * К этому моменту переход по ссылке уже обменян на сессию восстановления —
 * этим занимается /auth/callback. Здесь остаётся только задать пароль; если
 * сессии нет, действие вернёт понятный отказ, а не молча ничего не сделает.
 */
export function ResetPasswordForm({ hasSession }: { hasSession: boolean }) {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [repeatError, setRepeatError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!hasSession) {
    return (
      <div className="flex flex-col">
        <FormHeading
          eyebrow="Восстановление"
          title="Ссылка недействительна"
          description="Ссылка устарела или уже использована. Запросите новую — прежний пароль при этом продолжает работать."
        />

        <Link
          href="/auth/forgot-password"
          className="mt-7 w-fit border-b border-line-strong pb-0.5 text-sm text-fg transition-colors hover:border-fg"
        >
          Запросить новую ссылку
        </Link>
      </div>
    );
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isPending) return;

    const localError = validatePassword(password);
    setPasswordError(localError);
    const mismatch = password !== repeat ? "Пароли не совпадают." : null;
    setRepeatError(mismatch);
    if (localError || mismatch) return;

    setError(null);

    startTransition(async () => {
      const result = await updatePasswordAction(password);

      if (!result.ok) {
        setError(result.error ?? "Не удалось сменить пароль.");
        return;
      }

      /*
       * Отправляем в приложение, а не на страницу входа: сессия восстановления
       * уже действует, и требовать пароль сразу после его смены — лишний шаг.
       */
      router.replace("/dashboard");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col" noValidate>
      <FormHeading
        eyebrow="Восстановление"
        title="Новый пароль"
        description="Придумайте пароль, которого нет у вас в других сервисах."
      />

      <div className="mt-8 flex flex-col gap-4">
        <PasswordField
          label="Новый пароль"
          strength
          required
          value={password}
          error={passwordError}
          onChange={(event) => {
            setPassword(event.target.value);
            if (passwordError) setPasswordError(null);
          }}
          placeholder="Минимум 8 знаков, буквы и цифры"
          autoComplete="new-password"
          autoFocus
        />

        <PasswordField
          label="Повторите пароль"
          required
          value={repeat}
          error={repeatError}
          onChange={(event) => {
            setRepeat(event.target.value);
            if (repeatError) setRepeatError(null);
          }}
          placeholder="Тот же пароль"
          autoComplete="new-password"
        />
      </div>

      {error && (
        <div className="mt-5">
          <FormError>{error}</FormError>
        </div>
      )}

      <Button type="submit" disabled={isPending} className="mt-7 h-11 gap-2">
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ArrowRight className="h-4 w-4" />
        )}
        Сохранить пароль
      </Button>
    </form>
  );
}
