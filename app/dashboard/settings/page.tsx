import { Bell, Building2, KeyRound, ShieldCheck, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Sidebar } from "@/components/layout/Sidebar";
import { PanelHeading } from "@/components/layout/PanelHeading";

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
    <div className="flex h-screen overflow-hidden bg-stone-50">
      <Sidebar />

      <main className="scrollable-area min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-8 py-12">
          <PanelHeading
            eyebrow="Настройки"
            title="Профиль и реквизиты организации"
            description="Эти значения подставляются в документы вместо ручного ввода."
          />

          <div className="mt-10 flex flex-col gap-10">
            {SECTIONS.map((section) => (
              <section key={section.title}>
                <div className="flex items-start gap-2.5 border-b border-stone-200 pb-3">
                  <section.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-400" />
                  <div className="flex min-w-0 flex-col">
                    <h2 className="text-[15px] font-medium tracking-[-0.01em] text-stone-900">
                      {section.title}
                    </h2>
                    <span className="mt-1 text-[13px] text-stone-500">
                      {section.description}
                    </span>
                  </div>
                </div>

                <dl className="flex flex-col divide-y divide-stone-200">
                  {section.rows.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-baseline justify-between gap-4 py-3.5"
                    >
                      <dt className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-stone-400">
                        {row.label}
                      </dt>
                      <dd className="truncate text-sm text-stone-900">
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
