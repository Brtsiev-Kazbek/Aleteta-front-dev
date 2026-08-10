import { Sidebar } from "@/components/layout/Sidebar";
import { PanelHeading } from "@/components/layout/PanelHeading";
import { StoreBootstrap } from "@/components/layout/StoreBootstrap";
import { RecognizeWorkbench } from "@/components/recognize/RecognizeWorkbench";
import { loadWorkspaceSnapshot } from "@/lib/data/bootstrap";

/*
 * Страница читает данные вошедшего, поэтому всегда отрисовывается по запросу.
 * Без этой пометки сборка без переменных окружения зафиксировала бы страницу
 * как статическую — и на боевом сервере она отдавала бы встроенный набор.
 */
export const dynamic = "force-dynamic";

export default async function RecognizePage() {
  const snapshot = await loadWorkspaceSnapshot();

  return (
    <div className="flex h-screen overflow-hidden bg-stone-50">
      {snapshot && <StoreBootstrap snapshot={snapshot} />}
      <Sidebar />

      <main className="scrollable-area min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-12">
          <PanelHeading
            eyebrow="Распознавание"
            title="Загрузите файл — получите текст"
            description="Скан, фотография или PDF. Текст появляется здесь же, по мере того как читаются страницы, и остаётся: по нему потом можно искать — не по названиям файлов, а по тому, что в них написано."
          />

          <div className="mt-10">
            <RecognizeWorkbench />
          </div>
        </div>
      </main>
    </div>
  );
}
