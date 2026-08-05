"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  FolderKanban,
  LayoutDashboard,
  LayoutTemplate,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CreateCaseDialog } from "@/components/layout/CreateCaseDialog";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

const STORAGE_KEY = "aleteya:sidebar-expanded";

interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
  /** Дополнительные префиксы путей, при которых пункт считается активным. */
  matches?: string[];
}

const NAV_ITEMS: NavItem[] = [
  { icon: LayoutDashboard, label: "Дашборд", href: "/dashboard" },
  {
    icon: FolderKanban,
    label: "Дела",
    href: "/dashboard/cases",
    matches: ["/cases"],
  },
  { icon: LayoutTemplate, label: "Шаблоны", href: "/dashboard/templates" },
  { icon: Settings, label: "Настройки", href: "/dashboard/settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const isExpanded = useAppStore((state) => state.isSidebarExpanded);
  const toggleSidebar = useAppStore((state) => state.toggleSidebar);
  const setCreateCaseOpen = useAppStore((state) => state.setCreateCaseOpen);

  /*
   * Состояние читаем из localStorage уже после монтирования: если читать его
   * во время рендера, серверная и клиентская разметка разойдутся и React
   * выбросит ошибку гидратации.
   */
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved !== null) toggleSidebar(saved === "true");
  }, [toggleSidebar]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, String(isExpanded));
  }, [isExpanded]);

  function isActive(item: NavItem): boolean {
    if (pathname === item.href) return true;
    return (item.matches ?? []).some((prefix) => pathname.startsWith(prefix));
  }

  return (
    <motion.aside
      // initial={false} — иначе при монтировании ширина анимируется от нуля
      // и меню «выпрыгивает» при каждом переходе между страницами.
      initial={false}
      animate={{ width: isExpanded ? 232 : 68 }}
      transition={{ duration: 0.24, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="flex h-screen shrink-0 flex-col overflow-hidden border-r border-stone-200 bg-white"
    >
      {/* Логотип */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center",
          isExpanded ? "px-4" : "justify-center px-0"
        )}
      >
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-2.5"
          aria-label="На главную"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-950 text-sm font-semibold text-white transition-transform duration-300 group-hover:scale-105">
            А
          </span>

          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.16 }}
                className="flex min-w-0 flex-col leading-none"
              >
                <span className="truncate text-sm font-semibold tracking-tight text-stone-900">
                  Алетейя
                </span>
                <span className="mt-0.5 truncate text-[10px] text-stone-400">
                  AI Document OS
                </span>
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Новое дело */}
      <div className={cn("shrink-0 pb-3", isExpanded ? "px-3" : "px-2")}>
        <MaybeTooltip show={!isExpanded} label="Новое дело">
          <Button
            size={isExpanded ? "default" : "icon"}
            onClick={() => setCreateCaseOpen(true)}
            className={cn("h-9 w-full", isExpanded && "justify-start gap-2")}
          >
            <Plus className="h-4 w-4 shrink-0" />
            {isExpanded ? (
              <span>Новое дело</span>
            ) : (
              <span className="sr-only">Новое дело</span>
            )}
          </Button>
        </MaybeTooltip>
      </div>

      {/* Навигация */}
      <nav
        className={cn(
          "flex flex-1 flex-col gap-1",
          isExpanded ? "px-3" : "items-center px-2"
        )}
      >
        {isExpanded && (
          <p className="px-3 pb-1 pt-2 text-[10px] font-medium uppercase tracking-wider text-stone-400">
            Рабочая область
          </p>
        )}

        {NAV_ITEMS.map((item) => {
          const active = isActive(item);

          return (
            <MaybeTooltip key={item.label} show={!isExpanded} label={item.label}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-10 items-center rounded-lg transition-colors",
                  isExpanded ? "w-full gap-3 px-3" : "w-10 justify-center",
                  active
                    ? "bg-violet-50 text-violet-600"
                    : "text-stone-400 hover:bg-stone-100 hover:text-stone-900"
                )}
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" />

                {isExpanded ? (
                  <span className="truncate text-sm font-medium">
                    {item.label}
                  </span>
                ) : (
                  <span className="sr-only">{item.label}</span>
                )}
              </Link>
            </MaybeTooltip>
          );
        })}
      </nav>

      {/* Профиль */}
      <div
        className={cn(
          "flex shrink-0 items-center gap-2.5 border-t border-stone-200 py-3",
          isExpanded ? "px-4" : "justify-center px-0"
        )}
      >
        <MaybeTooltip show={!isExpanded} label="Казбек Б. — Юрист-партнёр">
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-500 text-xs font-semibold text-white"
          >
            КБ
            <span className="sr-only">Профиль пользователя</span>
          </button>
        </MaybeTooltip>

        {isExpanded && (
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-medium text-stone-900">
              Казбек Б.
            </span>
            <span className="truncate text-xs text-stone-400">
              Юрист-партнёр
            </span>
          </div>
        )}
      </div>

      {/* Диалог создания дела доступен со всех экранов приложения */}
      <CreateCaseDialog />

      {/* Переключатель */}
      <div className="shrink-0 border-t border-stone-200 p-2">
        <MaybeTooltip
          show={!isExpanded}
          label="Развернуть меню"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleSidebar()}
            aria-expanded={isExpanded}
            className="h-8 w-full text-stone-400 hover:text-stone-700"
          >
            {isExpanded ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeftOpen className="h-4 w-4" />
            )}
            <span className="sr-only">
              {isExpanded ? "Свернуть меню" : "Развернуть меню"}
            </span>
          </Button>
        </MaybeTooltip>
      </div>
    </motion.aside>
  );
}

/** Оборачивает элемент в тултип только когда меню свёрнуто. */
function MaybeTooltip({
  show,
  label,
  children,
}: {
  show: boolean;
  label: string;
  children: ReactNode;
}) {
  if (!show) return <>{children}</>;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}
