"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sidebar } from "@/components/layout/Sidebar";
import { AIAssistantSheet } from "@/components/workspace/AIAssistantSheet";
import { BatchGenerationGrid } from "@/components/workspace/BatchGenerationGrid";
import { CaseDocumentsTab } from "@/components/workspace/CaseDocumentsTab";
import { CaseOverviewTab } from "@/components/workspace/CaseOverviewTab";
import { ExtractionSheet } from "@/components/workspace/ExtractionSheet";
import { GenerationSheet } from "@/components/workspace/GenerationSheet";
import { useHotkey } from "@/lib/hooks/use-hotkey";
import { cn } from "@/lib/utils";
import { useAppStore, type CaseTab } from "@/store/useAppStore";
import { CASE_STATUS_META, type Case } from "@/types";

const TABS: { value: CaseTab; label: string }[] = [
  { value: "overview", label: "Обзор" },
  { value: "documents", label: "Документы" },
  { value: "entities", label: "Объекты и генерация" },
];

/** Запасное дело — если по id ничего не нашлось. */
const FALLBACK_CASE: Case = {
  id: "case-1",
  title: "Оценка и межевание земельного участка (440 кв.м., г. Владикавказ)",
  status: "in_progress",
  tags: ["Недвижимость", "Межевание"],
  createdAt: "2026-07-28T09:00:00.000Z",
  description:
    "Подготовка пакета документов для постановки участка на кадастровый учёт.",
  contextFile: "Выписка_ЕГРН_440квм.pdf",
};

export default function CaseWorkspacePage() {
  const params = useParams<{ id: string }>();
  const caseId = params.id;

  const cases = useAppStore((state) => state.cases);
  const allEntities = useAppStore((state) => state.entities);
  const allDocuments = useAppStore((state) => state.documents);
  const activeTab = useAppStore((state) => state.activeTab);
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const toggleAssistant = useAppStore((state) => state.toggleAssistant);

  const storedCase = useMemo(
    () => cases.find((item) => item.id === caseId),
    [cases, caseId]
  );
  const entityCount = useMemo(
    () => allEntities.filter((entity) => entity.caseId === caseId).length,
    [allEntities, caseId]
  );
  const documentCount = useMemo(
    () => allDocuments.filter((document) => document.caseId === caseId).length,
    [allDocuments, caseId]
  );

  const caseItem = storedCase ?? FALLBACK_CASE;
  const statusMeta = CASE_STATUS_META[caseItem.status];

  const handleToggleAssistant = useCallback(() => {
    toggleAssistant();
  }, [toggleAssistant]);

  useHotkey({ key: "j", meta: true }, handleToggleAssistant);

  const tabCounts: Record<CaseTab, number | null> = {
    overview: null,
    documents: documentCount,
    entities: entityCount,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar />

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Шапка дела */}
        <header className="shrink-0 border-b border-line bg-surface px-8 pb-4 pt-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex min-w-0 flex-col">
              {/* Статус в виде метки — как рубрики на лендинге */}
              <div className="flex flex-wrap items-center gap-2.5">
                <Link
                  href="/dashboard"
                  className="group inline-flex items-center gap-1 font-mono text-label uppercase text-fg-faint transition-colors hover:text-fg"
                >
                  <ChevronRight className="h-3 w-3 rotate-180 transition-transform duration-300 group-hover:-translate-x-0.5" />
                  Все дела
                </Link>

                <span aria-hidden className="h-3 w-px bg-surface-3" />

                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-full border px-2.5 py-1 font-mono text-label uppercase ",
                    statusMeta.badgeClassName
                  )}
                >
                  <span
                    className={cn(
                      "h-1 w-1 rounded-full",
                      statusMeta.dotClassName
                    )}
                  />
                  {statusMeta.label}
                </span>
              </div>

              <h1 className="mt-3.5 max-w-3xl text-title font-medium leading-[1.15] text-fg sm:text-heading">
                {caseItem.title}
              </h1>

              {/* Метаданные дела моноширинной строкой */}
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5">
                {caseItem.tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-mono text-label uppercase text-fg-faint"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <Button onClick={handleToggleAssistant} className="h-10 shrink-0 gap-2 rounded-full px-5">
              <Sparkles className="h-4 w-4" />
              Ассистент
              <kbd className="ml-0.5 rounded-lg border border-inverse-fg/20 bg-inverse-fg/10 px-1.5 py-0.5 font-mono text-label text-inverse-fg/70">
                ⌘J
              </kbd>
            </Button>
          </div>

          {/* Вкладки */}
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as CaseTab)}
            className="mt-4"
          >
            {/*
              Вкладки-капсулы — те же, что на лендинге. Подчёркивание заменено
              заливкой не ради единообразия: у вкладки со счётчиком линия снизу
              подчёркивала и счётчик тоже, отчего он читался как часть названия.
              Заливка обводит вкладку целиком и такой двусмысленности не даёт.
            */}
            <TabsList className="h-auto w-max gap-1 rounded-full border border-line bg-bg p-1">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.value;
                const count = tabCounts[tab.value];

                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="relative h-8 gap-2 rounded-full bg-transparent px-4 text-body font-normal text-fg-subtle shadow-none transition-colors hover:text-fg data-[state=active]:bg-transparent data-[state=active]:text-inverse-fg data-[state=active]:shadow-none"
                  >
                    {/* Капсула переезжает между вкладками */}
                    {isActive && (
                      <motion.span
                        layoutId="case-tab-pill"
                        data-underline
                        className="absolute inset-0 rounded-full bg-inverse"
                        transition={{
                          duration: 0.28,
                          ease: [0.22, 0.61, 0.36, 1],
                        }}
                      />
                    )}

                    <span className="relative">{tab.label}</span>
                    {count !== null && (
                      <span
                        className={cn(
                          "relative font-mono text-label tabular-nums transition-colors",
                          isActive ? "text-inverse-fg/60" : "text-fg-ghost"
                        )}
                      >
                        {count}
                      </span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </header>

        {/* Контент вкладки: скроллится только он, body остаётся фиксированным */}
        {/*
          Вкладка появляется мягко, но без AnimatePresence с ожиданием ухода:
          если анимация не проигрывается (фоновая вкладка браузера, троттлинг
          кадров), контент не должен зависать между состояниями.
        */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
          className={cn(
            "min-h-0 flex-1 px-8 py-6",
            activeTab === "entities"
              ? "flex flex-col"
              : "scrollable-area overflow-auto"
          )}
        >
          {activeTab === "overview" && <CaseOverviewTab caseItem={caseItem} />}
          {activeTab === "documents" && <CaseDocumentsTab caseId={caseId} />}
          {activeTab === "entities" && <BatchGenerationGrid caseId={caseId} />}
        </motion.div>
      </main>

      <AIAssistantSheet caseId={caseId} contextFile={caseItem.contextFile} />
      <GenerationSheet caseId={caseId} />
      {/* Разбор файла запущен внутри дела — реквизиты идут в это же дело */}
      <ExtractionSheet caseId={caseId} />
    </div>
  );
}
