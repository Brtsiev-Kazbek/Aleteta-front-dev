"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  Check,
  Copy,
  Download,
  FolderPlus,
  RotateCcw,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { AutoGrowTextarea } from "@/components/ui/textarea";
import { MetaLabel } from "@/components/layout/PanelHeading";
import { GENERATED_DOCUMENT_SAMPLE } from "@/data/mock-data";
import { matchFreeformTemplate } from "@/lib/templates";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import type { TemplateMatch } from "@/types";

type Stage = "idle" | "searching" | "typing" | "done";

const QUICK_PROMPTS = [
  "Соглашение о конфиденциальности с подрядчиком на 3 года",
  "Допсоглашение о рассрочке платежа на 6 месяцев",
  "Акт приёма-передачи земельного участка",
];

interface AIGeneratorProps {
  /** Вызывается после создания дела — чтобы родитель мог закрыть шторку. */
  onClose?: () => void;
}

export function AIGenerator({ onClose }: AIGeneratorProps) {
  const router = useRouter();
  const createCase = useAppStore((state) => state.createCase);

  const [prompt, setPrompt] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [visibleText, setVisibleText] = useState("");
  const [match, setMatch] = useState<TemplateMatch | null>(null);
  const [copied, setCopied] = useState(false);

  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    for (const id of timersRef.current) window.clearTimeout(id);
    timersRef.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const startGeneration = useCallback(() => {
    if (!prompt.trim()) return;

    clearTimers();
    setStage("searching");
    setVisibleText("");
    setMatch(null);
    setCopied(false);

    /*
     * Сначала показываем поиск подходящей формы — от этого зависит, что
     * происходит дальше: подстановка реквизитов в шаблон или составление
     * документа с нуля.
     */
    timersRef.current.push(
      window.setTimeout(() => {
        setMatch(matchFreeformTemplate(prompt));

        timersRef.current.push(
          window.setTimeout(() => {
            setStage("typing");

            const full = GENERATED_DOCUMENT_SAMPLE;
            const step = 4; // символов за тик — иначе печать слишком медленная
            let index = 0;

            const tick = () => {
              index = Math.min(index + step, full.length);
              setVisibleText(full.slice(0, index));

              if (index < full.length) {
                timersRef.current.push(window.setTimeout(tick, 12));
              } else {
                setStage("done");
              }
            };

            tick();
          }, 700)
        );
      }, 1000)
    );
  }, [prompt, clearTimers]);

  function reset() {
    clearTimers();
    setStage("idle");
    setVisibleText("");
    setPrompt("");
    setMatch(null);
    setCopied(false);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(GENERATED_DOCUMENT_SAMPLE);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Буфер обмена может быть недоступен — молча остаёмся в прежнем виде.
      setCopied(false);
    }
  }

  function handleSaveDocx() {
    const blob = new Blob([GENERATED_DOCUMENT_SAMPLE], {
      type: "application/msword;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Документ_Алетейя.doc";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function handleCreateCase() {
    const title =
      prompt.trim().slice(0, 90) || "Дело из сгенерированного документа";

    const created = await createCase(title);
    // Дело не создалось — причину показывает общее уведомление об ошибке
    // записи, и уводить человека с экрана в этом случае нельзя.
    if (!created) return;

    onClose?.();
    router.push(`/cases/${created.id}`);
  }

  const isBusy = stage === "searching" || stage === "typing";

  return (
    <div className="scrollable-area h-full overflow-auto px-6 py-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col">
        {/* Поле запроса */}
        <div
          className={cn(
            "rounded-lg border bg-surface p-4 transition-colors",
            prompt.trim() ? "border-stone-900" : "border-line"
          )}
        >
          <AutoGrowTextarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                startGeneration();
              }
            }}
            placeholder="Например: соглашение о конфиденциальности с подрядчиком на 3 года, с ответственностью за разглашение…"
            disabled={isBusy}
          />

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-line-soft pt-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-fg-faint">
              Enter — сгенерировать
            </span>
            <Button
              size="sm"
              onClick={startGeneration}
              disabled={!prompt.trim() || isBusy}
              className="gap-1.5"
            >
              <ArrowUp className="h-3.5 w-3.5" />
              Сгенерировать
            </Button>
          </div>
        </div>

        {/* Подсказки */}
        {stage === "idle" && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {QUICK_PROMPTS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setPrompt(item)}
                className="rounded border border-line bg-surface px-2.5 py-1.5 text-xs text-fg-soft transition-colors hover:border-stone-900 hover:text-fg"
              >
                {item}
              </button>
            ))}
          </div>
        )}

        {/* Поиск шаблона и вердикт */}
        <AnimatePresence>
          {stage !== "idle" && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center gap-2"
            >
              <Search
                className={cn(
                  "h-3.5 w-3.5 shrink-0",
                  stage === "searching"
                    ? "animate-pulse text-fg"
                    : "text-fg-faint"
                )}
              />

              {stage === "searching" ? (
                <span className="text-[11px] text-fg-subtle">
                  Проверяю, есть ли подходящий шаблон…
                </span>
              ) : match?.found ? (
                <span className="text-[11px] text-fg-soft">
                  Шаблон найден:{" "}
                  <span className="text-fg">{match.name}</span> —
                  реквизиты подставлены
                </span>
              ) : (
                <span className="text-[11px] text-fg-soft">
                  Шаблона нет —{" "}
                  <span className="font-medium text-violet-700">
                    документ составлен с нуля
                  </span>
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Лист документа */}
        {(stage === "typing" || stage === "done") && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 overflow-hidden rounded-lg border border-line bg-surface"
          >
            <div className="flex items-center gap-3 border-b border-line px-5 py-2.5">
              <MetaLabel>Документ</MetaLabel>
              {stage === "typing" && (
                <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.12em] text-fg-faint">
                  составляется
                </span>
              )}
            </div>

            <div className="bg-surface-2 p-5">
              <article className="mx-auto max-w-[32rem] bg-surface px-8 py-9 shadow-sm">
                <MarkdownDocument
                  text={visibleText}
                  showCaret={stage === "typing"}
                />
              </article>
            </div>

            {stage === "done" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-3.5"
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="gap-1.5"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied ? "Скопировано" : "Скопировать"}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveDocx}
                  className="gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  Сохранить в DOCX
                </Button>

                <Button size="sm" onClick={handleCreateCase} className="gap-1.5">
                  <FolderPlus className="h-3.5 w-3.5" />
                  Создать дело из документа
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={reset}
                  className="ml-auto gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Заново
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

/**
 * Минимальный рендерер Markdown под формат генерируемых документов:
 * заголовки `#`/`##`, пустые строки и обычные абзацы. Набор — как у листа
 * документа на лендинге: узкая колонка, выключка по формату.
 */
function MarkdownDocument({
  text,
  showCaret,
}: {
  text: string;
  showCaret: boolean;
}) {
  const lines = text.split("\n");

  return (
    <div className="flex flex-col">
      {lines.map((line, index) => {
        const isLast = index === lines.length - 1;
        const caret = showCaret && isLast && (
          <span className="ml-0.5 inline-block h-3 w-px animate-pulse bg-stone-900 align-middle" />
        );

        if (line.startsWith("## ")) {
          return (
            <h3
              key={index}
              className="mt-5 text-[10px] font-bold text-fg"
            >
              {line.slice(3)}
              {caret}
            </h3>
          );
        }

        if (line.startsWith("# ")) {
          return (
            <h2
              key={index}
              className="text-center text-[11px] font-bold uppercase leading-relaxed tracking-wide text-fg"
            >
              {line.slice(2)}
              {caret}
            </h2>
          );
        }

        if (!line.trim()) {
          return (
            <div key={index} className="h-0">
              {caret}
            </div>
          );
        }

        return (
          <p
            key={index}
            className="mt-2.5 text-justify text-[10px] leading-[1.75] text-fg-muted"
          >
            {line}
            {caret}
          </p>
        );
      })}
    </div>
  );
}
