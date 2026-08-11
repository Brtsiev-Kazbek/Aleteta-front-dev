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
    title: "Разработчикам",
    links: [
      { href: "/docs", label: "Документация" },
      { href: "/docs/development", label: "Как начать" },
      { href: "/docs/data-model", label: "Модель данных" },
    ],
  },
  {
    title: "Компания",
    links: [
      { href: "/auth/login", label: "Войти" },
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
    <footer className="bg-bg">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-5">
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded bg-inverse text-body font-medium text-inverse-fg">
                А
              </span>
              <span className="text-body font-medium text-fg">
                Алетейя
              </span>
            </Link>

            <p className="mt-4 max-w-[15rem] text-caption leading-relaxed text-fg-subtle">
              Рабочее пространство для дел и документов. Проверяет реквизиты
              до генерации, а не после.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.title} className="flex flex-col">
              <span className="font-mono text-label uppercase text-fg-faint">
                {column.title}
              </span>

              <nav className="mt-4 flex flex-col gap-2.5">
                {column.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-body text-fg-soft transition-colors hover:text-fg"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-2 border-t border-line pt-6 sm:flex-row sm:items-center">
          <span className="font-mono text-label uppercase text-fg-faint">
            © 2026 Алетейя · Владикавказ
          </span>
          <span className="font-mono text-label uppercase text-fg-faint">
            Ранний доступ
          </span>
        </div>
      </div>
    </footer>
  );
}
