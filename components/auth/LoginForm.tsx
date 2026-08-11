"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";

import { signInAction } from "@/app/actions/auth";
import {
  FormError,
  FormHeading,
  PasswordField,
  TextField,
} from "@/components/auth/fields";
import { Button } from "@/components/ui/button";
import { describeCallbackError } from "@/lib/auth/messages";
import { validateEmail } from "@/lib/auth/validation";

/**
 * Вход по почте и паролю.
 *
 * Регистрация вынесена на отдельную страницу: раньше обе формы жили в одном
 * компоненте с переключателем, и по ссылке нельзя было попасть сразу на
 * регистрацию — с лендинга, из письма-приглашения, из инструкции.
 */
export function LoginForm({
  nextPath = "/dashboard",
  callbackError,
  notice,
}: {
  /** Куда вернуть после входа — сюда человека вёл middleware. */
  nextPath?: string;
  /** Код отказа при переходе по ссылке из письма. */
  callbackError?: string;
  notice?: string;
}) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(
    callbackError ? describeCallbackError(callbackError) : null
  );
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isPending) return;

    const addressError = validateEmail(email);
    setEmailError(addressError);
    if (addressError) return;

    if (!password) {
      setError("Введите пароль.");
      return;
    }

    setError(null);

    startTransition(async () => {
      const result = await signInAction(email, password);

      if (!result.ok) {
        setError(result.error ?? "Не удалось войти.");
        return;
      }

      /*
       * replace, а не push: страница входа не должна оставаться в истории —
       * кнопка «назад» после входа возвращала бы на форму.
       */
      router.replace(nextPath);
      // Серверные компоненты должны перечитать данные уже под новой сессией.
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col" noValidate>
      <FormHeading
        eyebrow="Вход"
        title="С возвращением"
        description="Войдите, чтобы продолжить работу над делами."
      />

      {notice === "password-changed" && (
        <p className="mt-6 border-l-2 border-emerald-300 bg-emerald-50/60 py-2.5 pl-3 pr-3 text-[13px] leading-relaxed text-emerald-900">
          Пароль изменён. Войдите с новым паролем.
        </p>
      )}

      <div className="mt-8 flex flex-col gap-4">
        <TextField
          label="Почта"
          type="email"
          inputMode="email"
          required
          value={email}
          error={emailError}
          onChange={(event) => {
            setEmail(event.target.value);
            if (emailError) setEmailError(null);
          }}
          placeholder="you@example.ru"
          autoComplete="email"
          autoFocus
        />

        <PasswordField
          label="Пароль"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Ваш пароль"
          autoComplete="current-password"
          hint={
            <Link
              href="/auth/forgot-password"
              className="text-[12px] text-fg-subtle transition-colors hover:text-fg"
            >
              Забыли пароль?
            </Link>
          }
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
        Войти
      </Button>

      <p className="mt-6 text-sm text-fg-subtle">
        Нет аккаунта?{" "}
        <Link
          href={`/auth/register?next=${encodeURIComponent(nextPath)}`}
          className="border-b border-line-strong pb-0.5 text-fg transition-colors hover:border-stone-900"
        >
          Зарегистрироваться
        </Link>
      </p>
    </form>
  );
}
