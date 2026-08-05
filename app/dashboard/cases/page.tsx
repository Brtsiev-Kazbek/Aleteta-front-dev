import { Sidebar } from "@/components/layout/Sidebar";
import { RecentCases } from "@/components/dashboard/RecentCases";

export default function CasesPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      <Sidebar />

      <main className="scrollable-area min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-10">
          <header className="flex flex-col gap-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Все дела
            </h1>
            <p className="text-sm text-zinc-500">
              Рабочие пространства с файлами, сущностями и массовой генерацией.
            </p>
          </header>

          <div className="mt-8">
            <RecentCases />
          </div>
        </div>
      </main>
    </div>
  );
}
