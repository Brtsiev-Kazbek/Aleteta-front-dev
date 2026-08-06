"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowRight, Loader2, MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

/** Человеческие формулировки вместо англоязычных сообщений Supabase. */
function describeError(message: string): string {
  const text = message.toLowerCase();

  if (text.includes("invalid login credentials")) {
    return "Неверная почта или пароль.";
  }
  if (text.includes("email not confirmed")) {
    return "Почта не подтверждена — откройте письмо со ссылкой.";
  }
  if (text.includes("user already registered")) {
    return "Такой пользователь уже есть. Войдите вместо регистрации.";
  }
  if (text.includes("password should be at least")) {
    return "Пароль слишком короткий — минимум 6 символов.";
  }
  if (text.includes("rate limit") || text.includes("too many")) {
    return "Слишком много попыток. Подождите минуту.";
  }
  return message;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/dashboard";

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setPending] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isPending) return;

    setError(null);
    setPending(true);

    try {
      const supabase = createClient();

      if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;

        // refresh(), а не только push(): серверные компоненты должны
        // перечитать данные уже под новой сессией.
        router.replace(nextPath);
        router.refresh();
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName.trim() || undefined },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        },
      });
      if (signUpError) throw signUpError;

      // Если проект требует подтверждения почты, сессии в ответе не будет.
      if (data.session) {
        router.replace(nextPath);
        router.refresh();
      } else {
        setNeedsConfirmation(true);
      }
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Не удалось выполнить вход.";
      setError(describeError(message));
    } finally {
      setPending(false);
    }
  }

  if (needsConfirmation) {
    return (
      <div className="flex flex-col">
        <span className="flex items-center gap-2.5">
          <span aria-hidden className="h-px w-6 bg-violet-500" />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400">
            Почти всё
          </span>
        </span>

        <h1 className="mt-5 text-[1.75rem] font-medium leading-[1.12] tracking-[-0.03em] text-stone-900">
          Подтвердите почту
        </h1>

        <div className="mt-6 flex items-start gap-3 border-t border-stone-200 pt-5">
          <MailCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <p className="text-sm leading-relaxed text-stone-600">
            Отправили письмо на <span className="text-stone-900">{email}</span>.
            Откройте ссылку из него — и вернётесь сюда уже вошедшим.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setNeedsConfirmation(false);
            setMode("signin");
          }}
          className="mt-6 w-fit border-b border-stone-300 pb-0.5 text-sm text-stone-600 transition-colors hover:border-stone-900 hover:text-stone-900"
        >
          Вернуться ко входу
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col">
      <span className="flex items-center gap-2.5">
        <span aria-hidden className="h-px w-6 bg-violet-500" />
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-400">
          {mode === "signin" ? "Вход" : "Регистрация"}
        </span>
      </span>

      <h1 className="mt-5 text-[1.75rem] font-medium leading-[1.12] tracking-[-0.03em] text-stone-900">
        {mode === "signin" ? "С возвращением" : "Создайте аккаунт"}
      </h1>

      <p className="mt-3 text-sm leading-relaxed text-stone-500">
        {mode === "signin"
          ? "Войдите, чтобы продолжить работу над делами."
          : "Рабочее пространство создастся автоматически."}
      </p>

      <div className="mt-8 flex flex-col gap-4">
        {mode === "signup" && (
          <label className="flex flex-col gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400">
              Как к вам обращаться
            </span>
            <Input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Казбек Брциев"
              autoComplete="name"
            />
          </label>
        )}

        <label className="flex flex-col gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400">
            Почта
          </span>
          <Input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.ru"
            autoComplete="email"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400">
            Пароль
          </span>
          <Input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Минимум 6 символов"
            autoComplete={
              mode === "signin" ? "current-password" : "new-password"
            }
          />
        </label>
      </div>

      {error && (
        <div className="mt-5 flex items-start gap-2.5 border-l-2 border-red-300 bg-red-50/60 py-2.5 pl-3 pr-3">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-500" />
          <span className="text-[13px] leading-relaxed text-red-800">
            {error}
          </span>
        </div>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className={cn("mt-7 h-11 gap-2", isPending && "opacity-80")}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ArrowRight className="h-4 w-4" />
        )}
        {mode === "signin" ? "Войти" : "Зарегистрироваться"}
      </Button>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setError(null);
        }}
        className="mt-6 w-fit text-sm text-stone-500 transition-colors hover:text-stone-900"
      >
        {mode === "signin" ? (
          <>
            Нет аккаунта?{" "}
            <span className="border-b border-stone-300 pb-0.5 text-stone-900">
              Зарегистрироваться
            </span>
          </>
        ) : (
          <>
            Уже есть аккаунт?{" "}
            <span className="border-b border-stone-300 pb-0.5 text-stone-900">
              Войти
            </span>
          </>
        )}
      </button>
    </form>
  );
}
