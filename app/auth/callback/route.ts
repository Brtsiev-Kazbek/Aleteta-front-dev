import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Обмен одноразового кода на сессию.
 *
 * Сюда попадают по ссылке из письма — подтверждение адреса, сброс пароля,
 * вход по magic link. Код обменивается на cookie, после чего человека
 * возвращают туда, куда он шёл изначально.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  // Открытый редирект недопустим: принимаем только внутренние пути.
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  if (!code) {
    const url = new URL("/auth/login", origin);
    url.searchParams.set("error", "missing_code");
    return NextResponse.redirect(url);
  }

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const url = new URL("/auth/login", origin);
    url.searchParams.set("error", "exchange_failed");
    return NextResponse.redirect(url);
  }

  return NextResponse.redirect(new URL(safeNext, origin));
}
