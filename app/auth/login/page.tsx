import { Suspense } from "react";
import Link from "next/link";

import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Вход — Алетейя",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen bg-stone-50">
      {/* Форма */}
      <div className="flex w-full flex-col px-6 py-10 lg:w-[46%] lg:px-14">
        <Link href="/" className="flex w-fit items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded bg-stone-950 text-[13px] font-medium text-white">
            А
          </span>
          <span className="text-sm font-medium tracking-[-0.01em] text-stone-900">
            Алетейя
          </span>
        </Link>

        <div className="flex flex-1 items-center">
          <div className="w-full max-w-sm">
            <Suspense
              fallback={
                <div className="h-64 animate-pulse rounded bg-stone-100" />
              }
            >
              <LoginForm />
            </Suspense>
          </div>
        </div>

        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400">
          © 2026 Алетейя
        </p>
      </div>

      {/* Смысловая часть — почему стоит войти */}
      <div className="relative hidden overflow-hidden bg-stone-950 lg:flex lg:w-[54%]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-grid-dark opacity-60"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(38rem 22rem at 30% 10%, rgba(139,92,246,0.18), transparent 62%)",
          }}
        />

        <div className="relative flex flex-col justify-center px-14">
          <span className="flex items-center gap-2.5">
            <span aria-hidden className="h-px w-6 bg-violet-500" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500">
              Рабочее пространство
            </span>
          </span>

          <h2 className="mt-6 max-w-md text-[2rem] font-medium leading-[1.15] tracking-[-0.03em] text-white">
            Документы, реквизиты и проверки — в одном месте
          </h2>

          <ul className="mt-10 flex max-w-md flex-col divide-y divide-stone-800 border-y border-stone-800">
            {[
              "Проверка обязательных реквизитов до генерации",
              "Пакет документов на все объекты дела одним действием",
              "Разбор договора по пунктам с судебной практикой",
            ].map((item) => (
              <li key={item} className="py-4 text-sm text-stone-400">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
