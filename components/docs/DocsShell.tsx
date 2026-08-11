import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, BookOpen } from "lucide-react";

import { DOC_PAGES } from "@/lib/docs/content.generated";
import { cn } from "@/lib/utils";

const REPO = "https://github.com/Brtsiev-Kazbek/Aleteta-front-dev";

/**
 * Каркас раздела документации.
 *
 * Оглавление слева, текст справа — привычная для документации раскладка, и
 * отступать от неё некуда: человек приходит сюда за конкретным ответом и
 * должен видеть, где он находится, не прокручивая страницу.
 *
 * Оформление то же, что на остальном сайте: моноширинные рубрики, волосяные
 * линии, ни одной карточки с тенью. Документация — часть продукта, а не
 * приложение постороннего вида.
 */
export function DocsShell({
  children,
  activeSlug,
  /** Имя исходного файла: по нему собирается ссылка «Править на GitHub». */
  sourceFile,
}: {
  children: ReactNode;
  activeSlug: string;
  sourceFile?: string;
}) {
  return (
    <div className="min-h-screen bg-bg">
      {/* Шапка */}
      <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded bg-inverse text-[13px] font-medium text-inverse-fg">
                А
              </span>
              <span className="text-sm font-medium tracking-[-0.01em] text-fg">
                Алетейя
              </span>
            </Link>

            <span
              aria-hidden
              className="hidden h-4 w-px bg-surface-3 sm:block"
            />

            <span className="hidden items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-fg-faint sm:flex">
              <BookOpen className="h-3 w-3" />
              Документация
            </span>
          </div>

          <div className="flex items-center gap-5">
            <a
              href={`${REPO}/tree/main/docs/api`}
              className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-fg-faint transition-colors hover:text-fg sm:block"
            >
              Справочник по коду
            </a>
            <a
              href={REPO}
              className="group inline-flex items-center gap-1.5 text-[13px] text-fg-soft transition-colors hover:text-fg"
            >
              GitHub
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-14 px-6 py-12">
        {/* Оглавление */}
        <nav
          aria-label="Разделы документации"
          className="hidden w-52 shrink-0 lg:block"
        >
          <div className="sticky top-24">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-fg-faint">
              Разделы
            </span>

            <ul className="mt-4 flex flex-col border-l border-line">
              {DOC_PAGES.map((page, index) => {
                const isActive = page.slug === activeSlug;

                return (
                  <li key={page.slug || "index"}>
                    <Link
                      href={page.slug ? `/docs/${page.slug}` : "/docs"}
                      className={cn(
                        "-ml-px flex items-baseline gap-2.5 border-l py-2 pl-4 text-[13px] transition-colors",
                        isActive
                          ? "border-fg text-fg"
                          : "border-transparent text-fg-subtle hover:border-line-strong hover:text-fg"
                      )}
                    >
                      <span
                        className={cn(
                          "font-mono text-[10px] tabular-nums",
                          isActive ? "text-violet-600" : "text-fg-ghost"
                        )}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      {page.title}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {sourceFile && (
              <a
                href={`${REPO}/edit/main/docs/${sourceFile}`}
                className="mt-8 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-fg-faint transition-colors hover:text-fg"
              >
                Править страницу
                <ArrowUpRight className="h-3 w-3" />
              </a>
            )}
          </div>
        </nav>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
