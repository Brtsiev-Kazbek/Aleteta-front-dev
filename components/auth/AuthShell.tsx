import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * Общий каркас экранов входа, регистрации и восстановления пароля.
 *
 * Правая половина — не украшение: человек, который пришёл по ссылке из письма
 * или с лендинга, должен понимать, куда попал, не читая форму. Поэтому там
 * пронумерованный список возможностей — той же типографикой, что рубрики
 * лендинга, — и строка о том, где лежат данные.
 */
export function AuthShell({
  children,
  eyebrow,
  heading,
  points,
  /** Приписка под списком: чем этот экран отличается от соседних. */
  footnote,
}: {
  children: ReactNode;
  eyebrow: string;
  heading: string;
  points: string[];
  footnote?: string;
}) {
  return (
    <div className="flex min-h-screen bg-bg">
      {/* Форма */}
      <div className="flex w-full flex-col px-6 py-8 sm:px-10 lg:w-[46%] lg:px-14 lg:py-10">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="group flex w-fit items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-inverse text-body font-medium text-inverse-fg">
              А
            </span>
            <span className="text-body-lg font-medium tracking-tight text-fg">
              Алетейя
            </span>
          </Link>

          {/* Выход на лендинг: с формы входа обратной дороги иначе нет. */}
          <Link
            href="/"
            className="group inline-flex items-center gap-1.5 font-mono text-label uppercase text-fg-faint transition-colors hover:text-fg"
          >
            <ArrowLeft className="h-3 w-3 transition-transform duration-300 group-hover:-translate-x-0.5" />
            На главную
          </Link>
        </div>

        <div className="flex flex-1 items-center py-12">
          <div className="w-full max-w-[26rem]">{children}</div>
        </div>

        <p className="font-mono text-label uppercase text-fg-faint">
          © 2026 Алетейя
        </p>
      </div>

      {/* Смысловая часть — зачем этот экран */}
      <div className="relative hidden overflow-hidden bg-inverse lg:flex lg:w-[54%]">
        {/*
          Свечение берётся из общей заготовки, а не собирается здесь стилем в
          разметке: своё пятно не совпадало с лендингом ни радиусом, ни
          оттенком, и вход выглядел похожим, но чужим.
        */}
        <div
          aria-hidden
          className="mesh-dark pointer-events-none absolute inset-0 opacity-90"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-grid-dark opacity-50"
        />
        {/* Мягкое затемнение к низу: список не «висит» в пустоте. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-inverse to-transparent"
        />

        <div className="relative flex w-full flex-col justify-center px-14 xl:px-20">
          <span className="font-mono text-label uppercase text-brand-line/70">
            {eyebrow}
          </span>

          <h2 className="mt-5 max-w-lg text-display font-medium leading-[1.15] text-inverse-fg">
            {heading}
          </h2>

          <ul className="mt-10 flex max-w-lg flex-col gap-2">
            {points.map((item, index) => (
              <li
                key={item}
                className="glass flex items-baseline gap-4 rounded-2xl px-5 py-3.5"
              >
                <span className="shrink-0 font-mono text-label tabular-nums text-brand-line/70">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-body leading-relaxed text-inverse-fg/70">
                  {item}
                </span>
              </li>
            ))}
          </ul>

          {footnote && (
            <p className="mt-8 max-w-md text-body leading-relaxed text-inverse-fg/40">
              {footnote}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
