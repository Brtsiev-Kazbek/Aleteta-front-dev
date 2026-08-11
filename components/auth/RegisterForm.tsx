"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";

import { signUpAction } from "@/app/actions/auth";
import {
  FormError,
  FormHeading,
  PasswordField,
  TextField,
} from "@/components/auth/fields";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  validateEmail,
  validateFullName,
  validatePassword,
} from "@/lib/auth/validation";

interface FieldErrors {
  fullName?: string | null;
  email?: string | null;
  password?: string | null;
  repeat?: string | null;
}

/**
 * Регистрация.
 *
 * Должность и организация спрашиваются здесь, а не в настройках потом:
 * оба значения подставляются в документы, и без них первый же сгенерированный
 * файл придётся править руками. Обязательными их не делаем — заполнить можно
 * и позже.
 */
export function RegisterForm({
  nextPath = "/dashboard",
  invitedEmail = "",
}: {
  nextPath?: string;
  /** Адрес из ссылки-приглашения: подставляем, чтобы не набирали заново. */
  invitedEmail?: string;
}) {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [email, setEmail] = useState(invitedEmail);
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [consent, setConsent] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function validate(): boolean {
    const errors: FieldErrors = {
      fullName: validateFullName(fullName),
      email: validateEmail(email),
      password: validatePassword(password),
      repeat: password !== repeat ? "Пароли не совпадают." : null,
    };

    setFieldErrors(errors);
    return !Object.values(errors).some(Boolean);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isPending) return;

    if (!validate()) return;

    if (!consent) {
      setError("Подтвердите согласие на обработку персональных данных.");
      return;
    }

    setError(null);

    startTransition(async () => {
      const result = await signUpAction({
        fullName,
        email,
        password,
        jobTitle,
        workspaceName,
        next: nextPath,
      });

      if (!result.ok) {
        setError(result.error ?? "Не удалось зарегистрироваться.");
        return;
      }

      router.replace(nextPath);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col" noValidate>
      <FormHeading
        eyebrow="Регистрация"
        title="Создайте аккаунт"
        description="Рабочее пространство создастся автоматически. Письма и подтверждения не потребуются — после заполнения формы вы сразу окажетесь внутри."
      />

      <div className="mt-8 flex flex-col gap-4">
        <TextField
          label="Как к вам обращаться"
          required
          value={fullName}
          error={fieldErrors.fullName}
          onChange={(event) => {
            setFullName(event.target.value);
            if (fieldErrors.fullName) {
              setFieldErrors((current) => ({ ...current, fullName: null }));
            }
          }}
          placeholder="Казбек Брциев"
          autoComplete="name"
          autoFocus
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Должность"
            value={jobTitle}
            onChange={(event) => setJobTitle(event.target.value)}
            placeholder="Юрист-партнёр"
            autoComplete="organization-title"
          />

          <TextField
            label="Организация"
            value={workspaceName}
            onChange={(event) => setWorkspaceName(event.target.value)}
            placeholder="ООО «Алетейя Лигал»"
            autoComplete="organization"
          />
        </div>

        <TextField
          label="Почта"
          type="email"
          inputMode="email"
          required
          value={email}
          error={fieldErrors.email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (fieldErrors.email) {
              setFieldErrors((current) => ({ ...current, email: null }));
            }
          }}
          placeholder="you@example.ru"
          autoComplete="email"
        />

        <PasswordField
          label="Пароль"
          strength
          required
          value={password}
          error={fieldErrors.password}
          onChange={(event) => {
            setPassword(event.target.value);
            if (fieldErrors.password) {
              setFieldErrors((current) => ({ ...current, password: null }));
            }
          }}
          placeholder="Минимум 8 знаков, буквы и цифры"
          autoComplete="new-password"
        />

        <PasswordField
          label="Повторите пароль"
          required
          value={repeat}
          error={fieldErrors.repeat}
          onChange={(event) => {
            setRepeat(event.target.value);
            if (fieldErrors.repeat) {
              setFieldErrors((current) => ({ ...current, repeat: null }));
            }
          }}
          placeholder="Тот же пароль"
          autoComplete="new-password"
        />
      </div>

      <label className="mt-5 flex cursor-pointer items-start gap-2.5">
        <Checkbox
          checked={consent}
          onCheckedChange={(checked) => {
            setConsent(checked === true);
            if (checked === true) setError(null);
          }}
          className="mt-0.5"
        />
        <span className="text-body leading-relaxed text-fg-subtle">
          Согласен на обработку персональных данных и принимаю условия
          использования сервиса.
        </span>
      </label>

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
        Зарегистрироваться
      </Button>

      <p className="mt-6 text-body text-fg-subtle">
        Уже есть аккаунт?{" "}
        <Link
          href={`/auth/login?next=${encodeURIComponent(nextPath)}`}
          className="border-b border-line-strong pb-0.5 text-fg transition-colors hover:border-fg"
        >
          Войти
        </Link>
      </p>
    </form>
  );
}
