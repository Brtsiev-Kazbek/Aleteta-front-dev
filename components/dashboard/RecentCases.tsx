"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CalendarDays, Layers } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CaseSelectionBar } from "@/components/dashboard/CaseSelectionBar";
import { cn, formatDate, plural } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { CASE_STATUS_META } from "@/types";

export function RecentCases() {
  const cases = useAppStore((state) => state.cases);
  const entities = useAppStore((state) => state.entities);
  const selectedCaseIds = useAppStore((state) => state.selectedCaseIds);
  const toggleCaseSelection = useAppStore((state) => state.toggleCaseSelection);
  const toggleAllCases = useAppStore((state) => state.toggleAllCases);

  const allIds = useMemo(() => cases.map((item) => item.id), [cases]);
  const allSelected =
    allIds.length > 0 && allIds.every((id) => selectedCaseIds.includes(id));

  return (
    <>
      {/* Выбор всех дел для массовой генерации */}
      <div className="mb-3 flex items-center gap-2">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-stone-500 transition-colors hover:text-stone-900">
          <Checkbox
            checked={allSelected}
            onCheckedChange={() => toggleAllCases(allIds)}
            aria-label="Выбрать все дела"
          />
          Выбрать все
        </label>

        {selectedCaseIds.length > 0 && (
          <span className="rounded-md border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
            Выбрано: {selectedCaseIds.length}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {cases.map((caseItem, index) => {
        const statusMeta = CASE_STATUS_META[caseItem.status];
        const caseEntities = entities.filter(
          (entity) => entity.caseId === caseItem.id
        );
        const invalidCount = caseEntities.filter(
          (entity) => entity.validationErrors.length > 0
        ).length;

        const isSelected = selectedCaseIds.includes(caseItem.id);

        return (
          <motion.article
            key={caseItem.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.06 }}
            className={cn(
              "flex flex-col rounded-2xl border bg-white p-6 transition-all duration-300",
              isSelected
                ? "border-violet-300 ring-2 ring-violet-100"
                : "border-stone-200 hover:-translate-y-1 hover:shadow-lg"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleCaseSelection(caseItem.id)}
                  aria-label={`Выбрать дело «${caseItem.title}»`}
                />

                <span
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium tracking-wide",
                    statusMeta.badgeClassName
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      statusMeta.dotClassName
                    )}
                  />
                  {statusMeta.label}
                </span>
              </div>

              {invalidCount > 0 && (
                <span className="shrink-0 rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-700">
                  {invalidCount}{" "}
                  {plural(invalidCount, "ошибка", "ошибки", "ошибок")}
                </span>
              )}
            </div>

            <h3 className="mt-4 line-clamp-2 text-[15px] font-medium leading-snug tracking-[-0.01em] text-stone-900">
              {caseItem.title}
            </h3>

            <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-stone-500">
              {caseItem.description}
            </p>

            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
              {caseItem.tags.map((tag) => (
                <span
                  key={tag}
                  className="font-mono text-[10px] uppercase tracking-[0.12em] text-stone-400"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-4 border-t border-stone-100 pt-3.5 text-xs text-stone-400">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDate(caseItem.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                {caseEntities.length}{" "}
                {plural(caseEntities.length, "сущность", "сущности", "сущностей")}
              </span>
            </div>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="mt-4 w-full gap-1.5 border-stone-200"
            >
              <Link href={`/cases/${caseItem.id}`}>
                Открыть
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </motion.article>
        );
        })}
      </div>

      {/* Плавающая панель массовой генерации по выбранным делам */}
      <CaseSelectionBar />
    </>
  );
}
