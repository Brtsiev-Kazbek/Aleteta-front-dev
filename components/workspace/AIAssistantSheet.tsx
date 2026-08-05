"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  ArrowUp,
  FileText,
  Info,
  Sparkles,
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
import { SUGGESTED_PROMPTS } from "@/data/mock-data";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { RISK_LEVEL_META, type RiskFinding, type RiskLevel } from "@/types";

const RISK_ICONS: Record<RiskLevel, LucideIcon> = {
  critical: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

interface AIAssistantSheetProps {
  caseId: string;
  contextFile: string;
}

export function AIAssistantSheet({ caseId, contextFile }: AIAssistantSheetProps) {
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
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <SheetTitle>Алетейя AI</SheetTitle>
          </div>

          <SheetDescription asChild>
            <div className="pl-[42px]">
              <span className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-600">
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Контекст: {contextFile}</span>
              </span>
            </div>
          </SheetDescription>
        </SheetHeader>

        {/* Лента сообщений */}
        <ScrollArea className="flex-1 px-5 py-4">
          <div className="flex flex-col gap-4">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className={cn(
                    "flex items-start gap-2.5",
                    message.role === "user" && "flex-row-reverse"
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500">
                      <Sparkles className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}

                  <div
                    className={cn(
                      "flex min-w-0 flex-col gap-2",
                      message.role === "user" ? "max-w-[85%]" : "max-w-[88%]"
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                        message.role === "assistant"
                          ? "rounded-tl-sm bg-zinc-100 text-zinc-900"
                          : "rounded-tr-sm bg-indigo-600 text-white"
                      )}
                    >
                      {message.text}
                    </div>

                    {/* UI-карточки находок вместо простого текста */}
                    {message.findings?.map((finding, index) => (
                      <FindingCard
                        key={finding.id}
                        finding={finding}
                        delay={index * 0.08}
                      />
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isThinking && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2.5"
              >
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500">
                  <Sparkles className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-zinc-100 px-4 py-3.5">
                  {[0, 1, 2].map((dot) => (
                    <motion.span
                      key={dot}
                      className="h-1.5 w-1.5 rounded-full bg-zinc-400"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{
                        duration: 1.1,
                        repeat: Infinity,
                        delay: dot * 0.18,
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {/* Умный инпут */}
        <div className="flex flex-col gap-2.5 border-t border-zinc-200 px-5 py-4">
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleSend(prompt)}
                disabled={isThinking}
                className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-600 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50"
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
              className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-4 pr-12 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
            <button
              type="button"
              onClick={() => handleSend(draft)}
              disabled={!draft.trim() || isThinking}
              className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-indigo-600 text-white transition-colors hover:bg-indigo-700 disabled:bg-zinc-200 disabled:text-zinc-400"
              aria-label="Отправить сообщение"
            >
              <ArrowUp className="h-4 w-4" />
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
      transition={{ duration: 0.24, delay }}
      className={cn("rounded-xl border p-3.5", meta.cardClassName)}
    >
      <div className="flex items-start gap-2.5">
        <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", meta.iconClassName)} />
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                meta.badgeClassName
              )}
            >
              {meta.label}
            </span>
            <span className="text-xs text-zinc-500">{finding.clause}</span>
          </div>

          <p className="text-sm font-medium text-zinc-900">{finding.title}</p>
          <p className="text-sm leading-relaxed text-zinc-600">
            {finding.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
