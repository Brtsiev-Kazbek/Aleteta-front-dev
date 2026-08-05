"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUp,
  Check,
  Copy,
  FileDown,
  FolderPlus,
  RotateCcw,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { AutoGrowTextarea } from "@/components/ui/textarea";
import { GENERATED_DOCUMENT_SAMPLE } from "@/data/mock-data";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

type Stage = "idle" | "thinking" | "typing" | "done";

const QUICK_PROMPTS = [
  "Составь договор аренды нежилого помещения",
  "Подготовь исковое заявление о взыскании задолженности",
  "Сделай акт приёма-передачи земельного участка",
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
    setStage("thinking");
    setVisibleText("");
    setCopied(false);

    // Пауза «на обдумывание», затем посимвольная печать документа.
    const thinkingTimer = window.setTimeout(() => {
      setStage("typing");

      const full = GENERATED_DOCUMENT_SAMPLE;
      const step = 4; // символов за тик — иначе печать слишком медленная
      let index = 0;

      const tick = () => {
        index = Math.min(index + step, full.length);
        setVisibleText(full.slice(0, index));

        if (index < full.length) {
          const id = window.setTimeout(tick, 12);
          timersRef.current.push(id);
        } else {
          setStage("done");
        }
      };

      tick();
    }, 1100);

    timersRef.current.push(thinkingTimer);
  }, [prompt, clearTimers]);

  function reset() {
    clearTimers();
    setStage("idle");
    setVisibleText("");
    setPrompt("");
    setCopied(false);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(GENERATED_DOCUMENT_SAMPLE);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Буфер обмена может быть недоступен — выделяем текст как запасной путь.
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

  function handleCreateCase() {
    const title = prompt.trim().slice(0, 90) || "Дело из сгенерированного документа";
    const created = createCase(title);
    onClose?.();
    router.push(`/cases/${created.id}`);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-auto px-6 py-8">
        <div className="mx-auto flex w-full max-w-2xl flex-col">
          {/* Заголовок скрывается, как только пошла генерация */}
          <AnimatePresence initial={false}>
            {stage === "idle" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                className="mb-6 flex flex-col items-center text-center"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-violet-500 shadow-sm">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-stone-900">
                  Что будем писать сегодня?
                </h2>
                <p className="mt-2 max-w-md text-sm text-stone-500">
                  Опишите документ своими словами — Алетейя составит его
                  целиком, со структурой, реквизитами и юридическими
                  формулировками.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Поле ввода */}
          <div
            className={cn(
              "rounded-xl border bg-white p-4 shadow-sm transition-colors",
              prompt.trim()
                ? "border-violet-200 ring-2 ring-violet-100"
                : "border-stone-200"
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
              placeholder="Например: Составь договор аренды нежилого помещения площадью 440 кв.м. во Владикавказе, добавь пункт о штрафах за просрочку платежа..."
              disabled={stage === "thinking" || stage === "typing"}
            />

            <div className="mt-3 flex items-center justify-between gap-3 border-t border-stone-100 pt-3">
              <span className="text-xs text-stone-400">
                Enter — сгенерировать, Shift+Enter — новая строка
              </span>
              <Button
                size="sm"
                onClick={startGeneration}
                disabled={
                  !prompt.trim() || stage === "thinking" || stage === "typing"
                }
                className="h-8 gap-1.5"
              >
                <ArrowUp className="h-3.5 w-3.5" />
                Сгенерировать
              </Button>
            </div>
          </div>

          {/* Быстрые подсказки */}
          {stage === "idle" && (
            <div className="mt-4 flex flex-wrap gap-2">
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
          )}

          {/* Скелетон «обдумывания» */}
          <AnimatePresence>
            {stage === "thinking" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-6 rounded-xl border border-stone-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center gap-2 text-sm text-stone-500">
                  <Sparkles className="h-4 w-4 animate-pulse text-violet-600" />
                  Алетейя составляет документ…
                </div>

                <div className="mt-5 flex flex-col gap-3">
                  {[
                    "60%",
                    "92%",
                    "78%",
                    "96%",
                    "48%",
                    "88%",
                    "70%",
                  ].map((width, index) => (
                    <motion.div
                      key={width + index}
                      className="h-3 rounded-full bg-stone-100"
                      style={{ width }}
                      animate={{ opacity: [0.45, 1, 0.45] }}
                      transition={{
                        duration: 1.3,
                        repeat: Infinity,
                        delay: index * 0.12,
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Результат генерации */}
          {(stage === "typing" || stage === "done") && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"
            >
              <div className="flex items-center gap-2 border-b border-stone-200 bg-stone-50/60 px-5 py-3">
                <Sparkles className="h-4 w-4 text-violet-600" />
                <span className="text-sm font-medium text-stone-900">
                  Сгенерированный документ
                </span>
                {stage === "typing" && (
                  <span className="ml-auto text-xs text-stone-400">
                    печатает…
                  </span>
                )}
              </div>

              <article className="px-6 py-5">
                <MarkdownDocument
                  text={visibleText}
                  showCaret={stage === "typing"}
                />
              </article>

              {stage === "done" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-wrap items-center gap-2 border-t border-stone-200 bg-stone-50/60 px-5 py-3.5"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="gap-1.5 border-stone-200 bg-white"
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
                    className="gap-1.5 border-stone-200 bg-white"
                  >
                    <FileDown className="h-3.5 w-3.5" />
                    Сохранить в DOCX
                  </Button>

                  <Button size="sm" onClick={handleCreateCase} className="gap-1.5">
                    <FolderPlus className="h-3.5 w-3.5" />
                    Создать дело из этого документа
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={reset}
                    className="ml-auto gap-1.5 text-stone-500 hover:text-stone-900"
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
    </div>
  );
}

/**
 * Минимальный рендерер Markdown под формат генерируемых документов:
 * заголовки `#`/`##`, пустые строки и обычные абзацы.
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
    <div className="flex flex-col gap-3">
      {lines.map((line, index) => {
        const isLast = index === lines.length - 1;
        const caret = showCaret && isLast && (
          <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-violet-600 align-middle" />
        );

        if (line.startsWith("## ")) {
          return (
            <h3
              key={index}
              className="mt-3 text-sm font-semibold uppercase tracking-wide text-stone-900"
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
              className="text-center text-base font-semibold tracking-tight text-stone-900"
            >
              {line.slice(2)}
              {caret}
            </h2>
          );
        }

        if (!line.trim()) {
          return <div key={index} className="h-0">{caret}</div>;
        }

        return (
          <p key={index} className="text-sm leading-relaxed text-stone-700">
            {line}
            {caret}
          </p>
        );
      })}
    </div>
  );
}
