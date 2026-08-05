"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  CheckCircle2,
  FileText,
  FolderKanban,
  Loader2,
  Sparkles,
  X,
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
import { AutoGrowTextarea } from "@/components/ui/textarea";
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
            <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white/95 px-4 py-3 shadow-2xl shadow-stone-400/20 backdrop-blur">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
                <FolderKanban className="h-4 w-4 text-violet-600" />
              </div>

              <span className="whitespace-nowrap text-sm">
                <span className="font-semibold text-stone-900">{count}</span>
                <span className="text-stone-500">
                  {" "}
                  {plural(count, "дело", "дела", "дел")} выбрано
                </span>
              </span>

              <span className="h-6 w-px bg-stone-200" />

              <Button size="sm" className="gap-1.5" onClick={() => setSheetOpen(true)}>
                <Sparkles className="h-4 w-4" />
                Создать документ
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={clearCaseSelection}
                className="h-8 w-8 text-stone-400 hover:text-stone-900"
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
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
                {status === "running" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
                ) : (
                  <Sparkles className="h-4 w-4 text-violet-600" />
                )}
              </div>
              <SheetTitle>
                {status === "done"
                  ? "Документы созданы"
                  : "Документ по нескольким делам"}
              </SheetTitle>
            </div>

            <SheetDescription className="pl-[42px]">
              {status === "done"
                ? `Создано ${results.length} ${plural(
                    results.length,
                    "документ",
                    "документа",
                    "документов"
                  )} — по одному в каждом деле`
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
              <p className="mt-3 text-center text-xs text-stone-400">
                {Math.round(progress)}%
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
                        className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white px-3 py-2.5"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50">
                          <FileText className="h-4 w-4 text-violet-600" />
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col leading-tight">
                          <span className="truncate text-sm text-stone-900">
                            {result.name}
                          </span>
                          <span className="truncate text-xs text-stone-400">
                            {result.caseTitle}
                          </span>
                        </div>

                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>

              <div className="flex items-center gap-2 border-t border-stone-200 px-5 py-4">
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
                    {/* Список выбранных дел */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium uppercase tracking-wide text-stone-400">
                        Выбранные дела
                      </span>

                      {selectedCases.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2.5 rounded-lg border border-stone-200 px-3 py-2"
                        >
                          <FolderKanban className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                          <span className="truncate text-sm text-stone-700">
                            {item.title}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Свободный запрос */}
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-medium uppercase tracking-wide text-stone-400">
                        Что сгенерировать
                      </span>

                      <div
                        className={cn(
                          "rounded-xl border bg-white p-3 transition-colors",
                          prompt.trim()
                            ? "border-violet-300 ring-2 ring-violet-100"
                            : "border-stone-200"
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
                          className="text-sm"
                        />
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_PROMPTS.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setPrompt(item)}
                            className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-600 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollArea>

                <div className="flex items-center gap-2 border-t border-stone-200 px-5 py-4">
                  <Button
                    className="flex-1 gap-1.5"
                    onClick={handleGenerate}
                    disabled={!prompt.trim()}
                  >
                    <ArrowUp className="h-4 w-4" />
                    Сгенерировать для {count}{" "}
                    {plural(count, "дела", "дел", "дел")}
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
