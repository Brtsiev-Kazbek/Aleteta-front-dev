"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  FileText,
  Info,
  Lightbulb,
  RotateCcw,
  Scale,
  Sparkles,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { REVIEW_PARAGRAPHS, REVIEW_RISKS } from "@/data/mock-data";
import { cn, formatFileSize, plural } from "@/lib/utils";
import { RISK_LEVEL_META, type RiskLevel } from "@/types";

const RISK_ICONS: Record<RiskLevel, LucideIcon> = {
  critical: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

interface ReviewSplitViewProps {
  file: { name: string; sizeBytes: number };
  /** Загрузить другой документ — возврат к Dropzone. */
  onReset?: () => void;
  /** Закрыть окно проверки целиком. */
  onClose?: () => void;
}

export function ReviewSplitView({
  file,
  onReset,
  onClose,
}: ReviewSplitViewProps) {
  const [activeRiskId, setActiveRiskId] = useState<string | null>(null);
  const [isFixing, setIsFixing] = useState(false);
  const [isFixed, setIsFixed] = useState(false);

  const activeRisk = REVIEW_RISKS.find((risk) => risk.id === activeRiskId);
  const highlightedParagraphId = activeRisk?.paragraphId ?? null;

  /** Соответствие «абзац → риск», чтобы подсветить абзац нужным цветом. */
  const riskByParagraph = useMemo(() => {
    const map = new Map<string, RiskLevel>();
    for (const risk of REVIEW_RISKS) map.set(risk.paragraphId, risk.level);
    return map;
  }, []);

  const counts = useMemo(() => {
    return {
      critical: REVIEW_RISKS.filter((r) => r.level === "critical").length,
      warning: REVIEW_RISKS.filter((r) => r.level === "warning").length,
      info: REVIEW_RISKS.filter((r) => r.level === "info").length,
    };
  }, []);

  function handleGenerateFixed() {
    setIsFixing(true);
    window.setTimeout(() => {
      setIsFixing(false);
      setIsFixed(true);
    }, 1800);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Шапка результата */}
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-stone-200 px-5 py-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50">
          <FileText className="h-4 w-4 text-violet-600" />
        </div>
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-sm font-medium text-stone-900">
            {file.name}
          </span>
          <span className="text-xs text-stone-400">
            {formatFileSize(file.sizeBytes)} · проанализирован
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
            {counts.critical}{" "}
            {plural(counts.critical, "критический", "критических", "критических")}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
            {counts.warning}{" "}
            {plural(counts.warning, "предупреждение", "предупреждения", "предупреждений")}
          </span>
          {onReset && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-8 gap-1.5 text-stone-500 hover:text-stone-900"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Другой файл
            </Button>
          )}

          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-stone-400 hover:text-stone-900"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Закрыть проверку</span>
            </Button>
          )}
        </div>
      </div>

      {/* Split-View */}
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2">
        {/* Левая панель — оригинал */}
        <section className="flex min-h-0 flex-col border-b border-stone-200 lg:border-b-0 lg:border-r">
          <header className="shrink-0 border-b border-stone-200 bg-stone-50/60 px-5 py-2.5">
            <h3 className="text-xs font-medium uppercase tracking-wide text-stone-500">
              Оригинал документа
            </h3>
          </header>

          <div className="scrollable-area min-h-0 flex-1 overflow-auto bg-white px-6 py-6">
            <div className="mx-auto flex max-w-xl flex-col gap-4">
              <h2 className="text-center text-sm font-semibold uppercase tracking-wide text-stone-900">
                Договор купли-продажи земельного участка
              </h2>

              {REVIEW_PARAGRAPHS.map((paragraph) => {
                const isHighlighted = highlightedParagraphId === paragraph.id;
                const level = riskByParagraph.get(paragraph.id);

                return (
                  <motion.div
                    key={paragraph.id}
                    animate={{
                      backgroundColor: isHighlighted
                        ? level === "critical"
                          ? "rgb(254 242 242)"
                          : level === "warning"
                            ? "rgb(255 251 235)"
                            : "rgb(238 242 255)"
                        : "rgba(255,255,255,0)",
                    }}
                    transition={{ duration: 0.25 }}
                    className={cn(
                      "scroll-mt-6 rounded-lg border px-3.5 py-3 transition-colors",
                      isHighlighted
                        ? level === "critical"
                          ? "border-red-200"
                          : level === "warning"
                            ? "border-amber-200"
                            : "border-violet-200"
                        : "border-transparent"
                    )}
                  >
                    <div className="flex gap-2.5">
                      <span
                        className={cn(
                          "shrink-0 text-xs font-medium tabular-nums transition-colors",
                          isHighlighted ? "text-stone-900" : "text-stone-400"
                        )}
                      >
                        {paragraph.clause}
                      </span>
                      <p className="text-sm leading-relaxed text-stone-700">
                        {paragraph.text}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Правая панель — AI-анализ */}
        <section className="flex min-h-0 flex-col bg-stone-50/40">
          <header className="flex shrink-0 items-center gap-2 border-b border-stone-200 bg-stone-50/60 px-5 py-2.5">
            <Sparkles className="h-3.5 w-3.5 text-violet-600" />
            <h3 className="text-xs font-medium uppercase tracking-wide text-stone-500">
              Анализ Алетейи
            </h3>
            <span className="ml-auto text-xs text-stone-400">
              Нажмите на риск — абзац подсветится слева
            </span>
          </header>

          <div className="scrollable-area min-h-0 flex-1 overflow-auto px-5 py-5">
            <div className="flex flex-col gap-3">
              {REVIEW_RISKS.map((risk, index) => {
                const meta = RISK_LEVEL_META[risk.level];
                const Icon = RISK_ICONS[risk.level];
                const isActive = activeRiskId === risk.id;

                return (
                  <motion.button
                    key={risk.id}
                    type="button"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, delay: index * 0.06 }}
                    onClick={() =>
                      setActiveRiskId(isActive ? null : risk.id)
                    }
                    className={cn(
                      "w-full rounded-xl border p-4 text-left transition-shadow",
                      meta.cardClassName,
                      isActive
                        ? "shadow-md ring-2 ring-offset-1 ring-stone-300"
                        : "hover:shadow-sm"
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <Icon
                        className={cn("mt-0.5 h-4 w-4 shrink-0", meta.iconClassName)}
                      />
                      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                              meta.badgeClassName
                            )}
                          >
                            {meta.label}
                          </span>
                          <span className="text-xs text-stone-500">
                            пункт{" "}
                            {
                              REVIEW_PARAGRAPHS.find(
                                (p) => p.id === risk.paragraphId
                              )?.clause
                            }
                          </span>
                        </div>

                        <p className="text-sm font-medium text-stone-900">
                          {risk.title}
                        </p>
                        <p className="text-sm leading-relaxed text-stone-600">
                          {risk.description}
                        </p>

                        {isActive && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mt-1.5 flex flex-col gap-2"
                          >
                            <div className="flex gap-2 rounded-lg border border-stone-200 bg-white p-3">
                              <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                              <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-medium text-stone-900">
                                  Рекомендация
                                </span>
                                <span className="text-xs leading-relaxed text-stone-600">
                                  {risk.recommendation}
                                </span>
                              </div>
                            </div>

                            {/* Судебная практика по этому пункту */}
                            {risk.practice && risk.practice.length > 0 && (
                              <div className="rounded-lg border border-stone-200 bg-white p-3">
                                <div className="flex items-center gap-1.5">
                                  <Scale className="h-3.5 w-3.5 shrink-0 text-violet-600" />
                                  <span className="text-xs font-medium text-stone-900">
                                    Судебная практика по пункту
                                  </span>
                                  <span className="ml-auto font-mono text-[10px] text-stone-400">
                                    {risk.practice.length} акта
                                  </span>
                                </div>

                                <ul className="mt-2.5 flex flex-col gap-2.5">
                                  {risk.practice.map((item) => (
                                    <li
                                      key={item.id}
                                      className="border-l-2 border-stone-200 pl-2.5"
                                    >
                                      <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="text-[11px] font-medium text-stone-800">
                                          {item.court}
                                        </span>
                                        <span className="font-mono text-[10px] text-stone-400">
                                          № {item.number} · {item.year}
                                        </span>
                                        <span
                                          className={cn(
                                            "rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em]",
                                            item.side === "against"
                                              ? "border-red-200 bg-red-50 text-red-700"
                                              : "border-emerald-200 bg-emerald-50 text-emerald-700"
                                          )}
                                        >
                                          {item.side === "against"
                                            ? "против условия"
                                            : "в вашу пользу"}
                                        </span>
                                      </div>
                                      <p className="mt-1 text-[11px] leading-relaxed text-stone-600">
                                        {item.holding}
                                      </p>
                                    </li>
                                  ))}
                                </ul>

                                <p className="mt-2.5 font-mono text-[9px] uppercase tracking-[0.1em] text-stone-300">
                                  Демонстрационные данные
                                </p>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Действие */}
          <div className="shrink-0 border-t border-stone-200 bg-white px-5 py-3.5">
            {isFixed ? (
              <div className="flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5">
                <Sparkles className="h-4 w-4 shrink-0 text-emerald-600" />
                <span className="text-sm text-emerald-800">
                  Исправленная версия готова — все {REVIEW_RISKS.length}{" "}
                  {plural(REVIEW_RISKS.length, "замечание", "замечания", "замечаний")}{" "}
                  устранены
                </span>
              </div>
            ) : (
              <Button
                className="w-full gap-2"
                onClick={handleGenerateFixed}
                disabled={isFixing}
              >
                <Sparkles
                  className={cn("h-4 w-4", isFixing && "animate-pulse")}
                />
                {isFixing
                  ? "Формируем исправленную версию…"
                  : "Сгенерировать исправленную версию"}
              </Button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
