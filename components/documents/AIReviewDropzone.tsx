"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { FileDropzone, type PickedFile } from "@/components/documents/FileDropzone";
import { MetaLabel } from "@/components/layout/PanelHeading";
import { cn, formatFileSize } from "@/lib/utils";

/** Шаги разбора, которые видит пользователь во время анализа. */
const ANALYSIS_STEPS = [
  "Распознавание текста",
  "Разбор по пунктам",
  "Подбор формулировок правок",
] as const;

const STEP_DURATION_MS = 1000;

interface AIReviewDropzoneProps {
  /** Вызывается, когда разбор завершён — родитель показывает Split-View. */
  onAnalyzed: (file: PickedFile) => void;
}

export function AIReviewDropzone({ onAnalyzed }: AIReviewDropzoneProps) {
  const timersRef = useRef<number[]>([]);

  const [file, setFile] = useState<PickedFile | null>(null);
  const [stepIndex, setStepIndex] = useState(-1);

  const clearTimers = useCallback(() => {
    for (const id of timersRef.current) window.clearTimeout(id);
    timersRef.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const startAnalysis = useCallback(
    (picked: PickedFile) => {
      clearTimers();
      setFile(picked);
      setStepIndex(0);

      ANALYSIS_STEPS.forEach((_, index) => {
        timersRef.current.push(
          window.setTimeout(
            () => setStepIndex(index + 1),
            STEP_DURATION_MS * (index + 1)
          )
        );
      });

      timersRef.current.push(
        window.setTimeout(
          () => onAnalyzed(picked),
          STEP_DURATION_MS * ANALYSIS_STEPS.length + 400
        )
      );
    },
    [clearTimers, onAnalyzed]
  );

  const isAnalyzing = file !== null;
  const progress = isAnalyzing
    ? Math.min(100, (stepIndex / ANALYSIS_STEPS.length) * 100)
    : 0;

  /*
   * Состояния сменяются простым условием: ожидание ухода одного блока ради
   * появления другого рискует зависнуть, если кадры не отрисовываются.
   */
  return (
    <>
      {!isAnalyzing ? (
        <motion.div
          key="dropzone"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <FileDropzone
            accept=".pdf,.doc,.docx"
            hint="PDF и DOCX, до 25 МБ"
            demoFile={{
              name: "Договор_купли-продажи_участка.pdf",
              sizeBytes: 1_258_291,
            }}
            demoLabel="Или разберите демонстрационный договор"
            onPick={startAnalysis}
          />
        </motion.div>
      ) : (
        <motion.div
          key="analysis"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-stone-200 bg-white p-5"
        >
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-[13px] text-stone-900">
              {file.name}
            </span>
            <span className="shrink-0 font-mono text-[10px] text-stone-400">
              {formatFileSize(file.sizeBytes)}
            </span>
          </div>

          <Progress value={progress} className="mt-4" />

          <ol className="mt-5 flex flex-col gap-3">
            {ANALYSIS_STEPS.map((step, index) => {
              const isDone = stepIndex > index;
              const isCurrent = stepIndex === index;

              return (
                <li key={step} className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors",
                      isDone
                        ? "bg-emerald-100 text-emerald-600"
                        : isCurrent
                          ? "bg-stone-900 text-white"
                          : "bg-stone-100 text-stone-300"
                    )}
                  >
                    {isDone ? (
                      <Check className="h-2.5 w-2.5" strokeWidth={3} />
                    ) : isCurrent ? (
                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                    ) : (
                      <span className="h-1 w-1 rounded-full bg-current" />
                    )}
                  </span>

                  <span
                    className={cn(
                      "text-[13px] transition-colors",
                      isDone
                        ? "text-stone-400"
                        : isCurrent
                          ? "text-stone-900"
                          : "text-stone-300"
                    )}
                  >
                    {step}
                  </span>
                </li>
              );
            })}
          </ol>

          <div className="mt-5 border-t border-stone-200 pt-3">
            <MetaLabel>
              Замечания привязываются к абзацам исходного текста
            </MetaLabel>
          </div>
        </motion.div>
      )}
    </>
  );
}
