"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Шапка лендинга.
 *
 * До прокрутки шапка прозрачная и лежит на тёмном первом экране; после первых
 * восьми точек превращается в стеклянную капсулу, оторванную от края. Это не
 * украшение: полоса во всю ширину на светлой середине страницы читается как
 * ещё одна секция и съедает верх кадра, а капсула остаётся предметом поверх
 * содержимого и не спорит с ним.
 *
 * ЦВЕТ НАДПИСЕЙ ЗАВИСИТ ОТ ТОГО, ЧТО ПОД НИМИ. На первом экране фон тёмный, и
 * шапка светлая; ниже фон светлый — шапка становится тёмной. Один и тот же цвет
 * в обоих положениях либо пропадёт вверху, либо внизу.
 *
 * НА ТЕЛЕФОНЕ НАВИГАЦИИ РАНЬШЕ НЕ БЫЛО ВОВСЕ: пункты просто прятались под `lg`,
 * и до тарифов приходилось листать всю страницу. Теперь под кнопкой — панель на
 * всю ширину, а не выпадающий список: пункты крупные, попасть пальцем можно не
 * целясь.
 */

const NAV_LINKS = [
  { href: "#features", label: "Возможности" },
  { href: "#how", label: "Как работает" },
  { href: "#audience", label: "Кому подходит" },
  { href: "#pricing", label: "Тарифы" },
];

export function LandingHeader() {
  const [isScrolled, setScrolled] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Открытое меню не должно прокручивать страницу под собой. */
  useEffect(() => {
    if (!isMenuOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isMenuOpen]);

  /* Пункт меню — это якорь; после перехода панель обязана закрыться сама. */
  useEffect(() => {
    if (!isMenuOpen) return;
    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [isMenuOpen]);

  /** Тёмная шапка нужна только над светлым фоном — то есть после прокрутки. */
  const onLight = isScrolled || isMenuOpen;

  return (
    <>
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
        className="fixed inset-x-0 top-0 z-50 px-4 pt-3 sm:px-6 sm:pt-4"
      >
        <div
          className={cn(
            "mx-auto flex h-14 max-w-5xl items-center justify-between rounded-full pl-5 pr-2 transition-all duration-300",
            onLight
              ? "glass-light"
              : "border border-transparent bg-transparent"
          )}
        >
          <Link
            href="/"
            className="flex items-center gap-2.5"
            onClick={() => setMenuOpen(false)}
          >
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-lg text-body font-medium transition-colors",
                onLight ? "bg-inverse text-inverse-fg" : "bg-inverse-fg/95 text-inverse"
              )}
            >
              А
            </span>
            <span
              className={cn(
                "text-body-lg font-medium tracking-tight transition-colors",
                onLight ? "text-fg" : "text-inverse-fg"
              )}
            >
              Алетейя
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-3.5 py-2 text-body transition-colors",
                  onLight
                    ? "text-fg-subtle hover:bg-fg/5 hover:text-fg"
                    : "text-inverse-fg/60 hover:bg-inverse-fg/10 hover:text-inverse-fg"
                )}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <Link
              href="/auth/login"
              className={cn(
                "hidden rounded-full px-3.5 py-2 text-body transition-colors sm:block",
                onLight
                  ? "text-fg-subtle hover:text-fg"
                  : "text-inverse-fg/60 hover:text-inverse-fg"
              )}
            >
              Войти
            </Link>

            <Link
              href="/auth/register"
              className={cn(
                "inline-flex h-10 items-center rounded-full px-5 text-body font-medium transition-colors",
                onLight
                  ? "bg-inverse text-inverse-fg hover:bg-fg"
                  : "bg-inverse-fg text-inverse hover:bg-inverse-fg/90"
              )}
            >
              Начать
            </Link>

            <button
              type="button"
              aria-label={isMenuOpen ? "Закрыть меню" : "Открыть меню"}
              aria-expanded={isMenuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full transition-colors lg:hidden",
                onLight
                  ? "text-fg hover:bg-fg/5"
                  : "text-inverse-fg hover:bg-inverse-fg/10"
              )}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Меню телефона */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-bg lg:hidden"
          >
            <nav className="flex flex-col px-6 pt-24">
              {NAV_LINKS.map((link, index) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.04 * index }}
                  className="border-b border-line py-5 text-title font-medium text-fg"
                >
                  {link.label}
                </motion.a>
              ))}

              <motion.a
                href="/auth/login"
                onClick={() => setMenuOpen(false)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.04 * NAV_LINKS.length }}
                className="py-5 text-title font-medium text-fg-subtle"
              >
                Войти
              </motion.a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
