import { Building2, LayoutGrid, ShieldCheck, UserRound, Users } from "lucide-react";

import { Sidebar } from "@/components/layout/Sidebar";
import { PanelHeading } from "@/components/layout/PanelHeading";
import { MembersPanel } from "@/components/settings/MembersPanel";
import { OrganizationForm } from "@/components/settings/OrganizationForm";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { SecurityPanel } from "@/components/settings/SecurityPanel";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { StoreBootstrap } from "@/components/layout/StoreBootstrap";
import { WorkspaceSwitcher } from "@/components/settings/WorkspaceSwitcher";
import { loadSettings } from "@/lib/data/workspace";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata = {
  title: "Настройки — Алетейя",
};

/*
 * Страница читает профиль и состав пространства, то есть данные конкретного
 * человека: кешировать её нельзя даже на секунду.
 */
export const dynamic = "force-dynamic";

const SECTION_LINKS = [
  { href: "#profile", label: "Профиль" },
  { href: "#organization", label: "Организация" },
  { href: "#members", label: "Участники" },
  { href: "#workspaces", label: "Пространства" },
  { href: "#access", label: "Доступ" },
];

const ROLE_LABELS: Record<string, string> = {
  owner: "Владелец",
  admin: "Администратор",
  member: "Участник",
  viewer: "Наблюдатель",
};

export default async function SettingsPage() {
  // Без базы настраивать нечего: показываем, чего не хватает, вместо ошибки.
  if (!isSupabaseConfigured()) {
    return <NotConfigured />;
  }

  const settings = await loadSettings();
  const canManage = settings.myRole === "owner" || settings.myRole === "admin";

  return (
    <div className="flex h-screen overflow-hidden bg-stone-50">
      {/* Сайдбару нужно имя вошедшего — данные дел здесь не читаем. */}
      <StoreBootstrap
        snapshot={{
          viewer: {
            fullName: settings.profile.fullName,
            email: settings.profile.email,
            workspaceName: settings.workspace.name,
          },
        }}
      />
      <Sidebar />

      <main className="scrollable-area min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-8 py-12">
          <PanelHeading
            eyebrow="Настройки"
            title="Профиль и реквизиты организации"
            description="Эти значения подставляются в документы вместо ручного ввода."
          />

          {/*
            Страница длинная, и до участников с самого верха три экрана
            прокрутки. Оглавление слева держит её целиком в поле зрения; на
            узком экране оно прячется — там короче путь пальцем, чем глазами.
          */}
          <div className="mt-10 lg:grid lg:grid-cols-[168px_minmax(0,1fr)] lg:gap-14">
            <nav
              aria-label="Разделы настроек"
              className="mb-10 hidden lg:sticky lg:top-0 lg:mb-0 lg:block lg:self-start"
            >
              <ul className="flex flex-col border-l border-stone-200">
                {SECTION_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="-ml-px block border-l border-transparent py-2 pl-4 font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400 transition-colors hover:border-stone-900 hover:text-stone-900"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="flex min-w-0 flex-col gap-14">
              <SettingsSection
                id="profile"
                icon={UserRound}
                title="Профиль"
                description="Данные пользователя, отображаемые в делах и документах."
                aside={
                  settings.profile.isPlatformAdmin ? (
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-violet-600">
                      администратор установки
                    </span>
                  ) : null
                }
              >
                <ProfileForm
                  fullName={settings.profile.fullName}
                  jobTitle={settings.profile.jobTitle}
                  email={settings.profile.email}
                />
              </SettingsSection>

              <SettingsSection
                id="organization"
                icon={Building2}
                title="Организация"
                description="Реквизиты, которые подставляются в шаблоны документов."
                aside={
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-stone-400">
                    тариф: {settings.workspace.plan}
                  </span>
                }
              >
                <OrganizationForm
                  workspace={settings.workspace}
                  canEdit={canManage}
                />
              </SettingsSection>

              <SettingsSection
                id="members"
                icon={Users}
                title="Участники"
                description="Кто работает с делами этого пространства."
                aside={
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-stone-400">
                    вы — {ROLE_LABELS[settings.myRole] ?? settings.myRole}
                  </span>
                }
              >
                <MembersPanel
                  members={settings.members}
                  invites={settings.invites}
                  canManage={canManage}
                />
              </SettingsSection>

              <SettingsSection
                id="workspaces"
                icon={LayoutGrid}
                title="Рабочие пространства"
                description="Где вы состоите и где работаете сейчас."
              >
                <WorkspaceSwitcher
                  workspaces={settings.workspaces}
                  currentId={settings.workspace.id}
                />
              </SettingsSection>

              <SettingsSection
                id="access"
                icon={ShieldCheck}
                title="Доступ"
                description="Пароль и адрес почты, по которому вы входите."
              >
                <SecurityPanel email={settings.profile.email} />

                <form
                  action="/auth/signout"
                  method="post"
                  className="mt-8 flex items-center justify-between gap-4 border-t border-stone-200 pt-5"
                >
                  <span className="text-[13px] text-stone-500">
                    Выйти из аккаунта на этом устройстве.
                  </span>
                  <button
                    type="submit"
                    className="shrink-0 border-b border-stone-300 pb-0.5 text-[13px] text-stone-700 transition-colors hover:border-stone-900 hover:text-stone-900"
                  >
                    Выйти
                  </button>
                </form>
              </SettingsSection>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/** Стенд без переменных окружения: настройки читать неоткуда. */
function NotConfigured() {
  return (
    <div className="flex h-screen overflow-hidden bg-stone-50">
      <Sidebar />

      <main className="scrollable-area min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-8 py-12">
          <PanelHeading
            eyebrow="Настройки"
            title="База не подключена"
            description="Приложение открыто на встроенном наборе данных — сохранять настройки некуда."
          />

          <p className="mt-8 text-sm leading-relaxed text-stone-600">
            Скопируйте <code className="text-stone-900">.env.example</code> в{" "}
            <code className="text-stone-900">.env.local</code>, заполните адрес
            проекта и ключи Supabase и примените миграции — порядок описан в{" "}
            <code className="text-stone-900">docs/SUPABASE.md</code>. После
            этого профиль, реквизиты организации и состав участников появятся
            здесь.
          </p>
        </div>
      </main>
    </div>
  );
}
