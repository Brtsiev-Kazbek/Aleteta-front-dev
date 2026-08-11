"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Check, FileText, FolderKanban, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AutoGrowTextarea } from "@/components/ui/textarea";
import { MetaLabel } from "@/components/layout/PanelHeading";
import { cn, plural } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

/** Готовые формулировки для документов, общих сразу для нескольких дел. */
const QUICK_PROMPTS = [
  "Уведомление о переносе сроков",
  "Запрос выписки из ЕГРН",
  "Доверенность на представление интересов",
];

export function CaseSelectionBar() {
  const cases = useAppStore((state) => state.cases);
  const selectedCaseIds = useAppStore((state) => state.selectedCaseIds);
  const toggleCaseSelection = useAppStore((state) => state.toggleCaseSelection);
  const clearCaseSelection = useAppStore((state) => state.clearCaseSelection);
  const isSheetOpen = useAppStore((state) => state.isBulkSheetOpen);
  const setSheetOpen = useAppStore((state) => state.setBulkSheetOpen);
  const status = useAppStore((state) => state.bulkStatus);
  const progress = useAppStore((state) => state.bulkProgress);
  const results = useAppStore((state) => state.bulkResults);
  const generate = useAppStore((state) => state.generateForSelectedCases);

  const [prompt, setPrompt] = useState("");

  const selectedCases = cases.filter((item) =>
    selectedCaseIds.includes(item.id)
  );
  const count = selectedCases.length;

  function handleGenerate() {
    if (!prompt.trim() || status === "running") return;
    generate(prompt);
  }

  function handleClose() {
    setSheetOpen(false);
    setPrompt("");
  }

  return (
    <>
      {/* Плавающая панель выбора */}
      <AnimatePresence>
        {count > 0 && !isSheetOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2"
          >
            <div className="shadow-panel flex items-center gap-3 rounded-lg border border-line bg-surface/95 px-4 py-3 backdrop-blur">
              <FolderKanban className="h-3.5 w-3.5 shrink-0 text-fg-faint" />

              <span className="whitespace-nowrap font-mono text-label uppercase text-fg-subtle">
                <span className="tabular-nums text-fg">{count}</span>{" "}
                {plural(count, "дело", "дела", "дел")} выбрано
              </span>

              <span className="h-5 w-px bg-surface-3" />

              <Button size="sm" onClick={() => setSheetOpen(true)}>
                Создать документ
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={clearCaseSelection}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Снять выделение</span>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Шторка массовой генерации по делам */}
      <Sheet
        open={isSheetOpen}
        onOpenChange={(open) => (open ? setSheetOpen(true) : handleClose())}
      >
        <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
          <SheetHeader>
            <div className="flex items-center gap-2">
              <MetaLabel>Работа по нескольким делам</MetaLabel>
              {status === "running" && (
                <Loader2 className="h-3 w-3 animate-spin text-fg-faint" />
              )}
            </div>

            <SheetTitle>
              {status === "done"
                ? "Документы созданы"
                : "Документ по нескольким делам"}
            </SheetTitle>

            <SheetDescription>
              {status === "done"
                ? `Создано ${results.length} ${plural(
                    results.length,
                    "документ",
                    "документа",
                    "документов"
                  )} — по одному в каждом деле, с реквизитами именно этого дела`
                : `Один запрос — документ появится в каждом из ${count} ${plural(
                    count,
                    "выбранного дела",
                    "выбранных дел",
                    "выбранных дел"
                  )}`}
            </SheetDescription>
          </SheetHeader>

          {status === "running" && (
            <div className="px-5 py-6">
              <Progress value={progress} />
              <p className="mt-3 font-mono text-label uppercase text-fg-faint">
                Подставляем реквизиты · {Math.round(progress)}%
              </p>
            </div>
          )}

          {status === "done" ? (
            <>
              <ScrollArea className="flex-1 px-5 py-4">
                <div className="flex flex-col gap-2">
                  <AnimatePresence initial={false}>
                    {results.map((result, index) => (
                      <motion.div
                        key={result.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.24, delay: index * 0.06 }}
                        className="flex items-center gap-3 rounded border border-line px-3 py-2.5"
                      >
                        <FileText className="h-3.5 w-3.5 shrink-0 text-fg-ghost" />

                        <div className="flex min-w-0 flex-1 flex-col leading-tight">
                          <span className="truncate text-body text-fg">
                            {result.name}
                          </span>
                          <span className="mt-0.5 truncate font-mono text-label uppercase text-fg-faint">
                            {result.caseTitle}
                          </span>
                        </div>

                        <Check
                          className="h-3.5 w-3.5 shrink-0 text-ok-fg"
                          strokeWidth={3}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>

              <div className="flex items-center gap-2 border-t border-line px-5 py-4">
                <Button
                  className="flex-1"
                  onClick={() => {
                    handleClose();
                    clearCaseSelection();
                  }}
                >
                  Готово
                </Button>
              </div>
            </>
          ) : (
            status !== "running" && (
              <>
                <ScrollArea className="flex-1 px-5 py-4">
                  <div className="flex flex-col gap-4">
                    {/* Список дел: состав можно поправить прямо здесь */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-baseline justify-between gap-3">
                        <MetaLabel>Дела для этого документа</MetaLabel>
                        <span className="font-mono text-label tabular-nums text-fg-faint">
                          {count} из {cases.length}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        {cases.map((item) => {
                          const isPicked = selectedCaseIds.includes(item.id);

                          return (
                            <label
                              key={item.id}
                              className={cn(
                                "flex cursor-pointer items-center gap-2.5 rounded border px-3 py-2 transition-colors",
                                isPicked
                                  ? "border-fg bg-bg"
                                  : "border-line hover:border-line-strong"
                              )}
                            >
                              <Checkbox
                                checked={isPicked}
                                onCheckedChange={() =>
                                  toggleCaseSelection(item.id)
                                }
                                aria-label={`Включить дело «${item.title}»`}
                              />
                              <span
                                className={cn(
                                  "truncate text-body transition-colors",
                                  isPicked ? "text-fg" : "text-fg-subtle"
                                )}
                              >
                                {item.title}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Свободный запрос */}
                    <div className="flex flex-col gap-2">
                      <MetaLabel>Что сгенерировать</MetaLabel>

                      <div
                        className={cn(
                          "rounded-md border bg-surface p-3 transition-colors",
                          prompt.trim() ? "border-fg" : "border-line"
                        )}
                      >
                        <AutoGrowTextarea
                          value={prompt}
                          onChange={(event) => setPrompt(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" && !event.shiftKey) {
                              event.preventDefault();
                              handleGenerate();
                            }
                          }}
                          maxHeight={160}
                          placeholder="Например: уведомление о переносе сроков исполнения на 30 календарных дней со ссылкой на реквизиты дела…"
                        />
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_PROMPTS.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setPrompt(item)}
                            className="rounded border border-line px-2.5 py-1.5 text-caption text-fg-soft transition-colors hover:border-fg hover:text-fg"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollArea>

                <div className="flex items-center gap-2 border-t border-line px-5 py-4">
                  <Button
                    className="flex-1 gap-1.5"
                    onClick={handleGenerate}
                    disabled={!prompt.trim() || count === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                    {count === 0
                      ? "Отметьте хотя бы одно дело"
                      : `Сгенерировать для ${count} ${plural(
                          count,
                          "дела",
                          "дел",
                          "дел"
                        )}`}
                  </Button>
                  <Button variant="outline" onClick={handleClose}>
                    Отмена
                  </Button>
                </div>
              </>
            )
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
