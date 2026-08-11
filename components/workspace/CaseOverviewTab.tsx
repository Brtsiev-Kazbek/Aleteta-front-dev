"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
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

import { AnimatedNumber } from "@/components/ui/animated-number";
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
  const entitySchemas = useAppStore((state) => state.entitySchemas);
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
        const schema = findSchema(entitySchemas, entity.type);
        return { entity, schema, validation: validateEntity(entity, schema) };
      }),
    [entities, entitySchemas]
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
              "font-mono text-display-lg leading-none tabular-nums transition-colors duration-500",
              isReady ? "text-ok-fg" : "text-fg"
            )}
          >
            <AnimatedNumber value={Math.round(stats.percent)} />
            <span className="text-heading text-fg-ghost">%</span>
          </span>

          <span className="pb-1.5 text-body text-fg-subtle">
            {stats.valid} из {stats.total}{" "}
            {plural(stats.total, "объекта", "объектов", "объектов")} готовы
          </span>
        </div>

        {/* Полоса готовности вместо карточки с прогрессом */}
        <div className="mt-5 h-px w-full bg-surface-3">
          <motion.div
            animate={{ width: `${stats.percent}%` }}
            transition={{ duration: 0.6, ease: [0.22, 0.61, 0.36, 1] }}
            className={cn(
              "h-px",
              isReady ? "bg-ok" : "bg-fg"
            )}
          />
        </div>

        {/* Три показателя — тонкие разделители, без плашек */}
        <div className="mt-8 grid grid-cols-3 gap-px bg-surface-3">
          {[
            { value: stats.total, label: "объектов" },
            { value: stats.valid, label: "готовы" },
            { value: stats.errorFields, label: "полей с ошибками" },
          ].map((tile) => (
            <div
              key={tile.label}
              className="bg-surface px-4 py-5 transition-colors hover:bg-bg"
            >
              <span className="font-mono text-heading tabular-nums text-fg">
                <AnimatedNumber value={tile.value} />
              </span>
              <p className="mt-1.5 font-mono text-label uppercase text-fg-faint">
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
                className="border-b border-line pb-0.5 text-caption text-fg-subtle transition-colors hover:border-fg hover:text-fg"
              >
                Открыть матрицу
              </button>
            )}
          </div>

          {problems.length === 0 ? (
            <div className="mt-4 flex items-center gap-3 border-t border-line pt-5">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-ok-fg" />
              <span className="text-body text-fg-soft">
                Все объекты заполнены — пакет можно генерировать
              </span>
            </div>
          ) : (
            <ul className="mt-4 flex flex-col divide-y divide-line border-t border-line">
              {problems.map(({ entity, schema, validation }, index) => (
                <motion.li
                  key={entity.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.24, delay: index * 0.05 }}
                  className="group flex cursor-pointer items-center gap-4 py-4 transition-colors hover:bg-bg"
                  onClick={() => setActiveTab("entities")}
                >
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-danger-fg" />

                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-body text-fg">
                      {entity.data[schema.fields[0]?.key ?? "name"]?.trim() ||
                        `Без наименования · ${schema.label}`}
                    </span>
                    <span className="mt-0.5 truncate text-caption text-danger-fg">
                      {validation.errors[0]}
                    </span>
                  </div>

                  <span className="shrink-0 font-mono text-label uppercase text-fg-faint transition-colors group-hover:text-fg">
                    {validation.errors.length}{" "}
                    {plural(
                      validation.errors.length,
                      "ошибка",
                      "ошибки",
                      "ошибок"
                    )}
                  </span>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Сведения и активность */}
      <section className="lg:col-span-5">
        <MetaLabel>О деле</MetaLabel>

        <p className="mt-4 text-body leading-relaxed text-fg-soft">
          {caseItem.description}
        </p>

        <dl className="mt-6 flex flex-col divide-y divide-line border-y border-line">
          {[
            { label: "Создано", value: formatDate(caseItem.createdAt) },
            { label: "Документов", value: String(documents.length) },
            { label: "Контекст ассистента", value: caseItem.contextFile },
          ].map((row) => (
            <div
              key={row.label}
              className="flex items-baseline justify-between gap-4 py-3"
            >
              <dt className="shrink-0 font-mono text-label uppercase text-fg-faint">
                {row.label}
              </dt>
              <dd className="truncate text-body text-fg">{row.value}</dd>
            </div>
          ))}
        </dl>

        <Button
          variant="outline"
          className="mt-6 w-full gap-2"
          onClick={() => toggleAssistant(true)}
        >
          <Sparkles className="h-4 w-4 text-fg-faint" />
          Спросить Алетейю о деле
        </Button>

        {/* Активность */}
        <div className="mt-12">
          <MetaLabel>Активность</MetaLabel>

          {activity.length === 0 ? (
            <p className="mt-4 border-t border-line pt-5 text-body text-fg-faint">
              Действий по делу пока не было
            </p>
          ) : (
            <ol className="mt-4 flex flex-col gap-5 border-t border-line pt-5">
              {activity.map((item, index) => {
                const Icon = ACTIVITY_ICONS[item.kind] ?? FileText;
                const isLast = index === activity.length - 1;

                return (
                  <li key={item.id} className="relative flex gap-3.5">
                    {!isLast && (
                      <span className="absolute left-[13px] top-8 h-[calc(100%+4px)] w-px bg-surface-3" />
                    )}

                    <div
                      className={cn(
                        "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded border bg-surface",
                        item.kind === "ai"
                          ? "border-brand-line text-brand"
                          : "border-line text-fg-faint"
                      )}
                    >
                      <Icon className="h-3 w-3" />
                    </div>

                    <div className="flex min-w-0 flex-col">
                      <span className="text-body leading-snug text-fg">
                        {item.text}
                      </span>
                      <span className="mt-1 font-mono text-label uppercase text-fg-faint">
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
