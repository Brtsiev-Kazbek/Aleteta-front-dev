import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

/**
 * Переход по ссылке из письма.
 *
 * Сюда попадают из всех писем: подтверждение адреса, смена пароля, смена
 * почты, приглашение. Ссылка бывает двух видов, и оба нужно уметь принять:
 *
 *   ?code=…                   — обмен кода на сессию (поток PKCE);
 *   ?token_hash=…&type=…      — одноразовый код подтверждения.
 *
 * Какой из них придёт, зависит от настроек шаблонов писем в проекте, а не от
 * нашего кода. Поддерживаем оба — иначе смена шаблона тихо ломает вход.
 */

const OTP_TYPES: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
];

/** Открытый редирект недопустим: принимаем только внутренние пути. */
function safeNext(value: string | null): string {
  if (!value) return "/dashboard";
  if (!value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

function loginWithError(origin: string, code: string): NextResponse {
  const url = new URL("/auth/login", origin);
  url.searchParams.set("error", code);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const rawType = searchParams.get("type");
  const next = safeNext(searchParams.get("next"));

  // Отказ приходит и от самой службы аутентификации — например, когда человек
  // открыл просроченную ссылку.
  const providerError = searchParams.get("error");
  if (providerError) {
    return loginWithError(origin, providerError);
  }

  const supabase = createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return loginWithError(origin, "exchange_failed");
    return NextResponse.redirect(new URL(next, origin));
  }

  if (tokenHash && rawType) {
    const type = OTP_TYPES.find((item) => item === rawType);
    if (!type) return loginWithError(origin, "exchange_failed");

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (error) return loginWithError(origin, "exchange_failed");

    /*
     * У письма о смене пароля своя цель: человека ждёт форма нового пароля,
     * а не дашборд. Тип ссылки надёжнее параметра next — в шаблоне письма его
     * могли и не проставить.
     */
    const target = type === "recovery" ? "/auth/reset-password" : next;
    return NextResponse.redirect(new URL(target, origin));
  }

  return loginWithError(origin, "missing_code");
}
