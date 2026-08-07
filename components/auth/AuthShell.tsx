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
    <div className="flex min-h-screen bg-stone-50">
      {/* Форма */}
      <div className="flex w-full flex-col px-6 py-8 sm:px-10 lg:w-[46%] lg:px-14 lg:py-10">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="group flex w-fit items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded bg-stone-950 text-[13px] font-medium text-white">
              А
            </span>
            <span className="text-sm font-medium tracking-[-0.01em] text-stone-900">
              Алетейя
            </span>
          </Link>

          {/* Выход на лендинг: с формы входа обратной дороги иначе нет. */}
          <Link
            href="/"
            className="group inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400 transition-colors hover:text-stone-900"
          >
            <ArrowLeft className="h-3 w-3 transition-transform duration-300 group-hover:-translate-x-0.5" />
            На главную
          </Link>
        </div>

        <div className="flex flex-1 items-center py-12">
          <div className="w-full max-w-[26rem]">{children}</div>
        </div>

        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400">
          © 2026 Алетейя
        </p>
      </div>

      {/* Смысловая часть — зачем этот экран */}
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
        {/* Мягкое затемнение к низу: список не «висит» в пустоте. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-stone-950 to-transparent"
        />

        <div className="relative flex w-full flex-col justify-center px-14 xl:px-20">
          <span className="flex items-center gap-2.5">
            <span aria-hidden className="h-px w-6 bg-violet-500" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500">
              {eyebrow}
            </span>
          </span>

          <h2 className="mt-6 max-w-lg text-[2rem] font-medium leading-[1.15] tracking-[-0.03em] text-white xl:text-[2.25rem]">
            {heading}
          </h2>

          <ul className="mt-12 flex max-w-lg flex-col divide-y divide-stone-800/80 border-y border-stone-800/80">
            {points.map((item, index) => (
              <li
                key={item}
                className="group flex items-baseline gap-5 py-4 transition-colors"
              >
                <span className="shrink-0 font-mono text-[10px] tabular-nums text-stone-600 transition-colors group-hover:text-violet-400">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-sm leading-relaxed text-stone-400 transition-colors group-hover:text-stone-200">
                  {item}
                </span>
              </li>
            ))}
          </ul>

          {footnote && (
            <p className="mt-8 max-w-md text-[13px] leading-relaxed text-stone-500">
              {footnote}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
