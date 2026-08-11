import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { AdminNav } from "@/components/admin/AdminNav";
import { requirePlatformAdmin } from "@/lib/data/admin";

export const dynamic = "force-dynamic";

/**
 * Оболочка раздела администрирования.
 *
 * ПРАВО ПРОВЕРЯЕТСЯ ЗДЕСЬ, А НЕ НА КАЖДОЙ СТРАНИЦЕ. Оболочка в Next выполняется
 * до вложенной страницы, поэтому одна проверка закрывает весь раздел разом — и,
 * что важнее, закроет и ту страницу, которую допишут через полгода и забудут
 * защитить. Страницы всё равно зовут функции `platform_*`, а те спрашивают
 * право сами, так что забывчивость стоит лишнего запроса, а не утечки.
 *
 * ШАПКА ТА ЖЕ, ЧТО В КАБИНЕТЕ: тёмная полоса со свечением. Это одна установка,
 * и раздел администратора не должен выглядеть отдельной программой.
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const admin = await requirePlatformAdmin();

  return (
    <div className="min-h-screen bg-bg">
      <header className="relative overflow-hidden bg-inverse">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="mesh-dark absolute inset-0 opacity-90" />
          <div className="bg-grid-dark absolute inset-0 opacity-50" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-inverse" />
        </div>

        <div className="relative mx-auto max-w-6xl px-8 pb-14 pt-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <Link
                href="/dashboard"
                className="group inline-flex items-center gap-1.5 font-mono text-label uppercase text-inverse-fg/40 transition-colors hover:text-inverse-fg"
              >
                <ArrowLeft className="h-3 w-3 transition-transform duration-200 group-hover:-translate-x-0.5" />
                В кабинет
              </Link>

              <h1 className="mt-5 text-heading font-medium text-inverse-fg">
                Администрирование
              </h1>

              <p className="mt-2 text-body-lg text-inverse-fg/55">
                Установка целиком: арендаторы, люди, очередь и расход.
              </p>
            </div>

            <span className="glass shrink-0 rounded-full px-3.5 py-2 text-caption text-inverse-fg/70">
              {admin.email}
            </span>
          </div>

          <div className="mt-8">
            <AdminNav />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-8 pb-20">{children}</div>
    </div>
  );
}
