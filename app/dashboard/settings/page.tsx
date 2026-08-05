import { Bell, Building2, KeyRound, ShieldCheck, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Sidebar } from "@/components/layout/Sidebar";

interface SettingsSection {
  icon: LucideIcon;
  title: string;
  description: string;
  rows: { label: string; value: string }[];
}

const SECTIONS: SettingsSection[] = [
  {
    icon: UserRound,
    title: "Профиль",
    description: "Данные пользователя, отображаемые в делах и документах.",
    rows: [
      { label: "Имя", value: "Казбек Б." },
      { label: "Должность", value: "Юрист-партнёр" },
      { label: "Электронная почта", value: "kazbek@aleteya.ru" },
    ],
  },
  {
    icon: Building2,
    title: "Организация",
    description: "Реквизиты, которые подставляются в шаблоны документов.",
    rows: [
      { label: "Наименование", value: "ООО «Алетейя Лигал»" },
      { label: "ИНН", value: "1513000000" },
      { label: "Адрес", value: "г. Владикавказ, ул. Мира, д. 10" },
    ],
  },
  {
    icon: ShieldCheck,
    title: "Доступ и журналы",
    description: "Кто работает с делами и как долго хранится история действий.",
    rows: [
      { label: "Участников в рабочем пространстве", value: "4" },
      { label: "Двухфакторная аутентификация", value: "Включена" },
      { label: "Срок хранения журнала действий", value: "90 дней" },
    ],
  },
  {
    icon: Bell,
    title: "Уведомления",
    description: "Когда Алетейя присылает оповещения.",
    rows: [
      { label: "Завершение генерации пакета", value: "Включено" },
      { label: "Найдены критические риски", value: "Включено" },
      { label: "Еженедельная сводка по делам", value: "Отключено" },
    ],
  },
  {
    icon: KeyRound,
    title: "Доступ по API",
    description: "Интеграция Алетейи с вашими системами.",
    rows: [
      { label: "Ключ API", value: "alt_live_••••••••••••4f2c" },
      { label: "Создан", value: "12 мая 2026 г." },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      <Sidebar />

      <main className="scrollable-area min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-8 py-10">
          <header className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Настройки
            </h1>
            <p className="text-sm text-zinc-500">
              Профиль, реквизиты организации и правила обработки документов.
            </p>
          </header>

          <div className="mt-8 flex flex-col gap-5">
            {SECTIONS.map((section) => (
              <section
                key={section.title}
                className="rounded-xl border border-zinc-200 bg-white shadow-sm"
              >
                <div className="flex items-start gap-3 border-b border-zinc-200 px-5 py-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                    <section.icon className="h-4 w-4 text-zinc-500" />
                  </div>
                  <div className="flex flex-col leading-tight">
                    <h2 className="text-sm font-semibold text-zinc-900">
                      {section.title}
                    </h2>
                    <span className="mt-0.5 text-xs text-zinc-500">
                      {section.description}
                    </span>
                  </div>
                </div>

                <dl className="divide-y divide-zinc-200/70">
                  {section.rows.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-baseline justify-between gap-4 px-5 py-3.5"
                    >
                      <dt className="text-sm text-zinc-500">{row.label}</dt>
                      <dd className="truncate text-sm font-medium text-zinc-900">
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
