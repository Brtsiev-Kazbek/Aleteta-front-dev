"use client";

import { useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FilePlus2,
  FileText,
  Pencil,
  Sparkles,
  Upload,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MetaLabel } from "@/components/layout/PanelHeading";
import { CASE_ACTIVITY, type ActivityKind } from "@/data/mock-data";
import { cn, formatDate, plural } from "@/lib/utils";
import { findSchema, validateEntity } from "@/lib/validation";
import { useAppStore } from "@/store/useAppStore";
import type { Case } from "@/types";

const ACTIVITY_ICONS: Record<ActivityKind, LucideIcon> = {
  upload: Upload,
  ai: Sparkles,
  edit: Pencil,
  create: FilePlus2,
  generate: FileText,
};

export function CaseOverviewTab({ caseItem }: { caseItem: Case }) {
  const allEntities = useAppStore((state) => state.entities);
  const allDocuments = useAppStore((state) => state.documents);
  const customSchemas = useAppStore((state) => state.customSchemas);
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const toggleAssistant = useAppStore((state) => state.toggleAssistant);

  const entities = useMemo(
    () => allEntities.filter((entity) => entity.caseId === caseItem.id),
    [allEntities, caseItem.id]
  );
  const documents = useMemo(
    () => allDocuments.filter((document) => document.caseId === caseItem.id),
    [allDocuments, caseItem.id]
  );
  const activity = useMemo(
    () => CASE_ACTIVITY.filter((item) => item.caseId === caseItem.id),
    [caseItem.id]
  );

  const checked = useMemo(
    () =>
      entities.map((entity) => {
        const schema = findSchema(customSchemas, entity.type);
        return { entity, schema, validation: validateEntity(entity, schema) };
      }),
    [entities, customSchemas]
  );

  const stats = useMemo(() => {
    const valid = checked.filter((item) => item.validation.isValid).length;
    const errorFields = checked.reduce(
      (sum, item) => sum + Object.keys(item.validation.fieldErrors).length,
      0
    );
    return {
      valid,
      total: checked.length,
      errorFields,
      percent: checked.length === 0 ? 0 : (valid / checked.length) * 100,
    };
  }, [checked]);

  const problems = checked.filter((item) => !item.validation.isValid);
  const isReady = stats.percent === 100 && stats.total > 0;

  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
      {/* Готовность и проблемы */}
      <section className="lg:col-span-7">
        <MetaLabel>Готовность к генерации</MetaLabel>

        <div className="mt-4 flex items-end gap-4">
          <span
            className={cn(
              "font-mono text-6xl leading-none tabular-nums tracking-tight",
              isReady ? "text-emerald-600" : "text-stone-900"
            )}
          >
            {Math.round(stats.percent)}
            <span className="text-2xl text-stone-300">%</span>
          </span>

          <span className="pb-1.5 text-sm text-stone-500">
            {stats.valid} из {stats.total}{" "}
            {plural(stats.total, "объекта", "объектов", "объектов")} готовы
          </span>
        </div>

        {/* Полоса готовности вместо карточки с прогрессом */}
        <div className="mt-5 h-px w-full bg-stone-200">
          <div
            className={cn(
              "h-px transition-[width] duration-500",
              isReady ? "bg-emerald-500" : "bg-violet-600"
            )}
            style={{ width: `${stats.percent}%` }}
          />
        </div>

        {/* Три показателя — тонкие разделители, без плашек */}
        <div className="mt-8 grid grid-cols-3 gap-px bg-stone-200">
          {[
            { value: stats.total, label: "объектов" },
            { value: stats.valid, label: "готовы" },
            { value: stats.errorFields, label: "полей с ошибками" },
          ].map((tile) => (
            <div key={tile.label} className="bg-stone-50 px-4 py-5">
              <span className="font-mono text-2xl tabular-nums text-stone-900">
                {tile.value}
              </span>
              <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-stone-400">
                {tile.label}
              </p>
            </div>
          ))}
        </div>

        {/* Требуют внимания */}
        <div className="mt-12">
          <div className="flex items-center justify-between">
            <MetaLabel>Требуют внимания</MetaLabel>

            {problems.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab("entities")}
                className="text-xs text-violet-600 transition-colors hover:text-violet-700"
              >
                Открыть матрицу
              </button>
            )}
          </div>

          {problems.length === 0 ? (
            <div className="mt-4 flex items-center gap-3 border-t border-stone-200 pt-5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span className="text-sm text-stone-600">
                Все объекты заполнены — пакет можно генерировать
              </span>
            </div>
          ) : (
            <ul className="mt-4 flex flex-col divide-y divide-stone-200 border-t border-stone-200">
              {problems.map(({ entity, schema, validation }) => (
                <li
                  key={entity.id}
                  className="flex items-center gap-4 py-4"
                >
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />

                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm text-stone-900">
                      {entity.data[schema.fields[0]?.key ?? "name"]?.trim() ||
                        `Без наименования · ${schema.label}`}
                    </span>
                    <span className="truncate text-xs text-red-600">
                      {validation.errors[0]}
                    </span>
                  </div>

                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-stone-400">
                    {validation.errors.length}{" "}
                    {plural(validation.errors.length, "ошибка", "ошибки", "ошибок")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Сведения и активность */}
      <section className="lg:col-span-5">
        <MetaLabel>О деле</MetaLabel>

        <p className="mt-4 text-sm leading-relaxed text-stone-600">
          {caseItem.description}
        </p>

        <dl className="mt-6 flex flex-col divide-y divide-stone-200 border-y border-stone-200">
          {[
            { label: "Создано", value: formatDate(caseItem.createdAt) },
            { label: "Документов", value: String(documents.length) },
            { label: "Контекст ассистента", value: caseItem.contextFile },
          ].map((row) => (
            <div
              key={row.label}
              className="flex items-baseline justify-between gap-4 py-3"
            >
              <dt className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-stone-400">
                {row.label}
              </dt>
              <dd className="truncate text-sm text-stone-900">{row.value}</dd>
            </div>
          ))}
        </dl>

        <Button
          variant="outline"
          className="mt-6 w-full gap-2 border-stone-200"
          onClick={() => toggleAssistant(true)}
        >
          <Sparkles className="h-4 w-4 text-violet-600" />
          Спросить Алетейю о деле
        </Button>

        {/* Активность */}
        <div className="mt-12">
          <MetaLabel>Активность</MetaLabel>

          {activity.length === 0 ? (
            <p className="mt-4 border-t border-stone-200 pt-5 text-sm text-stone-400">
              Действий по делу пока не было
            </p>
          ) : (
            <ol className="mt-4 flex flex-col gap-5 border-t border-stone-200 pt-5">
              {activity.map((item, index) => {
                const Icon = ACTIVITY_ICONS[item.kind] ?? FileText;
                const isLast = index === activity.length - 1;

                return (
                  <li key={item.id} className="relative flex gap-3.5">
                    {!isLast && (
                      <span className="absolute left-[13px] top-8 h-[calc(100%+4px)] w-px bg-stone-200" />
                    )}

                    <div
                      className={cn(
                        "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                        item.kind === "ai"
                          ? "bg-violet-50 text-violet-600"
                          : "bg-stone-100 text-stone-500"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>

                    <div className="flex min-w-0 flex-col">
                      <span className="text-sm leading-snug text-stone-900">
                        {item.text}
                      </span>
                      <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-stone-400">
                        {item.actor} · {formatDate(item.at)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </section>
    </div>
  );
}
