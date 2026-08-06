import { Sidebar } from "@/components/layout/Sidebar";
import { MetaLabel } from "@/components/layout/PanelHeading";
import { StoreBootstrap } from "@/components/layout/StoreBootstrap";
import { loadWorkspaceSnapshot } from "@/lib/data/bootstrap";
import { CapabilityGrid } from "@/components/dashboard/CapabilityGrid";
import { CustomTypesPanel } from "@/components/dashboard/CustomTypesPanel";
import { DashboardHero } from "@/components/dashboard/DashboardHero";
import { RecentCases } from "@/components/dashboard/RecentCases";
import { Reveal } from "@/components/landing/Reveal";

export default async function DashboardPage() {
  const snapshot = await loadWorkspaceSnapshot();

  return (
    <div className="flex h-screen overflow-hidden bg-stone-50">
      {snapshot && <StoreBootstrap snapshot={snapshot} />}
      <Sidebar />

      <main className="scrollable-area min-w-0 flex-1 overflow-y-auto">
        <DashboardHero />

        <div className="mx-auto max-w-6xl px-8 pb-16 pt-12">
          {/* Возможности */}
          <CapabilityGrid />

          {/* Общие типы объектов — их создаёт инструмент 04 */}
          <Reveal className="mt-16">
            <CustomTypesPanel />
          </Reveal>

          {/* Дела */}
          <Reveal className="mt-16">
            <MetaLabel>Недавние дела</MetaLabel>
            <div className="mt-4">
              <RecentCases />
            </div>
          </Reveal>
        </div>
      </main>
    </div>
  );
}
