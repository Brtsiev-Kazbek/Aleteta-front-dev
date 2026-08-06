import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Продление сессии на каждом запросе.
 *
 * Токен живёт час; без обновления пользователя выбрасывало бы из приложения
 * посреди работы. Серверные компоненты писать cookie не умеют, поэтому
 * продление живёт здесь — это единственное место, где ответ ещё можно
 * изменить.
 *
 * Заодно закрываем приложение от неаутентифицированных: на защищённых путях
 * без сессии отправляем на вход.
 */

/** Пути, доступные без входа. */
const PUBLIC_PREFIXES = ["/", "/auth", "/api/auth"];

function isPublic(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.some(
    (prefix) => prefix !== "/" && pathname.startsWith(prefix)
  );
}

/*
 * Формы входа и регистрации вошедшему показывать незачем: он попал на них по
 * старой закладке или по кнопке «назад». Смена пароля в этот список не входит
 * — на неё как раз приходят с действующей сессией восстановления.
 */
const GUEST_ONLY = ["/auth/login", "/auth/register", "/auth/forgot-password"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Без настроек Supabase приложение всё ещё должно открываться — иначе
  // невозможно посмотреть лендинг на свежем клоне репозитория.
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  /*
   * Именно getUser(), а не getSession(): первый проверяет токен на сервере,
   * второй лишь читает cookie, содержимое которой клиент может подделать.
   */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublic(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    // Возврат туда, куда человек шёл, после успешного входа.
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && GUEST_ONLY.includes(pathname)) {
    const target = request.nextUrl.clone();
    target.pathname = "/dashboard";
    target.search = "";
    return NextResponse.redirect(target);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Всё, кроме статики и картинок: гонять их через проверку сессии — это
     * лишний запрос к базе на каждый файл.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
