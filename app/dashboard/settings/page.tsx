import {
  Building2,
  Coins,
  LayoutGrid,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";

import { Sidebar } from "@/components/layout/Sidebar";
import { PanelHeading } from "@/components/layout/PanelHeading";
import { MembersPanel } from "@/components/settings/MembersPanel";
import { OrganizationForm } from "@/components/settings/OrganizationForm";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { SecurityPanel } from "@/components/settings/SecurityPanel";
import { SettingsSection } from "@/components/settings/SettingsSection";
import { UsagePanel } from "@/components/settings/UsagePanel";
import { StoreBootstrap } from "@/components/layout/StoreBootstrap";
import { WorkspaceSwitcher } from "@/components/settings/WorkspaceSwitcher";
import { loadSettings } from "@/lib/data/workspace";
import { loadUsage } from "@/lib/data/usage";
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
  { href: "#usage", label: "Расход" },
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

  /*
   * Отчёт о расходе читаем вместе с настройками: он нужен на первой же
   * отрисовке, а отдельным запросом из браузера страница мигала бы пустой
   * таблицей.
   */
  const [settings, usage] = await Promise.all([loadSettings(), loadUsage(30)]);
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
              <ul className="flex flex-col border-l border-line">
                {SECTION_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="-ml-px block border-l border-transparent py-2 pl-4 font-mono text-[10px] uppercase tracking-[0.14em] text-fg-faint transition-colors hover:border-stone-900 hover:text-fg"
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
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-fg-faint">
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
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-fg-faint">
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
                id="usage"
                icon={Coins}
                title="Расход на модель"
                description="Сколько запросов и токенов ушло по участникам и делам."
              >
                <UsagePanel initial={usage} />
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
                  className="mt-8 flex items-center justify-between gap-4 border-t border-line pt-5"
                >
                  <span className="text-[13px] text-fg-subtle">
                    Выйти из аккаунта на этом устройстве.
                  </span>
                  <button
                    type="submit"
                    className="shrink-0 border-b border-line-strong pb-0.5 text-[13px] text-fg-muted transition-colors hover:border-stone-900 hover:text-fg"
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

          <p className="mt-8 text-sm leading-relaxed text-fg-soft">
            Скопируйте <code className="text-fg">.env.example</code> в{" "}
            <code className="text-fg">.env.local</code>, заполните адрес
            проекта и ключи Supabase и примените миграции — порядок описан в{" "}
            <code className="text-fg">docs/SUPABASE.md</code>. После
            этого профиль, реквизиты организации и состав участников появятся
            здесь.
          </p>
        </div>
      </main>
    </div>
  );
}
