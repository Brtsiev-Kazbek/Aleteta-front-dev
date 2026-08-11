"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  Check,
  Gavel,
  Info,
  Loader2,
  RotateCcw,
  Scale,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MetaLabel } from "@/components/layout/PanelHeading";
import { REVIEW_PARAGRAPHS, REVIEW_RISKS } from "@/data/mock-data";
import { cn, formatFileSize, plural } from "@/lib/utils";
import { RISK_LEVEL_META, type RiskLevel } from "@/types";

const RISK_ICONS: Record<RiskLevel, LucideIcon> = {
  critical: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

/** Подсветка абзаца под уровень замечания. */
const HIGHLIGHT: Record<RiskLevel, { background: string; border: string }> = {
  critical: { background: "rgb(254 242 242)", border: "border-danger-line" },
  warning: { background: "rgb(255 251 235)", border: "border-warn-line" },
  info: { background: "rgb(245 245 244)", border: "border-line-strong" },
};

interface ReviewSplitViewProps {
  file: { name: string; sizeBytes: number };
  /** Замечание, раскрытое сразу при открытии — например, с практикой. */
  initialRiskId?: string;
  /** Загрузить другой документ — возврат к дропзоне. */
  onReset?: () => void;
  /** Закрыть окно проверки целиком. */
  onClose?: () => void;
}

export function ReviewSplitView({
  file,
  initialRiskId,
  onReset,
  onClose,
}: ReviewSplitViewProps) {
  const [activeRiskId, setActiveRiskId] = useState<string | null>(
    initialRiskId ?? null
  );
  const [isFixing, setIsFixing] = useState(false);
  const [isFixed, setIsFixed] = useState(false);

  const activeRisk = REVIEW_RISKS.find((risk) => risk.id === activeRiskId);
  const highlightedParagraphId = activeRisk?.paragraphId ?? null;

  /*
   * Подсветить абзац мало: в длинном договоре он может остаться за экраном.
   * Держим ссылки на абзацы и подводим нужный к глазам.
   */
  const paragraphRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!highlightedParagraphId) return;

    const node = paragraphRefs.current[highlightedParagraphId];
    node?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightedParagraphId]);

  /** Соответствие «абзац → риск», чтобы подсветить абзац нужным цветом. */
  const riskByParagraph = useMemo(() => {
    const map = new Map<string, RiskLevel>();
    for (const risk of REVIEW_RISKS) map.set(risk.paragraphId, risk.level);
    return map;
  }, []);

  const counts = useMemo(
    () => ({
      critical: REVIEW_RISKS.filter((r) => r.level === "critical").length,
      warning: REVIEW_RISKS.filter((r) => r.level === "warning").length,
      info: REVIEW_RISKS.filter((r) => r.level === "info").length,
    }),
    []
  );

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
      <div className="flex shrink-0 flex-wrap items-center gap-4 border-b border-line px-5 py-3.5">
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-body text-fg">
            {file.name}
          </span>
          <span className="mt-1 font-mono text-label uppercase text-fg-faint">
            {formatFileSize(file.sizeBytes)} · разобран по пунктам
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-danger-line px-2 py-1 font-mono text-label uppercase text-danger-fg">
            <AlertCircle className="h-3 w-3" />
            {counts.critical}{" "}
            {plural(
              counts.critical,
              "критическое",
              "критических",
              "критических"
            )}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-warn-line px-2 py-1 font-mono text-label uppercase text-warn-fg">
            <AlertTriangle className="h-3 w-3" />
            {counts.warning}{" "}
            {plural(
              counts.warning,
              "предупреждение",
              "предупреждения",
              "предупреждений"
            )}
          </span>

          {onReset && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-8 gap-1.5"
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
              className="h-8 w-8"
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
        <section className="flex min-h-0 flex-col border-b border-line lg:border-b-0 lg:border-r">
          <header className="shrink-0 border-b border-line px-5 py-2.5">
            <MetaLabel>Оригинал документа</MetaLabel>
          </header>

          <div className="scrollable-area min-h-0 flex-1 overflow-auto bg-surface-2 px-6 py-6">
            <div className="mx-auto flex max-w-xl flex-col gap-3 bg-surface px-8 py-9 shadow-sm">
              <h2 className="text-center text-label font-bold uppercase leading-relaxed text-fg">
                Договор купли-продажи земельного участка
              </h2>

              {REVIEW_PARAGRAPHS.map((paragraph) => {
                const isHighlighted = highlightedParagraphId === paragraph.id;
                const level = riskByParagraph.get(paragraph.id);
                const highlight = level ? HIGHLIGHT[level] : null;

                return (
                  <motion.div
                    key={paragraph.id}
                    ref={(node) => {
                      paragraphRefs.current[paragraph.id] = node;
                    }}
                    animate={{
                      backgroundColor:
                        isHighlighted && highlight
                          ? highlight.background
                          : "rgba(255,255,255,0)",
                    }}
                    transition={{ duration: 0.25 }}
                    className={cn(
                      "scroll-mt-6 rounded-xl border px-3 py-2.5 transition-colors",
                      isHighlighted && highlight
                        ? highlight.border
                        : "border-transparent"
                    )}
                  >
                    <div className="flex gap-2.5">
                      <span className="flex shrink-0 items-baseline gap-1">
                        {/* Абзацы с замечаниями помечены и до нажатия */}
                        <span
                          aria-hidden
                          className={cn(
                            "h-1 w-1 rounded-full transition-colors",
                            level === "critical"
                              ? "bg-danger"
                              : level === "warning"
                                ? "bg-warn"
                                : level
                                  ? "bg-fg-faint"
                                  : "bg-transparent"
                          )}
                        />
                        <span
                          className={cn(
                            "font-mono text-label tabular-nums transition-colors",
                            isHighlighted ? "text-fg" : "text-fg-faint"
                          )}
                        >
                          {paragraph.clause}
                        </span>
                      </span>

                      <p className="text-justify text-label leading-[1.75] text-fg-muted">
                        {paragraph.text}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Правая панель — разбор */}
        <section className="flex min-h-0 flex-col">
          <header className="flex shrink-0 items-center gap-3 border-b border-line px-5 py-2.5">
            <MetaLabel>Разбор Алетейи</MetaLabel>
            <span className="ml-auto text-label text-fg-faint">
              Нажмите на замечание — абзац подсветится слева
            </span>
          </header>

          <div className="scrollable-area min-h-0 flex-1 overflow-auto bg-bg/60 px-5 py-5">
            <div className="flex flex-col gap-2.5">
              {REVIEW_RISKS.map((risk, index) => {
                const meta = RISK_LEVEL_META[risk.level];
                const Icon = RISK_ICONS[risk.level];
                const isActive = activeRiskId === risk.id;
                const clause = REVIEW_PARAGRAPHS.find(
                  (p) => p.id === risk.paragraphId
                )?.clause;

                return (
                  <motion.button
                    key={risk.id}
                    type="button"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, delay: index * 0.06 }}
                    onClick={() => setActiveRiskId(isActive ? null : risk.id)}
                    className={cn(
                      "w-full rounded-xl border p-4 text-left transition-colors",
                      meta.cardClassName,
                      isActive && "border-fg"
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <Icon
                        className={cn(
                          "mt-0.5 h-3.5 w-3.5 shrink-0",
                          meta.iconClassName
                        )}
                      />

                      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "rounded-full border px-1.5 py-0.5 font-mono text-label uppercase ",
                              meta.badgeClassName
                            )}
                          >
                            {meta.label}
                          </span>
                          <span className="font-mono text-label text-fg-faint">
                            п. {clause}
                          </span>
                        </div>

                        <p className="text-body font-medium text-fg">
                          {risk.title}
                        </p>
                        <p className="text-body leading-relaxed text-fg-soft">
                          {risk.description}
                        </p>

                        <AnimatePresence initial={false}>
                          {isActive && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-1.5 flex flex-col gap-2 overflow-hidden"
                            >
                              <div className="rounded-xl border border-line bg-surface p-3">
                                <MetaLabel>Формулировка правки</MetaLabel>
                                <p className="mt-2 text-label leading-relaxed text-fg-soft">
                                  {risk.recommendation}
                                </p>
                              </div>

                              {/* Судебная практика подбирается по этому пункту */}
                              {risk.practice && risk.practice.length > 0 && (
                                <CasePractice
                                  riskId={risk.id}
                                  clause={clause ?? ""}
                                  practice={risk.practice}
                                />
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Действие */}
          <div className="shrink-0 border-t border-line bg-surface px-5 py-3.5">
            {isFixed ? (
              <div className="flex items-center gap-2.5">
                <Check
                  className="h-3.5 w-3.5 shrink-0 text-ok-fg"
                  strokeWidth={3}
                />
                <span className="text-body text-fg-soft">
                  Исправленная редакция готова — учтены все{" "}
                  {REVIEW_RISKS.length}{" "}
                  {plural(
                    REVIEW_RISKS.length,
                    "замечание",
                    "замечания",
                    "замечаний"
                  )}
                </span>
              </div>
            ) : (
              <Button
                className="w-full"
                onClick={handleGenerateFixed}
                disabled={isFixing}
              >
                {isFixing
                  ? "Формируем исправленную редакцию…"
                  : "Сформировать исправленную редакцию"}
              </Button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  СУДЕБНАЯ ПРАКТИКА ПО ПУНКТУ                                        */
/* ------------------------------------------------------------------ */

/**
 * Практика не лежит готовой рядом с замечанием — она подбирается по тексту
 * конкретного пункта. Поиск показан отдельным шагом, иначе непонятно, что
 * акты относятся именно к этому условию.
 */
function CasePractice({
  riskId,
  clause,
  practice,
}: {
  riskId: string;
  clause: string;
  practice: NonNullable<
    (typeof REVIEW_RISKS)[number]["practice"]
  >;
}) {
  const [isSearching, setSearching] = useState(true);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setSearching(true);
    timerRef.current = window.setTimeout(() => setSearching(false), 900);

    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [riskId]);

  return (
    <div className="rounded-xl border border-line bg-surface p-3">
      <div className="flex items-center gap-1.5">
        {isSearching ? (
          <Loader2 className="h-3 w-3 shrink-0 animate-spin text-fg" />
        ) : (
          <Scale className="h-3 w-3 shrink-0 text-fg-faint" />
        )}
        <span className="font-mono text-label uppercase text-fg-faint">
          {isSearching ? `Ищу практику по п. ${clause}` : "Судебная практика"}
        </span>
        {!isSearching && (
          <span className="ml-auto font-mono text-label tabular-nums text-fg-faint">
            {practice.length} акта
          </span>
        )}
      </div>

      {isSearching ? (
        <div className="mt-2.5 flex flex-col gap-1.5">
          {practice.map((item, index) => (
            <motion.div
              key={item.id}
              animate={{ opacity: [0.35, 0.65, 0.35] }}
              transition={{
                duration: 1.3,
                repeat: Infinity,
                delay: index * 0.15,
              }}
              className="h-9 rounded-xl border border-line"
            />
          ))}
        </div>
      ) : (
        <>
          <ul className="mt-2.5 flex flex-col gap-2.5">
            {practice.map((item, index) => (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.26, delay: index * 0.08 }}
                className="border-l border-line pl-2.5"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <Gavel className="h-3 w-3 shrink-0 text-fg-ghost" />
                  <span className="text-label font-medium text-fg">
                    {item.court}
                  </span>
                  <span className="font-mono text-label text-fg-faint">
                    № {item.number} · {item.year}
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-1.5 py-0.5 font-mono text-label uppercase ",
                      item.side === "against"
                        ? "border-danger-line text-danger-fg"
                        : "border-ok-line text-ok-fg"
                    )}
                  >
                    {item.side === "against"
                      ? "против условия"
                      : "в вашу пользу"}
                  </span>
                </div>
                <p className="mt-1 text-label leading-relaxed text-fg-soft">
                  {item.holding}
                </p>
              </motion.li>
            ))}
          </ul>

          <p className="mt-2.5 font-mono text-label uppercase text-fg-ghost">
            Демонстрационные данные
          </p>
        </>
      )}
    </div>
  );
}
