"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

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
import { FileDropzone } from "@/components/documents/FileDropzone";
import { ReviewSplitView } from "@/components/documents/ReviewSplitView";
import { CasePickerDialog } from "@/components/dashboard/CasePickerDialog";
import { MetaLabel } from "@/components/layout/PanelHeading";
import { DemoExtractionSheet } from "@/components/dashboard/DemoExtractionSheet";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

type CapabilityId =
  | "matrix"
  | "freeform"
  | "extract"
  | "custom"
  | "bulk"
  | "review"
  | "caselaw"
  | "batch-review"
  | "assistant";

interface Capability {
  id: CapabilityId;
  title: string;
  note: string;
  /** Подпись действия — она же объясняет, что произойдёт по нажатию. */
  action: string;
}

interface CapabilityGroup {
  title: string;
  items: Capability[];
}

/**
 * Те же девять инструментов, что показаны на лендинге, — и каждый отсюда
 * запускается по-настоящему, а не открывает описание.
 */
const GROUPS: CapabilityGroup[] = [
  {
    title: "Подготовка и выпуск документов",
    items: [
      {
        id: "matrix",
        title: "Матрица генерации",
        note: "Объекты дела в таблице, реквизиты проверяются до генерации",
        action: "Выбрать дело",
      },
      {
        id: "freeform",
        title: "Любой документ",
        note: "Опишите словами — форма подберётся или документ напишется с нуля",
        action: "Описать документ",
      },
      {
        id: "extract",
        title: "Разбор документов",
        note: "Реквизиты из PDF, DOCX и сканов переносятся в карточку объекта",
        action: "Загрузить файл",
      },
      {
        id: "custom",
        title: "Свои типы объектов",
        note: "Общий тип с произвольными реквизитами — доступен во всех делах",
        action: "Создать тип",
      },
      {
        id: "bulk",
        title: "Работа по нескольким делам",
        note: "Один запрос — документ в каждом отмеченном деле",
        action: "Отметить дела",
      },
    ],
  },
  {
    title: "Анализ, проверка и правовая позиция",
    items: [
      {
        id: "review",
        title: "Разбор договора",
        note: "Замечания по пунктам с готовыми формулировками правок",
        action: "Загрузить договор",
      },
      {
        id: "caselaw",
        title: "Судебная практика по пункту",
        note: "Позиции судов по спорному условию с номерами дел",
        action: "Посмотреть практику",
      },
      {
        id: "batch-review",
        title: "Проверка пачкой",
        note: "Несколько документов за один раз, опасное — наверх",
        action: "Выбрать дело",
      },
      {
        id: "assistant",
        title: "Ассистент по делу",
        note: "Ответы по материалам со ссылкой на пункт и страницу",
        action: "Выбрать дело",
      },
    ],
  },
];

/** Договор, на котором показывается разбор без своей загрузки. */
const DEMO_CONTRACT = {
  name: "Договор_купли-продажи_участка.pdf",
  sizeBytes: 1_258_291,
};

/** Действия, которым нужно конкретное дело. */
type CaseAction = "matrix" | "batch-review" | "assistant";

const CASE_PICKER_COPY: Record<
  CaseAction,
  { eyebrow: string; title: string; description: string }
> = {
  matrix: {
    eyebrow: "Матрица генерации",
    title: "В каком деле открыть матрицу?",
    description:
      "Откроется таблица объектов этого дела с проверкой реквизитов перед генерацией.",
  },
  "batch-review": {
    eyebrow: "Проверка пачкой",
    title: "Документы какого дела проверить?",
    description:
      "Все файлы выбранного дела будут проверены за один раз, документы с критическими замечаниями поднимутся наверх.",
  },
  assistant: {
    eyebrow: "Ассистент по делу",
    title: "О каком деле спросить?",
    description:
      "Ассистент видит файлы, реквизиты и историю правок выбранного дела.",
  },
};

export function CapabilityGrid() {
  const router = useRouter();

  const cases = useAppStore((state) => state.cases);
  const documents = useAppStore((state) => state.documents);
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const toggleAssistant = useAppStore((state) => state.toggleAssistant);
  const setCustomSchemaOpen = useAppStore((state) => state.setCustomSchemaOpen);
  const toggleAllCases = useAppStore((state) => state.toggleAllCases);
  const setBulkSheetOpen = useAppStore((state) => state.setBulkSheetOpen);
  const selectDocuments = useAppStore((state) => state.selectDocuments);
  const startBatchReview = useAppStore((state) => state.startBatchReview);
  const startDemoExtraction = useAppStore((state) => state.startDemoExtraction);

  const [isGeneratorOpen, setGeneratorOpen] = useState(false);
  const [isExtractPickerOpen, setExtractPickerOpen] = useState(false);
  const [isReviewOpen, setReviewOpen] = useState(false);
  const [caseAction, setCaseAction] = useState<CaseAction | null>(null);
  const [reviewedFile, setReviewedFile] = useState<{
    name: string;
    sizeBytes: number;
  } | null>(null);
  /** Замечание, раскрытое сразу — для входа «судебная практика». */
  const [initialRiskId, setInitialRiskId] = useState<string | undefined>();

  function handle(id: CapabilityId) {
    switch (id) {
      case "matrix":
      case "batch-review":
      case "assistant":
        setCaseAction(id);
        return;

      case "freeform":
        setGeneratorOpen(true);
        return;

      case "extract":
        setExtractPickerOpen(true);
        return;

      case "custom":
        // С рабочего стола создаётся общий тип — без привязки к делу.
        setCustomSchemaOpen(true);
        return;

      case "bulk":
        // Отмечаем все дела и сразу открываем шторку общего документа.
        toggleAllCases(cases.map((item) => item.id));
        setBulkSheetOpen(true);
        return;

      case "review":
        setInitialRiskId(undefined);
        setReviewedFile(null);
        setReviewOpen(true);
        return;

      case "caselaw":
        // Практика живёт внутри замечания — открываем разбор сразу на нём.
        setInitialRiskId("risk-1");
        setReviewedFile(DEMO_CONTRACT);
        setReviewOpen(true);
        return;
    }
  }

  function handleCasePick(caseId: string) {
    const action = caseAction;
    setCaseAction(null);
    if (!action) return;

    if (action === "matrix") {
      setActiveTab("entities");
    }

    if (action === "assistant") {
      toggleAssistant(true);
    }

    if (action === "batch-review") {
      const caseDocuments = documents.filter((item) => item.caseId === caseId);
      selectDocuments(caseDocuments.map((item) => item.id));
      setActiveTab("documents");
      if (caseDocuments.length > 0) startBatchReview(caseId);
    }

    router.push(`/cases/${caseId}`);
  }

  return (
    <>
      <div className="flex flex-col gap-10">
        {GROUPS.map((group, groupIndex) => {
          // Сквозная нумерация по обеим группам — как перечень на лендинге.
          const offset = GROUPS.slice(0, groupIndex).reduce(
            (sum, item) => sum + item.items.length,
            0
          );

          return (
            <section key={group.title}>
              <div className="flex items-baseline justify-between gap-3">
                <MetaLabel>{group.title}</MetaLabel>
                <span className="font-mono text-[10px] tabular-nums text-stone-300">
                  {group.items.length}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-px border border-stone-200 bg-stone-200 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((item, index) => (
                  <motion.button
                    key={item.id}
                    type="button"
                    onClick={() => handle(item.id)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: (offset + index) * 0.04,
                      ease: [0.22, 0.61, 0.36, 1],
                    }}
                    className={cn(
                      "group relative flex flex-col items-start overflow-hidden bg-white p-5 text-left",
                      "transition-colors duration-300 hover:bg-stone-50",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-stone-400"
                    )}
                  >
                    {/* Волосяная линия сверху — появляется при наведении */}
                    <span
                      aria-hidden
                      className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-violet-500 transition-transform duration-300 ease-out group-hover:scale-x-100"
                    />

                    <div className="flex w-full items-baseline gap-2.5">
                      <span className="font-mono text-[10px] tabular-nums text-stone-300 transition-colors duration-300 group-hover:text-violet-600">
                        {String(offset + index + 1).padStart(2, "0")}
                      </span>
                      <span className="text-[15px] font-medium tracking-[-0.015em] text-stone-900">
                        {item.title}
                      </span>
                      <ArrowUpRight className="ml-auto h-3.5 w-3.5 shrink-0 text-stone-300 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-stone-900" />
                    </div>

                    <p className="mt-2.5 text-[13px] leading-relaxed text-stone-500">
                      {item.note}
                    </p>

                    <span className="relative mt-5 font-mono text-[10px] uppercase tracking-[0.12em] text-stone-400 transition-colors duration-300 group-hover:text-stone-900">
                      {item.action}
                      <span
                        aria-hidden
                        className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-stone-900 transition-transform duration-300 ease-out group-hover:scale-x-100"
                      />
                    </span>
                  </motion.button>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Выбор дела для действий, которым нужно конкретное дело */}
      <CasePickerDialog
        open={caseAction !== null}
        onOpenChange={(open) => {
          if (!open) setCaseAction(null);
        }}
        eyebrow={caseAction ? CASE_PICKER_COPY[caseAction].eyebrow : ""}
        title={caseAction ? CASE_PICKER_COPY[caseAction].title : ""}
        description={caseAction ? CASE_PICKER_COPY[caseAction].description : ""}
        onPick={handleCasePick}
      />

      {/* Свободный запрос — документ без готового шаблона */}
      <Sheet open={isGeneratorOpen} onOpenChange={setGeneratorOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 p-0 sm:max-w-3xl"
        >
          <SheetHeader>
            <MetaLabel>Любой документ</MetaLabel>
            <SheetTitle>Опишите нужный документ</SheetTitle>
            <SheetDescription>
              Если подходящая форма есть — реквизиты подставятся в неё. Если
              нет — документ будет составлен с нуля.
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-hidden bg-stone-50">
            <AIGenerator onClose={() => setGeneratorOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Разбор файла: выбор документа, из которого достаются реквизиты */}
      <Dialog open={isExtractPickerOpen} onOpenChange={setExtractPickerOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <MetaLabel>Разбор документов</MetaLabel>
            <DialogTitle className="mt-1">
              Перенести реквизиты из файла
            </DialogTitle>
            <DialogDescription>
              Устав, паспорт, выписка или счёт. Значения попадут в карточку
              объекта с проверкой формата каждого реквизита.
            </DialogDescription>
          </DialogHeader>

          <FileDropzone
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.tif,.tiff"
            hint="PDF, DOCX и сканы с распознаванием текста"
            demoFile={{
              name: "Выписка_ЕГРН_718квм.pdf",
              sizeBytes: 1_246_000,
            }}
            demoLabel="Или разберите демонстрационную выписку"
            onPick={(file) => {
              setExtractPickerOpen(false);
              startDemoExtraction(file);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Разбор договора по пунктам и судебная практика */}
      <Dialog open={isReviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent
          className={cn(
            "gap-0 overflow-hidden p-0",
            reviewedFile ? "h-[88vh] max-w-6xl" : "max-w-lg"
          )}
          hideClose={Boolean(reviewedFile)}
        >
          {reviewedFile ? (
            <>
              <DialogTitle className="sr-only">
                Результат проверки документа
              </DialogTitle>
              <DialogDescription className="sr-only">
                Слева оригинал документа, справа найденные замечания.
              </DialogDescription>
              <ReviewSplitView
                file={reviewedFile}
                initialRiskId={initialRiskId}
                onReset={() => setReviewedFile(null)}
                onClose={() => setReviewOpen(false)}
              />
            </>
          ) : (
            <div className="flex flex-col gap-5 p-6">
              <DialogHeader>
                <MetaLabel>Разбор договора</MetaLabel>
                <DialogTitle className="mt-1">Проверить документ</DialogTitle>
                <DialogDescription>
                  Алетейя разберёт договор по пунктам, приложит формулировки
                  правок и подберёт практику по спорным условиям.
                </DialogDescription>
              </DialogHeader>

              <AIReviewDropzone onAnalyzed={setReviewedFile} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/*
        Диалог общего типа живёт в списке типов ниже по странице — там же
        сразу виден результат создания, поэтому здесь он не дублируется.
      */}

      {/* Показ разбора: настоящий запускается из дела, где есть загруженный файл */}
      <DemoExtractionSheet />
    </>
  );
}
