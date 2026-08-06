import { Sidebar } from "@/components/layout/Sidebar";
import { PanelHeading } from "@/components/layout/PanelHeading";
import { StoreBootstrap } from "@/components/layout/StoreBootstrap";
import { RecentCases } from "@/components/dashboard/RecentCases";
import { loadWorkspaceSnapshot } from "@/lib/data/bootstrap";

/*
 * Страница читает данные вошедшего, поэтому всегда отрисовывается по запросу.
 * Без этой пометки сборка без переменных окружения зафиксировала бы страницу
 * как статическую — и на боевом сервере, где база подключена, она отдавала бы
 * встроенный набор вместо настоящих дел.
 */
export const dynamic = "force-dynamic";

export default async function CasesPage() {
  const snapshot = await loadWorkspaceSnapshot();

  return (
    <div className="flex h-screen overflow-hidden bg-stone-50">
      {snapshot && <StoreBootstrap snapshot={snapshot} />}
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
