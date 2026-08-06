import "server-only";

import { headers } from "next/headers";

/**
 * Адрес, на который возвращают ссылки из писем.
 *
 * Жёстко прописать нельзя: тот же код работает на localhost, на превью-сборке
 * Netlify и на боевом домене. Сначала смотрим переменную окружения — она нужна
 * для писем, отправляемых вне запроса, — иначе собираем адрес из заголовков
 * текущего запроса.
 */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/+$/, "");

  const headerList = headers();
  // За обратным прокси настоящий адрес приходит в x-forwarded-*.
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto =
    headerList.get("x-forwarded-proto") ??
    (host?.startsWith("localhost") ? "http" : "https");

  if (!host) return "http://localhost:3000";
  return `${proto}://${host}`;
}

/**
 * Внутренний путь для возврата после входа.
 *
 * Принимаем только относительные пути: адрес приходит из строки запроса, и без
 * проверки страница входа превращается в открытый редирект — удобную площадку
 * для фишинга под нашим доменом.
 */
export function safeNextPath(value: string | null | undefined): string {
  if (!value) return "/dashboard";
  if (!value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}
