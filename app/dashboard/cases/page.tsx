import { Sidebar } from "@/components/layout/Sidebar";
import { PanelHeading } from "@/components/layout/PanelHeading";
import { RecentCases } from "@/components/dashboard/RecentCases";

export default function CasesPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-stone-50">
      <Sidebar />

      <main className="scrollable-area min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-12">
          <PanelHeading
            eyebrow="Дела"
            title="Все рабочие пространства"
            description="Отметьте несколько дел — один запрос создаст документ в каждом из них."
          />

          <div className="mt-10">
            <RecentCases />
          </div>
        </div>
      </main>
    </div>
  );
}
