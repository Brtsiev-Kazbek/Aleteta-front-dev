"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Check, Download, FileText, Loader2, Search } from "lucide-react";

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
import { MetaLabel } from "@/components/layout/PanelHeading";
import { cn, plural } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import type { GeneratedDocument } from "@/types";

export function GenerationSheet({ caseId }: { caseId: string }) {
  const isOpen = useAppStore((state) => state.isGenerationSheetOpen);
  const setOpen = useAppStore((state) => state.setGenerationSheetOpen);
  const status = useAppStore((state) => state.generationStatus);
  const progress = useAppStore((state) => state.generationProgress);
  const documents = useAppStore((state) => state.generatedDocuments);
  const isCustomGenerating = useAppStore((state) => state.isCustomGenerating);
  const freeformStage = useAppStore((state) => state.freeformStage);
  const templateMatch = useAppStore((state) => state.templateMatch);
  const generateCustomDocument = useAppStore(
    (state) => state.generateCustomDocument
  );

  const [prompt, setPrompt] = useState("");

  function handleCustomGenerate() {
    if (!prompt.trim() || isCustomGenerating) return;
    generateCustomDocument(caseId, prompt);
    setPrompt("");
  }

  const grouped = useMemo(() => {
    const map = new Map<
      string,
      { entityId: string; entityName: string; docs: GeneratedDocument[] }
    >();
    for (const doc of documents) {
      const bucket = map.get(doc.entityId);
      if (bucket) bucket.docs.push(doc);
      else {
        map.set(doc.entityId, {
          entityId: doc.entityId,
          entityName: doc.entityName,
          docs: [doc],
        });
      }
    }
    return [...map.values()];
  }, [documents]);

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader>
          <div className="flex items-center gap-2">
            <MetaLabel>Пакет документов</MetaLabel>
            {status === "running" && (
              <Loader2 className="h-3 w-3 animate-spin text-stone-400" />
            )}
          </div>

          <SheetTitle>
            {status === "running"
              ? "Собираем пакет документов"
              : "Пакет документов готов"}
          </SheetTitle>

          <SheetDescription>
            {status === "running"
              ? "Подставляем реквизиты объектов в шаблоны…"
              : `Создано ${documents.length} ${plural(
                  documents.length,
                  "документ",
                  "документа",
                  "документов"
                )} для ${grouped.length} ${plural(
                  grouped.length,
                  "объекта",
                  "объектов",
                  "объектов"
                )}`}
          </SheetDescription>
        </SheetHeader>

        {status === "running" && (
          <div className="px-5 py-6">
            <Progress value={progress} />
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-stone-400">
              {Math.round(progress)}%
            </p>
          </div>
        )}

        {status === "done" && (
          <>
            <ScrollArea className="min-h-0 flex-1 px-5 py-4">
              <div className="flex flex-col gap-5">
                {/* Ключ по id: у объектов могут совпадать наименования */}
                {grouped.map((group, groupIndex) => (
                  <div key={group.entityId} className="flex flex-col gap-2">
                    <MetaLabel>{group.entityName}</MetaLabel>

                    <AnimatePresence initial={false}>
                      {group.docs.map((doc, docIndex) => (
                        <motion.div
                          key={doc.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.24,
                            delay: groupIndex * 0.06 + docIndex * 0.04,
                          }}
                          className="flex items-center gap-3 rounded border border-stone-200 px-3 py-2.5 transition-colors hover:border-stone-300"
                        >
                          <FileText className="h-3.5 w-3.5 shrink-0 text-stone-300" />
                          <span className="min-w-0 flex-1 truncate text-[13px] text-stone-900">
                            {doc.name}
                          </span>
                          <Check
                            className="h-3.5 w-3.5 shrink-0 text-emerald-600"
                            strokeWidth={3}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Свободный запрос: пакет не ограничен готовыми шаблонами */}
            <div className="shrink-0 border-t border-stone-200 px-5 py-4">
              <MetaLabel>Нужен документ не из списка?</MetaLabel>

              <div
                className={cn(
                  "mt-2.5 rounded-md border bg-white p-2.5 transition-colors",
                  prompt.trim() ? "border-stone-900" : "border-stone-200"
                )}
              >
                <AutoGrowTextarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleCustomGenerate();
                    }
                  }}
                  disabled={isCustomGenerating}
                  maxHeight={140}
                  placeholder="Опишите документ: дополнительное соглашение о рассрочке платежа на 6 месяцев со штрафом 0,1% за просрочку…"
                />

                <div className="mt-2 flex items-center justify-between gap-2 border-t border-stone-100 pt-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-stone-400">
                    Enter — сгенерировать
                  </span>
                  <Button
                    size="sm"
                    onClick={handleCustomGenerate}
                    disabled={!prompt.trim() || isCustomGenerating}
                    className="h-7 gap-1.5 px-2.5 text-xs"
                  >
                    {isCustomGenerating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ArrowUp className="h-3.5 w-3.5" />
                    )}
                    {isCustomGenerating ? "Составляем…" : "Добавить в пакет"}
                  </Button>
                </div>
              </div>

              {/* Поиск подходящей формы — видно, откуда взялся документ */}
              <AnimatePresence>
                {freeformStage !== "idle" && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-2.5 flex items-center gap-2"
                  >
                    <Search
                      className={cn(
                        "h-3 w-3 shrink-0",
                        freeformStage === "searching"
                          ? "animate-pulse text-stone-900"
                          : "text-stone-400"
                      )}
                    />

                    {freeformStage === "searching" ? (
                      <span className="text-[11px] text-stone-500">
                        Проверяю, есть ли подходящий шаблон…
                      </span>
                    ) : templateMatch?.found ? (
                      <span className="text-[11px] text-stone-600">
                        Шаблон найден:{" "}
                        <span className="text-stone-900">
                          {templateMatch.name}
                        </span>{" "}
                        — реквизиты подставлены
                      </span>
                    ) : (
                      <span className="text-[11px] text-stone-600">
                        Шаблона нет —{" "}
                        <span className="font-medium text-violet-700">
                          документ составлен с нуля
                        </span>
                      </span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex shrink-0 items-center gap-2 border-t border-stone-200 px-5 py-4">
              <Button className="flex-1 gap-1.5">
                <Download className="h-4 w-4" />
                Скачать всё (.zip)
              </Button>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Закрыть
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
