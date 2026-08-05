import { FileText, Layers, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/Sidebar";
import { plural } from "@/lib/utils";
import { BUILTIN_SCHEMAS } from "@/types";

export default function TemplatesPage() {
  const total = BUILTIN_SCHEMAS.reduce(
    (sum, schema) => sum + schema.templates.length,
    0
  );

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      <Sidebar />

      <main className="scrollable-area min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-10">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
                Шаблоны документов
              </h1>
              <p className="text-sm text-zinc-500">
                {total} {plural(total, "шаблон", "шаблона", "шаблонов")} —
                подставляются при массовой генерации по типу сущности. Свои
                типы добавляются прямо в деле.
              </p>
            </div>

            <Button className="gap-1.5">
              <Plus className="h-4 w-4" />
              Новый шаблон
            </Button>
          </header>

          <div className="mt-8 flex flex-col gap-5">
            {BUILTIN_SCHEMAS.map((schema) => (
              <section
                key={schema.id}
                className="rounded-xl border border-zinc-200 bg-white shadow-sm"
              >
                <div className="flex items-center gap-2.5 border-b border-zinc-200 px-5 py-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                    <Layers className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div className="flex flex-col leading-tight">
                    <h2 className="text-sm font-semibold text-zinc-900">
                      {schema.label}
                    </h2>
                    <span className="text-xs text-zinc-500">
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
                </div>

                <ul className="divide-y divide-zinc-200/70">
                  {schema.templates.map((template) => (
                    <li
                      key={template}
                      className="flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-zinc-50/70"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                        <FileText className="h-4 w-4 text-zinc-500" />
                      </div>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-900">
                        {template}
                      </span>
                      <span className="shrink-0 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-500">
                        .docx
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
