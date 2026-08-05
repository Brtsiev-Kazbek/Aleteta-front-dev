"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  FileText,
  Loader2,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn, formatFileSize } from "@/lib/utils";

/** Шаги «умной загрузки», которые видит пользователь во время анализа. */
const ANALYSIS_STEPS = [
  "Распознавание текста...",
  "Анализ рисков...",
  "Подготовка отчёта...",
] as const;

const STEP_DURATION_MS = 1200;

interface AIReviewDropzoneProps {
  /** Вызывается, когда анализ завершён — родитель показывает Split-View. */
  onAnalyzed: (file: { name: string; sizeBytes: number }) => void;
}

export function AIReviewDropzone({ onAnalyzed }: AIReviewDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const timersRef = useRef<number[]>([]);

  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<{ name: string; sizeBytes: number } | null>(
    null
  );
  const [stepIndex, setStepIndex] = useState(-1);

  const clearTimers = useCallback(() => {
    for (const id of timersRef.current) window.clearTimeout(id);
    timersRef.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const startAnalysis = useCallback(
    (picked: { name: string; sizeBytes: number }) => {
      clearTimers();
      setFile(picked);
      setStepIndex(0);

      ANALYSIS_STEPS.forEach((_, index) => {
        const id = window.setTimeout(
          () => setStepIndex(index + 1),
          STEP_DURATION_MS * (index + 1)
        );
        timersRef.current.push(id);
      });

      const doneId = window.setTimeout(
        () => onAnalyzed(picked),
        STEP_DURATION_MS * ANALYSIS_STEPS.length + 500
      );
      timersRef.current.push(doneId);
    },
    [clearTimers, onAnalyzed]
  );

  function handleFiles(list: FileList | null) {
    const picked = list?.[0];
    if (!picked) return;
    startAnalysis({ name: picked.name, sizeBytes: picked.size });
  }

  const isAnalyzing = file !== null;
  const progress = isAnalyzing
    ? Math.min(100, (stepIndex / ANALYSIS_STEPS.length) * 100)
    : 0;

  return (
    <div className="flex flex-col gap-4">
      <AnimatePresence mode="wait">
        {!isAnalyzing ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                handleFiles(event.dataTransfer.files);
              }}
              onClick={() => inputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  inputRef.current?.click();
                }
              }}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-8 py-16 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400",
                isDragging
                  ? "border-indigo-600 bg-indigo-50/70"
                  : "border-zinc-300 bg-white hover:border-zinc-400 hover:bg-zinc-50/60"
              )}
            >
              <motion.div
                animate={isDragging ? { scale: 1.08, y: -4 } : { scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-2xl transition-colors",
                  isDragging ? "bg-indigo-100" : "bg-zinc-100"
                )}
              >
                <UploadCloud
                  className={cn(
                    "h-6 w-6 transition-colors",
                    isDragging ? "text-indigo-600" : "text-zinc-400"
                  )}
                />
              </motion.div>

              <div className="flex flex-col gap-1">
                <p
                  className={cn(
                    "text-sm font-medium transition-colors",
                    isDragging ? "text-indigo-700" : "text-zinc-900"
                  )}
                >
                  Перетащите файл сюда или нажмите для выбора
                </p>
                <p className="text-xs text-zinc-500">
                  Поддерживаются PDF и DOCX, до 25 МБ
                </p>
              </div>

              <div className="mt-1 flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-500">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Разбор по пунктам с указанием формулировок
              </div>
            </div>

            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx"
              onChange={(event) => {
                handleFiles(event.target.files);
                event.target.value = "";
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="analysis"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                <FileText className="h-5 w-5 text-indigo-600" />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-zinc-900">
                  {file.name}
                </span>
                <span className="text-xs text-zinc-400">
                  {formatFileSize(file.sizeBytes)}
                </span>
              </div>
            </div>

            <Progress value={progress} className="mt-5" />

            <ol className="mt-5 flex flex-col gap-3">
              {ANALYSIS_STEPS.map((step, index) => {
                const isDone = stepIndex > index;
                const isCurrent = stepIndex === index;

                return (
                  <li key={step} className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors",
                        isDone
                          ? "bg-emerald-100 text-emerald-600"
                          : isCurrent
                            ? "bg-indigo-100 text-indigo-600"
                            : "bg-zinc-100 text-zinc-300"
                      )}
                    >
                      {isDone ? (
                        <Check className="h-3 w-3" strokeWidth={3} />
                      ) : isCurrent ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      )}
                    </span>
                    <span
                      className={cn(
                        "text-sm transition-colors",
                        isDone
                          ? "text-zinc-500"
                          : isCurrent
                            ? "font-medium text-zinc-900"
                            : "text-zinc-400"
                      )}
                    >
                      {step}
                    </span>
                  </li>
                );
              })}
            </ol>
          </motion.div>
        )}
      </AnimatePresence>

      {!isAnalyzing && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-zinc-500 hover:text-zinc-900"
            onClick={() =>
              startAnalysis({
                name: "Договор_купли-продажи_участка.pdf",
                sizeBytes: 1_258_291,
              })
            }
          >
            Или попробуйте на демо-договоре
          </Button>
        </div>
      )}
    </div>
  );
}
