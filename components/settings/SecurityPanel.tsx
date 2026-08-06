"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { changeEmailAction, changePasswordAction } from "@/app/actions/auth";
import {
  FormError,
  FormSuccess,
  PasswordField,
  TextField,
} from "@/components/auth/fields";
import { Button } from "@/components/ui/button";
import { validateEmail, validatePassword } from "@/lib/auth/validation";

/**
 * Пароль и адрес почты.
 *
 * Текущий пароль спрашивается не для порядка: сессия может быть открыта на
 * чужом незаблокированном ноутбуке, и без этой проверки пароль меняет любой,
 * кто до него дошёл.
 */
export function SecurityPanel({ email }: { email: string }) {
  const router = useRouter();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [repeatError, setRepeatError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailNotice, setEmailNotice] = useState<string | null>(null);
  const [emailFormError, setEmailFormError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  function handlePassword(event: React.FormEvent) {
    event.preventDefault();
    if (isPending) return;

    if (!current) {
      setError("Введите текущий пароль.");
      return;
    }

    const localError = validatePassword(next);
    setPasswordError(localError);
    const mismatch = next !== repeat ? "Пароли не совпадают." : null;
    setRepeatError(mismatch);
    if (localError || mismatch) return;

    setError(null);
    setNotice(null);

    startTransition(async () => {
      const result = await changePasswordAction(current, next);

      if (!result.ok) {
        setError(result.error ?? "Не удалось сменить пароль.");
        return;
      }

      setCurrent("");
      setNext("");
      setRepeat("");
      setNotice("Пароль изменён.");
      router.refresh();
    });
  }

  function handleEmail(event: React.FormEvent) {
    event.preventDefault();
    if (isPending) return;

    const localError = validateEmail(newEmail);
    setEmailError(localError);
    if (localError) return;

    setEmailFormError(null);
    setEmailNotice(null);

    startTransition(async () => {
      const result = await changeEmailAction(newEmail);

      if (!result.ok) {
        setEmailFormError(result.error ?? "Не удалось сменить почту.");
        return;
      }

      setEmailNotice(
        `Письмо отправлено на ${newEmail.trim()}. Адрес сменится после перехода по ссылке.`
      );
      setNewEmail("");
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handlePassword} className="flex flex-col gap-4" noValidate>
        <PasswordField
          label="Текущий пароль"
          value={current}
          onChange={(event) => {
            setCurrent(event.target.value);
            setNotice(null);
          }}
          placeholder="Пароль, с которым вы вошли"
          autoComplete="current-password"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <PasswordField
            label="Новый пароль"
            strength
            value={next}
            error={passwordError}
            onChange={(event) => {
              setNext(event.target.value);
              if (passwordError) setPasswordError(null);
              setNotice(null);
            }}
            placeholder="Минимум 8 знаков, буквы и цифры"
            autoComplete="new-password"
          />

          <PasswordField
            label="Повторите новый"
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

        {error && <FormError>{error}</FormError>}
        {notice && <FormSuccess>{notice}</FormSuccess>}

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isPending || !current || !next}
            className="gap-2"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Сменить пароль
          </Button>
        </div>
      </form>

      <form
        onSubmit={handleEmail}
        className="flex flex-col gap-4 border-t border-stone-200 pt-6"
        noValidate
      >
        <TextField
          label="Новый адрес почты"
          type="email"
          inputMode="email"
          value={newEmail}
          error={emailError}
          onChange={(event) => {
            setNewEmail(event.target.value);
            if (emailError) setEmailError(null);
            setEmailNotice(null);
          }}
          placeholder={email}
          autoComplete="email"
          hint={
            <span className="text-[12px] text-stone-400">
              сейчас: {email}
            </span>
          }
        />

        {emailFormError && <FormError>{emailFormError}</FormError>}
        {emailNotice && <FormSuccess>{emailNotice}</FormSuccess>}

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="outline"
            disabled={isPending || !newEmail}
            className="gap-2"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Отправить подтверждение
          </Button>
        </div>
      </form>
    </div>
  );
}
