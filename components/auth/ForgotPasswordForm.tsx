"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, MailCheck } from "lucide-react";

import { requestPasswordResetAction } from "@/app/actions/auth";
import {
  FormError,
  FormHeading,
  TextField,
} from "@/components/auth/fields";
import { Button } from "@/components/ui/button";
import { validateEmail } from "@/lib/auth/validation";

/**
 * Запрос ссылки на смену пароля.
 *
 * После отправки экран одинаков и для известного адреса, и для незнакомого:
 * иначе форма превращается в проверку «а зарегистрирован ли такой человек».
 */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isPending) return;

    const addressError = validateEmail(email);
    setFieldError(addressError);
    if (addressError) return;

    setError(null);

    startTransition(async () => {
      const result = await requestPasswordResetAction(email);
      if (result.ok) setSent(true);
      else setError(result.error ?? "Не удалось отправить письмо.");
    });
  }

  if (isSent) {
    return (
      <div className="flex flex-col">
        <FormHeading eyebrow="Восстановление" title="Проверьте почту" />

        <div className="mt-6 flex items-start gap-3 border-t border-line pt-5">
          <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-ok-fg" />
          <p className="text-body leading-relaxed text-fg-soft">
            Если аккаунт с адресом{" "}
            <span className="text-fg">{email.trim()}</span> существует, на
            него отправлена ссылка для смены пароля. Ссылка действует час.
          </p>
        </div>

        <Link
          href="/auth/login"
          className="mt-6 w-fit border-b border-line-strong pb-0.5 text-body text-fg-soft transition-colors hover:border-fg hover:text-fg"
        >
          Вернуться ко входу
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col" noValidate>
      <FormHeading
        eyebrow="Восстановление"
        title="Забыли пароль?"
        description="Пришлём ссылку, по которой можно задать новый."
      />

      <div className="mt-8">
        <TextField
          label="Почта"
          type="email"
          inputMode="email"
          required
          value={email}
          error={fieldError}
          onChange={(event) => {
            setEmail(event.target.value);
            if (fieldError) setFieldError(null);
          }}
          placeholder="you@example.ru"
          autoComplete="email"
          autoFocus
        />
      </div>

      {error && (
        <div className="mt-5">
          <FormError>{error}</FormError>
        </div>
      )}

      <Button type="submit" disabled={isPending} className="mt-7 h-11 gap-2 rounded-xl">
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ArrowRight className="h-4 w-4" />
        )}
        Прислать ссылку
      </Button>

      <Link
        href="/auth/login"
        className="mt-6 w-fit text-body text-fg-subtle transition-colors hover:text-fg"
      >
        Вспомнили пароль?{" "}
        <span className="border-b border-line-strong pb-0.5 text-fg">
          Войти
        </span>
      </Link>
    </form>
  );
}
