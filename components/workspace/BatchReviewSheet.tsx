"use client";

import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, AlertTriangle, Check, FileText, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { MetaLabel } from "@/components/layout/PanelHeading";
import { cn, plural } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

export function BatchReviewSheet() {
  const isOpen = useAppStore((state) => state.isBatchReviewOpen);
  const setOpen = useAppStore((state) => state.setBatchReviewOpen);
  const status = useAppStore((state) => state.batchReviewStatus);
  const results = useAppStore((state) => state.batchReviewResults);
  const queue = useAppStore((state) => state.batchReviewQueue);
  const cursor = useAppStore((state) => state.batchReviewCursor);
  const clearSelection = useAppStore((state) => state.clearDocumentSelection);

  const resultByDocument = useMemo(
    () => new Map(results.map((item) => [item.documentId, item])),
    [results]
  );

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

  const isDone = status === "done";

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader>
          <div className="flex items-center gap-2">
            <MetaLabel>Проверка пачкой</MetaLabel>
            <span className="ml-auto font-mono text-label tabular-nums text-fg-faint">
              {Math.min(cursor, queue.length)} / {queue.length}
            </span>
          </div>

          <SheetTitle>
            {isDone ? "Проверка завершена" : "Проверяем документы"}
          </SheetTitle>

          <SheetDescription>
            {isDone
              ? `${totals.critical + totals.warning} ${plural(
                  totals.critical + totals.warning,
                  "замечание",
                  "замечания",
                  "замечаний"
                )} в ${queue.length} ${plural(
                  queue.length,
                  "документе",
                  "документах",
                  "документах"
                )}`
              : "Разбираем каждый документ по пунктам — по очереди."}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1 px-5 py-4">
          {/* Очередь: видно, что уже разобрано и что разбирается сейчас */}
          <div className="flex flex-col gap-2">
            {queue.map((item, index) => {
              const result = resultByDocument.get(item.id);
              const isChecking = !result && index === cursor && !isDone;
              const hasCritical = (result?.critical ?? 0) > 0;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-colors",
                    hasCritical ? "border-danger-line" : "border-line"
                  )}
                >
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                    {result ? (
                      hasCritical ? (
                        <AlertCircle className="h-3.5 w-3.5 text-danger-fg" />
                      ) : (
                        <Check
                          className="h-3.5 w-3.5 text-ok-fg"
                          strokeWidth={3}
                        />
                      )
                    ) : isChecking ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-fg" />
                    ) : (
                      <FileText className="h-3.5 w-3.5 text-fg-ghost" />
                    )}
                  </span>

                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-body transition-colors",
                      result ? "text-fg" : "text-fg-faint"
                    )}
                  >
                    {item.title}
                  </span>

                  <AnimatePresence>
                    {result && (
                      <motion.span
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex shrink-0 items-center gap-1.5"
                      >
                        {result.critical > 0 && (
                          <span className="rounded-full border border-danger-line px-1.5 py-0.5 font-mono text-label text-danger-fg">
                            {result.critical} крит.
                          </span>
                        )}
                        {result.warning > 0 && (
                          <span className="rounded-full border border-warn-line px-1.5 py-0.5 font-mono text-label text-warn-fg">
                            {result.warning} предупр.
                          </span>
                        )}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Сводка и порядок разбора */}
          <AnimatePresence>
            {isDone && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 border-t border-line pt-5"
              >
                <div className="flex items-baseline gap-2.5">
                  <span className="font-mono text-display tabular-nums text-fg">
                    {totals.critical + totals.warning}
                  </span>
                  <span className="font-mono text-label uppercase text-fg-subtle">
                    замечаний в {queue.length}{" "}
                    {plural(
                      queue.length,
                      "документе",
                      "документах",
                      "документах"
                    )}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-danger-line px-2 py-1 font-mono text-label text-danger-fg">
                    <AlertCircle className="h-3 w-3" />
                    {totals.critical}{" "}
                    {plural(
                      totals.critical,
                      "критическое",
                      "критических",
                      "критических"
                    )}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-warn-line px-2 py-1 font-mono text-label text-warn-fg">
                    <AlertTriangle className="h-3 w-3" />
                    {totals.warning}{" "}
                    {plural(
                      totals.warning,
                      "предупреждение",
                      "предупреждения",
                      "предупреждений"
                    )}
                  </span>
                </div>

                <div className="mt-5">
                  <MetaLabel>Порядок разбора</MetaLabel>
                  <ol className="mt-3 flex flex-col divide-y divide-line border-t border-line">
                    {sorted.map((item, index) => (
                      <li
                        key={item.documentId}
                        className="flex items-center gap-3 py-2.5"
                      >
                        <span className="shrink-0 font-mono text-label tabular-nums text-fg-ghost">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-body text-fg">
                          {item.title}
                        </span>
                        {item.critical > 0 && (
                          <span className="shrink-0 font-mono text-label uppercase text-danger-fg">
                            критическое
                          </span>
                        )}
                      </li>
                    ))}
                  </ol>

                  <p className="mt-3 text-label leading-relaxed text-fg-subtle">
                    Сверху документы с критическими замечаниями — разбирать всю
                    пачку подряд не нужно.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>

        <div className="flex shrink-0 items-center gap-2 border-t border-line px-5 py-4">
          <Button
            className="flex-1"
            disabled={!isDone}
            onClick={() => {
              setOpen(false);
              clearSelection();
            }}
          >
            Готово
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
