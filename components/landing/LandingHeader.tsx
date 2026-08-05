"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#features", label: "Возможности" },
  { href: "#audience", label: "Кому подходит" },
  { href: "#how", label: "Как работает" },
  { href: "#pricing", label: "Тарифы" },
];

export function LandingHeader() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setIsScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        isScrolled
          ? "border-b border-stone-200 bg-stone-50/85 backdrop-blur-md"
          : "border-b border-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded text-[13px] font-medium transition-colors",
              isScrolled ? "bg-stone-950 text-white" : "bg-white text-stone-950"
            )}
          >
            А
          </span>
          <span
            className={cn(
              "text-sm font-medium tracking-[-0.01em] transition-colors",
              isScrolled ? "text-stone-900" : "text-white"
            )}
          >
            Алетейя
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                "text-[13px] transition-colors",
                isScrolled
                  ? "text-stone-500 hover:text-stone-900"
                  : "text-stone-400 hover:text-white"
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <Link
            href="/dashboard"
            className={cn(
              "hidden text-[13px] transition-colors sm:block",
              isScrolled
                ? "text-stone-500 hover:text-stone-900"
                : "text-stone-400 hover:text-white"
            )}
          >
            Войти
          </Link>

          <Link
            href="/dashboard"
            className={cn(
              "inline-flex h-9 items-center rounded-md px-4 text-[13px] font-medium transition-colors",
              isScrolled
                ? "bg-stone-950 text-white hover:bg-stone-900"
                : "bg-white text-stone-950 hover:bg-stone-200"
            )}
          >
            Начать работу
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
