import { FileText, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CustomTypesPanel } from "@/components/dashboard/CustomTypesPanel";
import { Sidebar } from "@/components/layout/Sidebar";
import { PanelHeading } from "@/components/layout/PanelHeading";
import { plural } from "@/lib/utils";
import { BUILTIN_SCHEMAS } from "@/types";

export default function TemplatesPage() {
  const total = BUILTIN_SCHEMAS.reduce(
    (sum, schema) => sum + schema.templates.length,
    0
  );

  return (
    <div className="flex h-screen overflow-hidden bg-stone-50">
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
                <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-stone-200 pb-3">
                  <h2 className="text-[15px] font-medium tracking-[-0.01em] text-stone-900">
                    {schema.label}
                  </h2>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-stone-400">
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

                <ul className="flex flex-col divide-y divide-stone-200">
                  {schema.templates.map((template) => (
                    <li
                      key={template}
                      className="flex items-center gap-3 py-3.5"
                    >
                      <FileText className="h-3.5 w-3.5 shrink-0 text-stone-300" />
                      <span className="min-w-0 flex-1 truncate text-sm text-stone-900">
                        {template}
                      </span>
                      <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-stone-400">
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
