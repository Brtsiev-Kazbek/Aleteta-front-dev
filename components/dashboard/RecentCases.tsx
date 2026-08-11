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
      <div className="mb-4 flex items-center gap-3">
        <label className="flex cursor-pointer items-center gap-2 font-mono text-label uppercase text-fg-faint transition-colors hover:text-fg">
          <Checkbox
            checked={allSelected}
            onCheckedChange={() => toggleAllCases(allIds)}
            aria-label="Выбрать все дела"
          />
          Выбрать все
        </label>

        {selectedCaseIds.length > 0 && (
          <span className="font-mono text-label uppercase text-fg">
            Выбрано: {selectedCaseIds.length}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {cases.map((caseItem, index) => {
        const statusMeta = CASE_STATUS_META[caseItem.status];
        const caseEntities = entities.filter(
          (entity) => entity.caseId === caseItem.id
        );
        const invalidCount = caseEntities.filter(
          (entity) => entity.validationErrors.length > 0
        ).length;
        const readyCount = caseEntities.length - invalidCount;
        const percent =
          caseEntities.length === 0
            ? 0
            : Math.round((readyCount / caseEntities.length) * 100);

        const isSelected = selectedCaseIds.includes(caseItem.id);

        return (
          <motion.article
            key={caseItem.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.06 }}
            className={cn(
              /*
               * Отмеченное дело держится кольцом фирменного цвета, а не сменой
               * заливки. Заливкой раньше показывались и выбор, и наведение —
               * два разных состояния одним приёмом, и на полотне без
               * промежутков понять, что именно отмечено, можно было только по
               * счётчику.
               */
              "flex flex-col rounded-2xl border bg-surface p-5 transition-all",
              isSelected
                ? "border-brand-line ring-1 ring-brand-line"
                : "border-line hover:border-line-strong hover:shadow-card"
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
                    "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 font-mono text-label uppercase ",
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
                <span className="shrink-0 rounded-full border border-danger-line bg-danger-bg px-2.5 py-1 font-mono text-label uppercase text-danger-fg">
                  {invalidCount}{" "}
                  {plural(invalidCount, "ошибка", "ошибки", "ошибок")}
                </span>
              )}
            </div>

            <h3 className="mt-4 line-clamp-2 text-title-sm font-medium leading-snug text-fg">
              {caseItem.title}
            </h3>

            <p className="mt-2 line-clamp-2 text-body-sm leading-relaxed text-fg-subtle">
              {caseItem.description}
            </p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {caseItem.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-bg px-2 py-0.5 font-mono text-label uppercase text-fg-faint"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/*
              Полоса готовности прямо в карточке дела.
              Раньше о состоянии говорил только счётчик ошибок в углу, и чтобы
              понять, далеко ли до пакета, дело приходилось открывать. Полоса
              отвечает на это, не отнимая ни строки: она стоит на месте
              разделителя, который тут был и так.
            */}
            <div className="mt-auto pt-5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-label uppercase text-fg-faint">
                  {caseEntities.length === 0
                    ? "Объектов нет"
                    : `${readyCount} из ${caseEntities.length} готовы`}
                </span>
                <span className="font-mono text-label tabular-nums text-fg-ghost">
                  {caseEntities.length === 0 ? "—" : `${percent}%`}
                </span>
              </div>

              <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-3">
                <div
                  style={{ width: `${percent}%` }}
                  className={cn(
                    "h-full rounded-full transition-[width] duration-500",
                    invalidCount > 0 ? "bg-danger" : "bg-ok"
                  )}
                />
              </div>

              <div className="mt-4 flex items-center gap-4 font-mono text-label uppercase text-fg-faint">
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
            </div>

            <Link
              href={`/cases/${caseItem.id}`}
              className="group mt-5 inline-flex h-9 w-fit items-center gap-1.5 rounded-lg border border-line bg-bg px-3.5 text-body-sm text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
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
