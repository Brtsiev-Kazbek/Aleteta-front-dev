"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CalendarDays, Layers } from "lucide-react";

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
      <div className="mb-3 flex items-center gap-3 border-b border-stone-200 pb-3">
        <label className="flex cursor-pointer items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-stone-400 transition-colors hover:text-stone-900">
          <Checkbox
            checked={allSelected}
            onCheckedChange={() => toggleAllCases(allIds)}
            aria-label="Выбрать все дела"
          />
          Выбрать все
        </label>

        {selectedCaseIds.length > 0 && (
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-stone-900">
            Выбрано: {selectedCaseIds.length}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-px border border-stone-200 bg-stone-200 lg:grid-cols-2 xl:grid-cols-3">
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
              "flex flex-col p-5 transition-colors",
              isSelected ? "bg-stone-50" : "bg-white hover:bg-stone-50/60"
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
                    "inline-flex items-center gap-2 rounded border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em]",
                    statusMeta.badgeClassName
                  )}
                >
                  <span
                    className={cn(
                      "h-1 w-1 rounded-full",
                      statusMeta.dotClassName
                    )}
                  />
                  {statusMeta.label}
                </span>
              </div>

              {invalidCount > 0 && (
                <span className="shrink-0 rounded border border-red-200 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-red-700">
                  {invalidCount}{" "}
                  {plural(invalidCount, "ошибка", "ошибки", "ошибок")}
                </span>
              )}
            </div>

            <h3 className="mt-4 line-clamp-2 text-[15px] font-medium leading-snug tracking-[-0.015em] text-stone-900">
              {caseItem.title}
            </h3>

            <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-stone-500">
              {caseItem.description}
            </p>

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              {caseItem.tags.map((tag) => (
                <span
                  key={tag}
                  className="font-mono text-[10px] uppercase tracking-[0.12em] text-stone-400"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-auto flex items-center gap-4 pt-5 font-mono text-[10px] uppercase tracking-[0.12em] text-stone-400">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3 w-3" />
                {formatDate(caseItem.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Layers className="h-3 w-3" />
                {caseEntities.length}{" "}
                {plural(caseEntities.length, "объект", "объекта", "объектов")}
              </span>
            </div>

            <Link
              href={`/cases/${caseItem.id}`}
              className="group mt-4 inline-flex w-fit items-center gap-1.5 border-b border-stone-200 pb-0.5 text-[13px] text-stone-700 transition-colors hover:border-stone-900 hover:text-stone-900"
            >
              Открыть дело
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </motion.article>
        );
        })}
      </div>

      {/* Плавающая панель массовой генерации по выбранным делам */}
      <CaseSelectionBar />
    </>
  );
}
