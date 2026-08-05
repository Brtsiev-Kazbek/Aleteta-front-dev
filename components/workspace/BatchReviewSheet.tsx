"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  Check,
  FileText,
  Loader2,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn, plural } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

export function BatchReviewSheet() {
  const isOpen = useAppStore((state) => state.isBatchReviewOpen);
  const setOpen = useAppStore((state) => state.setBatchReviewOpen);
  const status = useAppStore((state) => state.batchReviewStatus);
  const progress = useAppStore((state) => state.batchReviewProgress);
  const results = useAppStore((state) => state.batchReviewResults);
  const clearSelection = useAppStore((state) => state.clearDocumentSelection);

  /** Сначала документы с критическими замечаниями. */
  const sorted = useMemo(
    () => [...results].sort((a, b) => b.critical - a.critical),
    [results]
  );

  const totals = useMemo(
    () => ({
      critical: results.reduce((sum, item) => sum + item.critical, 0),
      warning: results.reduce((sum, item) => sum + item.warning, 0),
    }),
    [results]
  );

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
              {status === "running" ? (
                <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
              ) : (
                <ShieldCheck className="h-4 w-4 text-violet-600" />
              )}
            </div>
            <SheetTitle>
              {status === "running"
                ? "Проверяем документы"
                : "Проверка завершена"}
            </SheetTitle>
          </div>

          <SheetDescription className="pl-[42px]">
            {status === "running"
              ? "Разбираем каждый документ по пунктам…"
              : `${totals.critical + totals.warning} ${plural(
                  totals.critical + totals.warning,
                  "замечание",
                  "замечания",
                  "замечаний"
                )} в ${results.length} ${plural(
                  results.length,
                  "документе",
                  "документах",
                  "документах"
                )}`}
          </SheetDescription>
        </SheetHeader>

        {status === "running" && (
          <div className="px-5 py-6">
            <Progress value={progress} />
            <p className="mt-3 text-center text-xs text-stone-400">
              {Math.round(progress)}%
            </p>
          </div>
        )}

        {status === "done" && (
          <>
            {/* Сводка */}
            <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 px-5 py-4">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                <AlertCircle className="h-3.5 w-3.5" />
                {totals.critical}{" "}
                {plural(totals.critical, "критическое", "критических", "критических")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5" />
                {totals.warning}{" "}
                {plural(totals.warning, "предупреждение", "предупреждения", "предупреждений")}
              </span>
            </div>

            <ScrollArea className="flex-1 px-5 py-4">
              <p className="mb-3 text-xs text-stone-500">
                Сверху документы с критическими замечаниями — разбирать всю пачку
                подряд не нужно.
              </p>

              <div className="flex flex-col gap-2">
                <AnimatePresence initial={false}>
                  {sorted.map((result, index) => (
                    <motion.div
                      key={result.documentId}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.24, delay: index * 0.05 }}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border px-3 py-2.5",
                        result.critical > 0
                          ? "border-red-200 bg-red-50/50"
                          : "border-stone-200 bg-white"
                      )}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white">
                        {result.critical > 0 ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <Check className="h-4 w-4 text-emerald-600" strokeWidth={3} />
                        )}
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col leading-tight">
                        <span className="truncate text-sm text-stone-900">
                          {result.title}
                        </span>
                        <span className="mt-0.5 text-[11px] text-stone-400">
                          {result.critical > 0
                            ? `${result.critical} критических · ${result.warning} предупреждений`
                            : `${result.warning} предупреждений`}
                        </span>
                      </div>

                      <FileText className="h-3.5 w-3.5 shrink-0 text-stone-300" />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </ScrollArea>

            <div className="flex items-center gap-2 border-t border-stone-200 px-5 py-4">
              <Button
                className="flex-1"
                onClick={() => {
                  setOpen(false);
                  clearSelection();
                }}
              >
                Готово
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
