"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

/**
 * Навигация раздела — те же вкладки-капсулы, что в деле.
 *
 * Стеклянные, потому что лежат на тёмной полосе шапки: непрозрачная плашка на
 * свечении смотрелась бы наклейкой. Активная вкладка держится белой заливкой,
 * переезжающей через `layoutId`, — единственная анимация макета в разделе.
 */

const TABS = [
  { href: "/admin", label: "Обзор" },
  { href: "/admin/workspaces", label: "Пространства" },
  { href: "/admin/users", label: "Пользователи" },
  { href: "/admin/jobs", label: "Задания" },
];

export function AdminNav() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  return (
    <nav className="-mx-8 overflow-x-auto px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="glass flex w-max gap-1 rounded-full p-1">
        {TABS.map((tab) => {
          /*
           * Точное совпадение для обзора и префикс для остальных: иначе на
           * `/admin/jobs` подсветятся обе вкладки — обзор просто потому, что
           * его путь является началом любого другого.
           */
          const active =
            tab.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative rounded-full px-4 py-2 text-body transition-colors",
                active ? "text-inverse" : "text-inverse-fg/60 hover:text-inverse-fg"
              )}
            >
              {active && (
                <motion.span
                  layoutId="admin-tab"
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 420, damping: 38 }
                  }
                  className="absolute inset-0 rounded-full bg-inverse-fg"
                />
              )}
              <span className="relative whitespace-nowrap">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
