import { Sidebar } from "@/components/layout/Sidebar";
import { MetaLabel, PanelHeading } from "@/components/layout/PanelHeading";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentCases } from "@/components/dashboard/RecentCases";

export default function DashboardPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-stone-50">
      <Sidebar />

      <main className="scrollable-area min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-12">
          <PanelHeading
            eyebrow="Рабочий стол"
            title="Добро пожаловать в Алетейю"
            description="Начните с быстрого действия или продолжите работу над делом."
          />

          {/* Быстрые действия */}
          <section className="mt-12">
            <MetaLabel>Быстрые действия</MetaLabel>
            <div className="mt-4">
              <QuickActions />
            </div>
          </section>

          {/* Недавние дела */}
          <section className="mt-14">
            <MetaLabel>Недавние дела</MetaLabel>
            <div className="mt-4">
              <RecentCases />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
