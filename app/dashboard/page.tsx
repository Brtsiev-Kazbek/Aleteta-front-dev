import { Sidebar } from "@/components/layout/Sidebar";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentCases } from "@/components/dashboard/RecentCases";

export default function DashboardPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      <Sidebar />

      <main className="scrollable-area min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-10">
          {/* Приветствие */}
          <header className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Добро пожаловать в Алетейю. Что будем делать сегодня?
            </h1>
            <p className="text-sm text-zinc-500">
              Начните с быстрого действия или продолжите работу над делом.
            </p>
          </header>

          {/* Быстрые действия */}
          <section className="mt-8">
            <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-400">
              Быстрые действия
            </h2>
            <QuickActions />
          </section>

          {/* Недавние дела */}
          <section className="mt-10">
            <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-400">
              Недавние дела
            </h2>
            <RecentCases />
          </section>
        </div>
      </main>
    </div>
  );
}
