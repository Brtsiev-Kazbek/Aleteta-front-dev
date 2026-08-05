"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Sparkles,
  Wand2,
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
import type { GeneratedDocument } from "@/types";

export function GenerationSheet({ caseId }: { caseId: string }) {
  const isOpen = useAppStore((state) => state.isGenerationSheetOpen);
  const setOpen = useAppStore((state) => state.setGenerationSheetOpen);
  const status = useAppStore((state) => state.generationStatus);
  const progress = useAppStore((state) => state.generationProgress);
  const documents = useAppStore((state) => state.generatedDocuments);
  const isCustomGenerating = useAppStore((state) => state.isCustomGenerating);
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
              {status === "running"
                ? "Генерация пакета документов"
                : "Пакет документов готов"}
            </SheetTitle>
          </div>

          <SheetDescription className="pl-[42px]">
            {status === "running"
              ? "Подставляем реквизиты сущностей в шаблоны…"
              : `Создано ${documents.length} ${plural(
                  documents.length,
                  "документ",
                  "документа",
                  "документов"
                )} для ${grouped.length} ${plural(
                  grouped.length,
                  "сущности",
                  "сущностей",
                  "сущностей"
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
            <ScrollArea className="flex-1 px-5 py-4">
              <div className="flex flex-col gap-5">
                {/* Ключ по id: у сущностей могут совпадать наименования */}
                {grouped.map((group, groupIndex) => (
                  <div key={group.entityId} className="flex flex-col gap-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
                      {group.entityName}
                    </p>

                    <AnimatePresence initial={false}>
                      {group.docs.map((doc, docIndex) => (
                        <motion.div
                          key={doc.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.24,
                            delay: groupIndex * 0.08 + docIndex * 0.05,
                          }}
                          className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white px-3 py-2.5 transition-colors hover:border-violet-200 hover:bg-violet-50/30"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50">
                            <FileText className="h-4 w-4 text-violet-600" />
                          </div>
                          <span className="flex-1 truncate text-sm text-stone-900">
                            {doc.name}
                          </span>
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Свободный запрос: пакет не ограничен готовыми шаблонами */}
            <div className="border-t border-stone-200 px-5 py-4">
              <div className="mb-2 flex items-center gap-1.5">
                <Wand2 className="h-3.5 w-3.5 text-violet-600" />
                <span className="text-xs font-medium text-stone-700">
                  Нужен документ не из списка?
                </span>
              </div>

              <div
                className={cn(
                  "rounded-xl border bg-white p-2.5 transition-colors",
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
                      handleCustomGenerate();
                    }
                  }}
                  disabled={isCustomGenerating}
                  maxHeight={140}
                  placeholder="Опишите документ: дополнительное соглашение о рассрочке платежа на 6 месяцев со штрафом 0,1% за просрочку…"
                  className="text-sm"
                />

                <div className="mt-2 flex items-center justify-between gap-2 border-t border-stone-100 pt-2">
                  <span className="text-[11px] text-stone-400">
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
                    {isCustomGenerating ? "Создаём…" : "Добавить в пакет"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 border-t border-stone-200 px-5 py-4">
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
