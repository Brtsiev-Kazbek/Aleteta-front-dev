"use client";

import { useMemo } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  FileText,
  Layers,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn, formatDate, plural } from "@/lib/utils";
import { findSchema, validateEntity } from "@/lib/validation";
import { useAppStore } from "@/store/useAppStore";
import { CASE_STATUS_META, type Case } from "@/types";

export function CaseOverviewTab({ caseItem }: { caseItem: Case }) {
  const allEntities = useAppStore((state) => state.entities);
  const allDocuments = useAppStore((state) => state.documents);

  const entities = useMemo(
    () => allEntities.filter((entity) => entity.caseId === caseItem.id),
    [allEntities, caseItem.id]
  );
  const documents = useMemo(
    () => allDocuments.filter((document) => document.caseId === caseItem.id),
    [allDocuments, caseItem.id]
  );

  const customSchemas = useAppStore((state) => state.customSchemas);
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const toggleAssistant = useAppStore((state) => state.toggleAssistant);

  /** Валидация с учётом собственной схемы каждой сущности. */
  const checked = useMemo(
    () =>
      entities.map((entity) => {
        const schema = findSchema(customSchemas, entity.type);
        return {
          entity,
          schema,
          validation: validateEntity(entity, schema),
        };
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

  const statusMeta = CASE_STATUS_META[caseItem.status];

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <section className="flex flex-col gap-5 lg:col-span-2">
        {/* Готовность */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">
                Готовность к генерации
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                {stats.valid} из {stats.total}{" "}
                {plural(stats.total, "сущности", "сущностей", "сущностей")}{" "}
                прошли валидацию
              </p>
            </div>
            <span
              className={cn(
                "text-2xl font-semibold tabular-nums",
                stats.percent === 100 ? "text-emerald-600" : "text-zinc-900"
              )}
            >
              {Math.round(stats.percent)}%
            </span>
          </div>

          <Progress
            value={stats.percent}
            className="mt-4 h-2"
            indicatorClassName={
              stats.percent === 100 ? "bg-emerald-500" : "bg-indigo-600"
            }
          />

          <div className="mt-4 grid grid-cols-3 gap-3">
            <StatTile
              icon={Layers}
              label="Сущностей"
              value={String(stats.total)}
              tone="neutral"
            />
            <StatTile
              icon={CheckCircle2}
              label="Валидных"
              value={String(stats.valid)}
              tone="success"
            />
            <StatTile
              icon={AlertTriangle}
              label="Полей с ошибками"
              value={String(stats.errorFields)}
              tone={stats.errorFields > 0 ? "danger" : "neutral"}
            />
          </div>
        </div>

        {/* Требуют внимания */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-zinc-900">
              Требуют внимания
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-indigo-600 hover:text-indigo-700"
              onClick={() => setActiveTab("entities")}
            >
              Открыть матрицу
            </Button>
          </div>

          {problems.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="text-sm font-medium text-zinc-900">
                Все сущности заполнены
              </p>
              <p className="text-xs text-zinc-500">
                Пакет документов можно генерировать.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-200/70">
              {problems.map(({ entity, schema, validation }) => (
                <li
                  key={entity.id}
                  className="flex items-center gap-3 px-5 py-3.5"
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium text-zinc-900">
                      {/* У своих типов ключа `name` нет — берём первое поле схемы */}
                      {entity.data[schema.fields[0]?.key ?? "name"]?.trim() ||
                        `Без наименования · ${schema.label}`}
                    </span>
                    <span className="truncate text-xs text-red-600">
                      {validation.errors[0]}
                    </span>
                  </div>
                  <span className="shrink-0 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                    {validation.errors.length}{" "}
                    {plural(
                      validation.errors.length,
                      "ошибка",
                      "ошибки",
                      "ошибок"
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Карточка дела */}
      <section className="flex flex-col gap-5">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">О деле</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">
            {caseItem.description}
          </p>

          <dl className="mt-4 flex flex-col gap-3 border-t border-zinc-100 pt-4">
            <MetaRow label="Статус" value={statusMeta.label} />
            <MetaRow label="Создано" value={formatDate(caseItem.createdAt)} />
            <MetaRow label="Документов" value={String(documents.length)} />
            <MetaRow label="Контекст AI" value={caseItem.contextFile} />
          </dl>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {caseItem.tags.map((tag) => (
              <span
                key={tag}
                className="rounded border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] text-zinc-500"
              >
                {tag}
              </span>
            ))}
          </div>

          <Button
            variant="outline"
            className="mt-4 w-full gap-2 border-zinc-200"
            onClick={() => toggleAssistant(true)}
          >
            <Sparkles className="h-4 w-4 text-indigo-600" />
            Спросить Алетейю
          </Button>
        </div>

        {/* Последние документы */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-900">
            Последние документы
          </h2>

          <ul className="mt-3 flex flex-col gap-2">
            {documents.slice(0, 4).map((document) => (
              <li key={document.id} className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                  <FileText className="h-3.5 w-3.5 text-zinc-500" />
                </div>
                <span className="min-w-0 flex-1 truncate text-sm text-zinc-700">
                  {document.title}
                </span>
                <span className="shrink-0 text-xs text-zinc-400">
                  <CalendarDays className="mr-1 inline h-3 w-3" />
                  {formatDate(document.createdAt)}
                </span>
              </li>
            ))}

            {documents.length === 0 && (
              <li className="text-sm text-zinc-400">Документов пока нет</li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: "neutral" | "success" | "danger";
}) {
  const tones = {
    neutral: "bg-zinc-50 text-zinc-500",
    success: "bg-emerald-50 text-emerald-600",
    danger: "bg-red-50 text-red-600",
  } as const;

  return (
    <div className="rounded-lg border border-zinc-200/70 p-3">
      <div
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-lg",
          tones[tone]
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <p className="mt-2 text-lg font-semibold leading-none text-zinc-900">
        {value}
      </p>
      <p className="mt-1 text-xs text-zinc-500">{label}</p>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-xs text-zinc-400">{label}</dt>
      <dd className="truncate text-sm text-zinc-900">{value}</dd>
    </div>
  );
}
