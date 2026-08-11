import { FileText, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CustomTypesPanel } from "@/components/dashboard/CustomTypesPanel";
import { Panel } from "@/components/layout/Panel";
import { Sidebar } from "@/components/layout/Sidebar";
import { PanelHeading } from "@/components/layout/PanelHeading";
import { StoreBootstrap } from "@/components/layout/StoreBootstrap";
import { loadWorkspaceSnapshot } from "@/lib/data/bootstrap";
import { plural } from "@/lib/utils";
import { BUILTIN_SCHEMAS } from "@/types";

/*
 * Страница читает данные вошедшего, поэтому всегда отрисовывается по запросу.
 * Без этой пометки сборка без переменных окружения зафиксировала бы страницу
 * как статическую — и на боевом сервере, где база подключена, она отдавала бы
 * встроенный набор вместо настоящих дел.
 */
export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const snapshot = await loadWorkspaceSnapshot();

  const total = BUILTIN_SCHEMAS.reduce(
    (sum, schema) => sum + schema.templates.length,
    0
  );

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      {snapshot && <StoreBootstrap snapshot={snapshot} />}
      <Sidebar />

      <main className="scrollable-area min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-12">
          <PanelHeading
            eyebrow="Шаблоны"
            title="Формы, по которым собираются документы"
            description={`${total} ${plural(
              total,
              "шаблон",
              "шаблона",
              "шаблонов"
            )} на встроенные типы объектов. Если подходящей формы нет, документ составляется с нуля по свободному запросу.`}
            action={
              <Button variant="outline" className="gap-1.5">
                <Plus className="h-4 w-4" />
                Новый шаблон
              </Button>
            }
          />

          <div className="mt-10 flex flex-col gap-4">
            {/* Общие пользовательские типы — их заводят с рабочего стола */}
            <CustomTypesPanel />

            {BUILTIN_SCHEMAS.map((schema) => (
              <Panel
                key={schema.id}
                title={schema.label}
                meta={`${schema.templates.length} ${plural(
                  schema.templates.length,
                  "шаблон",
                  "шаблона",
                  "шаблонов"
                )} · ${schema.hint}`}
                bodyClassName="p-2"
              >
                <ul className="flex flex-col">
                  {schema.templates.map((template) => (
                    <li key={template}>
                      <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-bg">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg text-fg-faint">
                          <FileText className="h-3.5 w-3.5" />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-body text-fg">
                          {template}
                        </span>
                        <span className="shrink-0 rounded-full border border-line px-2 py-0.5 font-mono text-label uppercase text-fg-faint">
                          docx
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </Panel>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
