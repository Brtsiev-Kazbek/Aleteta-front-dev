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
import { GenerationSheet } from "@/components/workspace/GenerationSheet";
import { useHotkey } from "@/lib/hooks/use-hotkey";
import { cn } from "@/lib/utils";
import { useAppStore, type CaseTab } from "@/store/useAppStore";
import { CASE_STATUS_META, type Case } from "@/types";

const TABS: { value: CaseTab; label: string }[] = [
  { value: "overview", label: "Обзор" },
  { value: "documents", label: "Документы" },
  { value: "entities", label: "Сущности и Генерация" },
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
    <div className="flex h-screen overflow-hidden bg-stone-50">
      <Sidebar />

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Шапка дела */}
        <header className="shrink-0 border-b border-stone-200 bg-white px-8 pt-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex min-w-0 flex-col">
              {/* Статус в виде метки — как рубрики на лендинге */}
              <div className="flex flex-wrap items-center gap-2.5">
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium tracking-wide",
                    statusMeta.badgeClassName
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      statusMeta.dotClassName
                    )}
                  />
                  {statusMeta.label}
                </span>

                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400 transition-colors hover:text-stone-700"
                >
                  <ChevronRight className="h-3 w-3 rotate-180" />
                  Все дела
                </Link>
              </div>

              <h1 className="mt-3.5 max-w-3xl text-xl font-medium leading-[1.2] tracking-[-0.025em] text-stone-900 sm:text-[1.6rem]">
                {caseItem.title}
              </h1>

              {/* Метаданные дела моноширинной строкой */}
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5">
                {caseItem.tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-mono text-[10px] uppercase tracking-[0.12em] text-stone-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <Button
              onClick={handleToggleAssistant}
              className="shrink-0 gap-2 bg-stone-950 text-white shadow-sm hover:bg-stone-900"
            >
              <Sparkles className="h-4 w-4" />
              AI Ассистент
              <kbd className="ml-0.5 rounded border border-white/20 bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-white/70">
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
            <TabsList className="h-auto gap-6 rounded-none border-0 bg-transparent p-0">
              {TABS.map((tab) => {
                const isActive = activeTab === tab.value;
                const count = tabCounts[tab.value];

                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="relative gap-2 rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 pt-0 text-sm font-medium text-stone-500 shadow-none transition-colors hover:text-stone-900 data-[state=active]:border-violet-600 data-[state=active]:bg-transparent data-[state=active]:text-stone-900 data-[state=active]:shadow-none"
                  >
                    {tab.label}
                    {count !== null && (
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors",
                          isActive
                            ? "bg-violet-50 text-violet-700"
                            : "bg-stone-100 text-stone-500"
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
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
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
    </div>
  );
}
