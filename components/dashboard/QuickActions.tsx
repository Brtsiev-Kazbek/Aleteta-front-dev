"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, FolderPlus, ShieldCheck, Wand2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

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
  icon: LucideIcon;
  label: string;
  title: string;
  description: string;
  iconClassName: string;
}

const ACTIONS: ActionCard[] = [
  {
    id: "generate",
    icon: Wand2,
    label: "Генерация",
    title: "Составить документ",
    description:
      "Опишите задачу словами. Если шаблона нет — Алетейя составит документ с нуля.",
    iconClassName: "bg-violet-50 text-violet-600 group-hover:bg-violet-100",
  },
  {
    id: "review",
    icon: ShieldCheck,
    label: "Проверка",
    title: "Разобрать договор",
    description:
      "Загрузите файл — получите риски по пунктам, судебную практику и исправленную редакцию.",
    iconClassName: "bg-amber-50 text-amber-600 group-hover:bg-amber-100",
  },
  {
    id: "create",
    icon: FolderPlus,
    label: "Дело",
    title: "Завести новое дело",
    description:
      "Рабочее пространство с файлами, объектами и массовой генерацией пакета.",
    iconClassName: "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100",
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
            whileHover={{ y: -4 }}
            className="group flex flex-col items-start rounded-2xl border border-stone-200 bg-white p-6 text-left transition-shadow duration-300 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"
          >
            <div className="flex w-full items-start justify-between">
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-xl transition-colors",
                  action.iconClassName
                )}
              >
                <action.icon className="h-5 w-5" />
              </div>

              <ArrowRight className="h-4 w-4 shrink-0 text-stone-300 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-stone-900" />
            </div>

            <span className="mt-5 font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400">
              {action.label}
            </span>

            <h3 className="mt-1.5 text-base font-medium tracking-[-0.01em] text-stone-900">
              {action.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-500">
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

          <div className="min-h-0 flex-1 overflow-hidden bg-stone-50">
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
