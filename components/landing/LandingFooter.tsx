import Link from "next/link";

const COLUMNS = [
  {
    title: "Продукт",
    links: [
      { href: "#features", label: "Возможности" },
      { href: "#audience", label: "Кому подходит" },
      { href: "#pricing", label: "Тарифы" },
      { href: "#faq", label: "Вопросы" },
    ],
  },
  {
    title: "Компания",
    links: [
      { href: "/dashboard", label: "Войти" },
      { href: "mailto:hello@aleteya.ru", label: "Написать нам" },
    ],
  },
  {
    title: "Правовое",
    links: [
      { href: "/legal/privacy", label: "Конфиденциальность" },
      { href: "/legal/terms", label: "Условия использования" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="bg-stone-50">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded bg-stone-950 text-[13px] font-medium text-white">
                А
              </span>
              <span className="text-sm font-medium tracking-[-0.01em] text-stone-900">
                Алетейя
              </span>
            </Link>

            <p className="mt-4 max-w-[15rem] text-xs leading-relaxed text-stone-500">
              Рабочее пространство для дел и документов. Проверяет реквизиты
              до генерации, а не после.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title} className="flex flex-col">
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400">
                {column.title}
              </span>

              <nav className="mt-4 flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-[13px] text-stone-600 transition-colors hover:text-stone-900"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-2 border-t border-stone-200 pt-6 sm:flex-row sm:items-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-stone-400">
            © 2026 Алетейя · Владикавказ
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-stone-400">
            Ранний доступ
          </span>
        </div>
      </div>
    </footer>
  );
}
