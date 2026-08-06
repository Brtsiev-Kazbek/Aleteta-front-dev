import type { ReactNode } from "react";
import Link from "next/link";

/**
 * Общий каркас экранов входа, регистрации и восстановления пароля.
 *
 * Раньше разметка жила прямо на странице входа; со второй страницей её
 * пришлось бы копировать, а с третьей — расходиться. Смысловая часть справа
 * задаётся списком: на каждом шаге человеку полезно разное.
 */
export function AuthShell({
  children,
  eyebrow,
  heading,
  points,
}: {
  children: ReactNode;
  /** Рубрика над заголовком правой половины. */
  eyebrow: string;
  heading: string;
  points: string[];
}) {
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

        <div className="flex flex-1 items-center py-10">
          <div className="w-full max-w-sm">{children}</div>
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

        <div className="relative flex flex-col justify-center px-14">
          <span className="flex items-center gap-2.5">
            <span aria-hidden className="h-px w-6 bg-violet-500" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone-500">
              {eyebrow}
            </span>
          </span>

          <h2 className="mt-6 max-w-md text-[2rem] font-medium leading-[1.15] tracking-[-0.03em] text-white">
            {heading}
          </h2>

          <ul className="mt-10 flex max-w-md flex-col divide-y divide-stone-800 border-y border-stone-800">
            {points.map((item) => (
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
