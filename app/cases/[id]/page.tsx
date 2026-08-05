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
    <div className="flex h-screen overflow-hidden bg-zinc-50">
      <Sidebar />

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Шапка дела */}
        <header className="shrink-0 border-b border-zinc-200 bg-white px-8 pt-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-1.5">
              <nav className="flex items-center gap-1 text-xs text-zinc-400">
                <Link
                  href="/dashboard"
                  className="transition-colors hover:text-zinc-600"
                >
                  Дела
                </Link>
                <ChevronRight className="h-3 w-3" />
                <span className="text-zinc-500">Рабочее пространство</span>
              </nav>

              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-lg font-semibold tracking-tight text-zinc-900">
                  {caseItem.title}
                </h1>
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
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
              </div>
            </div>

            <Button
              onClick={handleToggleAssistant}
              className="shrink-0 gap-2 bg-slate-900 text-white shadow-sm hover:bg-slate-800"
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
                    className="relative gap-2 rounded-none border-b-2 border-transparent bg-transparent px-0 pb-3 pt-0 text-sm font-medium text-zinc-500 shadow-none transition-colors hover:text-zinc-900 data-[state=active]:border-indigo-600 data-[state=active]:bg-transparent data-[state=active]:text-zinc-900 data-[state=active]:shadow-none"
                  >
                    {tab.label}
                    {count !== null && (
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors",
                          isActive
                            ? "bg-indigo-50 text-indigo-700"
                            : "bg-zinc-100 text-zinc-500"
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
