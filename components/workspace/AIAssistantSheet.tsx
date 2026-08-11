"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  ArrowUp,
  FileText,
  Info,
  Quote,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { MetaLabel } from "@/components/layout/PanelHeading";
import { SUGGESTED_PROMPTS } from "@/data/mock-data";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import {
  RISK_LEVEL_META,
  type Citation,
  type RiskFinding,
  type RiskLevel,
} from "@/types";

const RISK_ICONS: Record<RiskLevel, LucideIcon> = {
  critical: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

interface AIAssistantSheetProps {
  caseId: string;
  contextFile: string;
}

export function AIAssistantSheet({
  caseId,
  contextFile,
}: AIAssistantSheetProps) {
  const isOpen = useAppStore((state) => state.isAssistantOpen);
  const toggleAssistant = useAppStore((state) => state.toggleAssistant);
  const messages = useAppStore((state) => state.chatMessages);
  const isThinking = useAppStore((state) => state.isAssistantThinking);
  const sendChatMessage = useAppStore((state) => state.sendChatMessage);

  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isThinking]);

  function handleSend(text: string) {
    if (!text.trim() || isThinking) return;
    sendChatMessage(text, caseId);
    setDraft("");
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => toggleAssistant(open)}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader>
          <MetaLabel>Ассистент по делу</MetaLabel>
          <SheetTitle>Алетейя</SheetTitle>
          <SheetDescription asChild>
            <div className="flex items-center gap-1.5 text-fg-subtle">
              <FileText className="h-3 w-3 shrink-0 text-fg-ghost" />
              <span className="truncate">Контекст: {contextFile}</span>
            </div>
          </SheetDescription>
        </SheetHeader>

        {/* Лента сообщений */}
        <ScrollArea className="min-h-0 flex-1 px-5 py-5">
          <div className="flex flex-col gap-4">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.26, ease: [0.22, 0.61, 0.36, 1] }}
                  className={cn(
                    "flex flex-col gap-2",
                    message.role === "user" ? "items-end" : "items-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[88%] rounded-lg px-3.5 py-2.5 text-[13px] leading-relaxed",
                      message.role === "assistant"
                        ? "border border-line bg-surface text-fg"
                        : "bg-stone-950 text-white"
                    )}
                  >
                    {message.text}
                  </div>

                  {/* Находки — карточками, а не сплошным текстом */}
                  {message.findings?.map((finding, index) => (
                    <FindingCard
                      key={finding.id}
                      finding={finding}
                      delay={index * 0.08}
                    />
                  ))}

                  {/* Источники: пункт и страница конкретного файла дела */}
                  {message.citations && message.citations.length > 0 && (
                    <div className="w-full">
                      <MetaLabel>Источники</MetaLabel>
                      <div className="mt-2 flex flex-col gap-1.5">
                        {message.citations.map((citation, index) => (
                          <CitationCard
                            key={citation.id}
                            citation={citation}
                            delay={index * 0.08}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {isThinking && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-1 self-start rounded-lg border border-line bg-surface px-4 py-3"
              >
                {[0, 1, 2].map((dot) => (
                  <motion.span
                    key={dot}
                    className="h-1 w-1 rounded-full bg-stone-400"
                    animate={{ opacity: [0.25, 1, 0.25] }}
                    transition={{
                      duration: 1.1,
                      repeat: Infinity,
                      delay: dot * 0.18,
                    }}
                  />
                ))}
              </motion.div>
            )}

            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {/* Ввод */}
        <div className="flex shrink-0 flex-col gap-2.5 border-t border-line px-5 py-4">
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleSend(prompt)}
                disabled={isThinking}
                className="rounded border border-line px-2.5 py-1.5 text-xs text-fg-soft transition-colors hover:border-stone-900 hover:text-fg disabled:opacity-40"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="relative">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSend(draft);
                }
              }}
              placeholder="Спросите Алетейю о деле…"
              className="h-10 w-full rounded-md border border-line bg-surface pl-3.5 pr-11 text-[13px] text-fg outline-none transition-colors placeholder:text-fg-faint focus:border-stone-900"
            />
            <button
              type="button"
              onClick={() => handleSend(draft)}
              disabled={!draft.trim() || isThinking}
              className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded bg-stone-950 text-white transition-colors hover:bg-stone-800 disabled:bg-surface-2 disabled:text-fg-faint"
              aria-label="Отправить сообщение"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Карточка находки — ассистент отдаёт её вместо простого текста. */
function FindingCard({
  finding,
  delay,
}: {
  finding: RiskFinding;
  delay: number;
}) {
  const meta = RISK_LEVEL_META[finding.level];
  const Icon = RISK_ICONS[finding.level];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, delay }}
      className={cn("w-full rounded border p-3.5", meta.cardClassName)}
    >
      <div className="flex items-start gap-2.5">
        <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", meta.iconClassName)} />

        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em]",
                meta.badgeClassName
              )}
            >
              {meta.label}
            </span>
            <span className="font-mono text-[10px] text-fg-faint">
              {finding.clause}
            </span>
          </div>

          <p className="text-[13px] font-medium text-fg">
            {finding.title}
          </p>
          <p className="text-[13px] leading-relaxed text-fg-soft">
            {finding.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Источник ответа. Без него ассистент неотличим от угадывания: видно, из
 * какого файла, пункта и страницы взята формулировка.
 */
function CitationCard({
  citation,
  delay,
}: {
  citation: Citation;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.26, delay }}
      className="rounded border border-line bg-surface p-3 transition-colors hover:border-line-strong"
    >
      <div className="flex flex-wrap items-center gap-2">
        <FileText className="h-3 w-3 shrink-0 text-fg-ghost" />
        <span className="min-w-0 truncate text-[11px] font-medium text-stone-800">
          {citation.document}
        </span>
        <span className="ml-auto shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] text-fg-faint">
          {citation.clause} · стр. {citation.page}
        </span>
      </div>

      <div className="mt-2 flex gap-2 border-l border-line pl-2.5">
        <Quote className="mt-0.5 h-2.5 w-2.5 shrink-0 text-fg-ghost" />
        <p className="text-[11px] leading-relaxed text-fg-soft">
          {citation.quote}
        </p>
      </div>
    </motion.div>
  );
}
