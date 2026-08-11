import { FileText, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CustomTypesPanel } from "@/components/dashboard/CustomTypesPanel";
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
            title="Формы, которые подставляются автоматически"
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

          <div className="mt-10 flex flex-col gap-10">
            {/* Общие пользовательские типы — их заводят с рабочего стола */}
            <CustomTypesPanel />

            {BUILTIN_SCHEMAS.map((schema) => (
              <section key={schema.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-3">
                  <h2 className="text-body font-medium text-fg">
                    {schema.label}
                  </h2>
                  <span className="font-mono text-label uppercase text-fg-faint">
                    {schema.templates.length}{" "}
                    {plural(
                      schema.templates.length,
                      "шаблон",
                      "шаблона",
                      "шаблонов"
                    )}{" "}
                    · {schema.hint}
                  </span>
                </div>

                <ul className="flex flex-col divide-y divide-line">
                  {schema.templates.map((template) => (
                    <li
                      key={template}
                      className="flex items-center gap-3 py-3.5"
                    >
                      <FileText className="h-3.5 w-3.5 shrink-0 text-fg-ghost" />
                      <span className="min-w-0 flex-1 truncate text-body text-fg">
                        {template}
                      </span>
                      <span className="shrink-0 font-mono text-label uppercase text-fg-faint">
                        docx
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
