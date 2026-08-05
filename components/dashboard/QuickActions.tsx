"use client";

import { useState } from "react";
import { motion } from "framer-motion";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AIGenerator } from "@/components/documents/AIGenerator";
import { AIReviewDropzone } from "@/components/documents/AIReviewDropzone";
import { ReviewSplitView } from "@/components/documents/ReviewSplitView";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

interface ActionCard {
  id: "generate" | "review" | "create";
  emoji: string;
  title: string;
  description: string;
  accentClassName: string;
}

const ACTIONS: ActionCard[] = [
  {
    id: "generate",
    emoji: "📄",
    title: "Сгенерировать документ",
    description:
      "Опишите задачу словами — Алетейя составит готовый документ со структурой и формулировками.",
    accentClassName: "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100",
  },
  {
    id: "review",
    emoji: "🔍",
    title: "Проверить документ (AI Review)",
    description:
      "Загрузите договор — получите разбор по пунктам, список рисков и исправленную версию.",
    accentClassName: "bg-amber-50 text-amber-600 group-hover:bg-amber-100",
  },
  {
    id: "create",
    emoji: "📁",
    title: "Создать новое дело",
    description:
      "Структурированное рабочее пространство с файлами, сущностями и массовой генерацией.",
    accentClassName: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100",
  },
];

type ReviewedFile = { name: string; sizeBytes: number };

export function QuickActions() {
  // Диалог создания дела общий для всего приложения — он живёт рядом
  // с сайдбаром, поэтому здесь только поднимаем флаг в сторе.
  const setCreateCaseOpen = useAppStore((state) => state.setCreateCaseOpen);

  const [isGeneratorOpen, setGeneratorOpen] = useState(false);
  const [isReviewOpen, setReviewOpen] = useState(false);
  const [reviewedFile, setReviewedFile] = useState<ReviewedFile | null>(null);

  function handleAction(id: ActionCard["id"]) {
    if (id === "generate") setGeneratorOpen(true);
    if (id === "review") {
      setReviewedFile(null);
      setReviewOpen(true);
    }
    if (id === "create") setCreateCaseOpen(true);
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ACTIONS.map((action, index) => (
          <motion.button
            key={action.id}
            type="button"
            onClick={() => handleAction(action.id)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.07 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.99 }}
            className="group flex flex-col items-start rounded-xl border border-zinc-200 bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
          >
            <div
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-xl text-xl transition-colors",
                action.accentClassName
              )}
            >
              <span aria-hidden>{action.emoji}</span>
            </div>

            <h3 className="mt-4 text-sm font-semibold text-zinc-900">
              {action.title}
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">
              {action.description}
            </p>
          </motion.button>
        ))}
      </div>

      {/* Шторка: свободная генерация документа */}
      <Sheet open={isGeneratorOpen} onOpenChange={setGeneratorOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 p-0 sm:max-w-3xl"
        >
          <SheetHeader className="shrink-0">
            <SheetTitle>Генерация документа</SheetTitle>
            <SheetDescription>
              Свободный запрос к Алетейе — без шаблонов и форм.
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-hidden bg-zinc-50">
            <AIGenerator onClose={() => setGeneratorOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Диалог: проверка документа. Split-View требует ширины, поэтому Dialog. */}
      <Dialog open={isReviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent
          className={cn(
            "gap-0 overflow-hidden p-0",
            reviewedFile
              ? "h-[88vh] max-w-6xl"
              : "max-w-2xl"
          )}
          hideClose={Boolean(reviewedFile)}
        >
          {reviewedFile ? (
            <>
              <DialogTitle className="sr-only">
                Результат проверки документа
              </DialogTitle>
              <DialogDescription className="sr-only">
                Слева оригинал документа, справа найденные риски.
              </DialogDescription>
              <ReviewSplitView
                file={reviewedFile}
                onReset={() => setReviewedFile(null)}
                onClose={() => setReviewOpen(false)}
              />
            </>
          ) : (
            <div className="flex flex-col gap-5 p-6">
              <DialogHeader>
                <DialogTitle>Проверить документ</DialogTitle>
                <DialogDescription>
                  Алетейя разберёт договор по пунктам и найдёт риски.
                </DialogDescription>
              </DialogHeader>

              <AIReviewDropzone onAnalyzed={setReviewedFile} />
            </div>
          )}
        </DialogContent>
      </Dialog>

    </>
  );
}
