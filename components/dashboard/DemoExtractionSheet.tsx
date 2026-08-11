"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Check, FileText, Loader2 } from "lucide-react";

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
import { cn, formatFileSize, plural } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { EXTRACTION_STEPS } from "@/types";

/**
 * Разбор файла «как будто» — витрина на рабочем столе.
 *
 * Здесь ничего не вызывается: реквизиты берутся из заготовки, подобранной по
 * имени файла, шаги прокручивает таймер. Файл никуда не загружается, и загрузить
 * его отсюда некуда — дела ещё не выбрано.
 *
 * Настоящий разбор живёт в `components/workspace/ExtractionSheet.tsx` и
 * запускается из дела: ему нужен файл, уже лежащий в базе и распознанный.
 * Разделение намеренное — если имитация и работа делят одну шторку, отличить
 * нарисованное от сделанного рано или поздно перестают все, включая нас.
 */
export function DemoExtractionSheet() {
  const router = useRouter();
  const isOpen = useAppStore((state) => state.isDemoExtractionOpen);
  const setOpen = useAppStore((state) => state.setDemoExtractionOpen);
  const extraction = useAppStore((state) => state.demoExtraction);
  const applyExtraction = useAppStore((state) => state.applyDemoExtraction);
  const cases = useAppStore((state) => state.cases);

  /*
   * Дело не выбирается за пользователя: разбор запускают с рабочего стола,
   * и молча положить реквизиты в первое попавшееся дело — худшее, что можно
   * сделать. Пока дело не указано, кнопка переноса заблокирована.
   */
  const [targetCaseId, setTargetCaseId] = useState<string>("");

  // Новый файл — новый выбор: прошлое дело к нему отношения не имеет.
  useEffect(() => {
    if (isOpen) return;
    setTargetCaseId("");
  }, [isOpen]);

  const isDone = extraction?.status === "done";
  const uncertainCount =
    extraction?.recipe.fields.filter((field) => field.uncertain).length ?? 0;

  // Без разбираемого файла шторке нечего показывать — не открываем её пустой.
  return (
    <Sheet open={isOpen && extraction !== null} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader>
          <MetaLabel>Разбор документа · показ возможностей</MetaLabel>
          <SheetTitle>
            {isDone ? "Реквизиты распознаны" : "Разбираем файл"}
          </SheetTitle>
          <SheetDescription>
            {isDone
              ? "Так выглядит результат разбора. Чтобы разобрать свой файл, загрузите его в дело и выберите «Извлечь реквизиты»."
              : "Распознаём текст, находим реквизиты и сверяем форматы."}
          </SheetDescription>
        </SheetHeader>

        {extraction && (
          <>
            {/* Исходный файл */}
            <div className="flex shrink-0 items-center gap-2.5 border-b border-line px-5 py-3.5">
              <FileText className="h-3.5 w-3.5 shrink-0 text-fg-ghost" />
              <span className="min-w-0 flex-1 truncate text-body text-fg-muted">
                {extraction.file.name}
              </span>
              <span className="shrink-0 font-mono text-label text-fg-faint">
                {formatFileSize(extraction.file.sizeBytes)}
              </span>
            </div>

            <ScrollArea className="min-h-0 flex-1 px-5 py-5">
              {/* Шаги разбора */}
              <ol className="flex flex-col gap-3">
                {EXTRACTION_STEPS.map((step, index) => {
                  const isStepDone = extraction.step > index;
                  const isCurrent =
                    extraction.step === index && extraction.status === "running";

                  return (
                    <li key={step} className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors",
                          isStepDone
                            ? "bg-ok-bg text-ok-fg"
                            : isCurrent
                              ? "bg-fg text-inverse-fg"
                              : "bg-surface-2 text-fg-ghost"
                        )}
                      >
                        {isStepDone ? (
                          <Check className="h-2.5 w-2.5" strokeWidth={3} />
                        ) : isCurrent ? (
                          <Loader2 className="h-2.5 w-2.5 animate-spin" />
                        ) : (
                          <span className="h-1 w-1 rounded-full bg-current" />
                        )}
                      </span>

                      <span
                        className={cn(
                          "text-body transition-colors",
                          isStepDone
                            ? "text-fg-faint"
                            : isCurrent
                              ? "text-fg"
                              : "text-fg-ghost"
                        )}
                      >
                        {step}
                      </span>
                    </li>
                  );
                })}
              </ol>

              {/* Извлечённые реквизиты */}
              <div className="mt-7">
                <MetaLabel>→ {extraction.recipe.targetLabel}</MetaLabel>

                <div className="mt-3 flex flex-col gap-2">
                  {extraction.recipe.fields.map((field, index) => {
                    if (!isDone) {
                      return (
                        <motion.div
                          key={`skeleton-${field.key}`}
                          animate={{ opacity: [0.4, 0.7, 0.4] }}
                          transition={{
                            duration: 1.4,
                            repeat: Infinity,
                            delay: index * 0.15,
                          }}
                          className="h-[42px] rounded-xl border border-line bg-surface"
                        />
                      );
                    }

                    return (
                      <motion.div
                        key={field.key}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.26, delay: index * 0.06 }}
                        className={cn(
                          "flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5",
                          field.uncertain
                            ? "border-warn-line bg-warn-bg/60"
                            : "border-line bg-surface"
                        )}
                      >
                        <span className="shrink-0 text-label text-fg-faint">
                          {field.label}
                        </span>

                        <span className="flex min-w-0 items-center gap-1.5">
                          {field.uncertain && (
                            <AlertTriangle className="h-3 w-3 shrink-0 text-warn-fg" />
                          )}
                          <span className="min-w-0 truncate text-body text-fg">
                            {field.value}
                          </span>
                        </span>
                      </motion.div>
                    );
                  })}
                </div>

                {isDone && uncertainCount > 0 && (
                  <p className="mt-3 text-label leading-relaxed text-fg-subtle">
                    {uncertainCount}{" "}
                    {plural(
                      uncertainCount,
                      "значение распознано",
                      "значения распознаны",
                      "значений распознаны"
                    )}{" "}
                    неуверенно —{" "}
                    {plural(
                      uncertainCount,
                      "оно выделено и требует",
                      "они выделены и требуют",
                      "они выделены и требуют"
                    )}{" "}
                    подтверждения.
                  </p>
                )}
              </div>

              {/* Куда переносить: с рабочего стола дело ещё не выбрано */}
              {isDone && !extraction.applied && (
                <div className="mt-7">
                  <MetaLabel>Перенести в дело</MetaLabel>

                  <div className="mt-3 flex flex-col gap-1.5">
                    {cases.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setTargetCaseId(item.id)}
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors",
                          targetCaseId === item.id
                            ? "border-fg bg-bg"
                            : "border-line hover:border-line-strong"
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 shrink-0 rounded-full",
                            targetCaseId === item.id
                              ? "bg-fg"
                              : "bg-fg-ghost"
                          )}
                        />
                        <span className="min-w-0 flex-1 truncate text-body text-fg-muted">
                          {item.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </ScrollArea>

            <div className="flex shrink-0 items-center gap-2 border-t border-line px-5 py-4">
              {extraction.applied ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-1 items-center gap-2.5"
                >
                  <Check
                    className="h-3.5 w-3.5 shrink-0 text-ok-fg"
                    strokeWidth={3}
                  />

                  <Button
                    variant="outline"
                    className="flex-1 gap-1.5"
                    onClick={() => {
                      setOpen(false);
                      router.push(`/cases/${targetCaseId}`);
                    }}
                  >
                    Перейти к карточке
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </motion.div>
              ) : (
                <Button
                  className="flex-1"
                  disabled={!isDone || !targetCaseId}
                  onClick={() => applyExtraction(targetCaseId)}
                >
                  {isDone && !targetCaseId
                    ? "Выберите дело выше"
                    : "Перенести реквизиты в карточку"}
                </Button>
              )}

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
