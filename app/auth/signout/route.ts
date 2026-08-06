import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Выход. Только POST: по GET браузеры и предзагрузчики ссылок выкидывали бы
 * человека из аккаунта без его участия.
 */
export async function POST(request: NextRequest) {
  const supabase = createClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/auth/login", request.nextUrl.origin), {
    status: 303,
  });
}
