"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  FileText,
  MoreHorizontal,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createDocumentUrlAction } from "@/app/actions/documents";
import { ReviewSplitView } from "@/components/documents/ReviewSplitView";
import { MetaLabel } from "@/components/layout/PanelHeading";
import { BatchReviewSheet } from "@/components/workspace/BatchReviewSheet";
import { cn, formatDate, plural } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { DOCUMENT_STATUS_META } from "@/types";

export function CaseDocumentsTab({ caseId }: { caseId: string }) {
  const allDocuments = useAppStore((state) => state.documents);
  const documents = useMemo(
    () => allDocuments.filter((document) => document.caseId === caseId),
    [allDocuments, caseId]
  );

  const toggleAssistant = useAppStore((state) => state.toggleAssistant);
  const addDocuments = useAppStore((state) => state.addDocuments);
  const deleteDocument = useAppStore((state) => state.deleteDocument);
  const startExtraction = useAppStore((state) => state.startExtraction);

  const selectedIds = useAppStore((state) => state.selectedDocumentIds);
  const toggleSelection = useAppStore((state) => state.toggleDocumentSelection);
  const selectDocuments = useAppStore((state) => state.selectDocuments);
  const clearSelection = useAppStore((state) => state.clearDocumentSelection);
  const startBatchReview = useAppStore((state) => state.startBatchReview);

  const reviewDocumentId = useAppStore((state) => state.reviewDocumentId);
  const openDocumentReview = useAppStore((state) => state.openDocumentReview);
  const closeDocumentReview = useAppStore((state) => state.closeDocumentReview);

  const isBackedByDatabase = useAppStore((state) => state.isBackedByDatabase);
  const setSyncError = (message: string) =>
    useAppStore.setState({ syncError: message });

  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const reviewedDocument = useMemo(
    () => documents.find((item) => item.id === reviewDocumentId) ?? null,
    [documents, reviewDocumentId]
  );

  const allSelected =
    documents.length > 0 && selectedIds.length === documents.length;

  /**
   * Загруженный файл не просто ложится в список: сразу запускается разбор,
   * который вынимает реквизиты в карточку объекта.
   */
  function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;

    const files = Array.from(list).map((file) => ({
      name: file.name,
      sizeBytes: file.size,
      file,
    }));

    // Содержимое передаём дальше: загрузку в хранилище делает стор.
    void addDocuments(caseId, files);

    const first = files[0];
    if (first) startExtraction(first);
  }

  /**
   * Скачивание.
   *
   * Бакет закрытый, постоянного адреса у файла нет: сервер выдаёт временную
   * ссылку, и её открываем в новой вкладке. Пока базы нет, скачивать нечего —
   * во встроенном наборе файлов не существует.
   */
  async function handleDownload(documentId: string) {
    if (!isBackedByDatabase) return;

    const result = await createDocumentUrlAction(documentId);
    if (!result.ok || !result.data) {
      setSyncError(result.error ?? "Не удалось получить ссылку на файл.");
      return;
    }

    window.open(result.data, "_blank", "noopener,noreferrer");
  }

  return (
    <div
      className="flex flex-col gap-5"
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        handleFiles(event.dataTransfer.files);
      }}
    >
      {/* Панель над списком */}
      <div
        className={cn(
          "flex flex-wrap items-center gap-x-5 gap-y-3 border-b pb-3.5 transition-colors",
          isDragging ? "border-stone-900" : "border-stone-200"
        )}
      >
        <label className="flex cursor-pointer items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-stone-400 transition-colors hover:text-stone-900">
          <Checkbox
            checked={allSelected}
            onCheckedChange={() =>
              allSelected
                ? clearSelection()
                : selectDocuments(documents.map((item) => item.id))
            }
            aria-label="Выбрать все документы"
          />
          {documents.length}{" "}
          {plural(documents.length, "документ", "документа", "документов")}
        </label>

        {isDragging && (
          <MetaLabel className="text-stone-900">
            Отпустите — файл добавится и будет разобран
          </MetaLabel>
        )}

        <div className="ml-auto flex items-center gap-2">
          {selectedIds.length > 0 ? (
            <>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-stone-900">
                Выбрано: {selectedIds.length}
              </span>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => startBatchReview(caseId)}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Проверить пачкой
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={clearSelection}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Снять выделение</span>
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={() => toggleAssistant(true)}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Спросить ассистента
              </Button>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => inputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" />
                Загрузить и разобрать
              </Button>
            </>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.tif,.tiff"
          onChange={(event) => {
            handleFiles(event.target.files);
            // Сбрасываем значение, чтобы повторный выбор того же файла сработал.
            event.target.value = "";
          }}
        />
      </div>

      {/* Список документов */}
      {documents.length === 0 ? (
        <div className="flex flex-col items-center gap-2 border border-dashed border-stone-300 px-6 py-16 text-center">
          <FileText className="h-5 w-5 text-stone-300" />
          <p className="mt-1 text-sm text-stone-900">Документов пока нет</p>
          <p className="max-w-sm text-[13px] leading-relaxed text-stone-500">
            Перетащите файл сюда — реквизиты из него попадут в карточку
            объекта. Либо соберите пакет во вкладке «Объекты и генерация».
          </p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-stone-200 border-y border-stone-200">
          {documents.map((document, index) => {
            const status = DOCUMENT_STATUS_META[document.status];
            const isSelected = selectedIds.includes(document.id);

            return (
              <motion.li
                key={document.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(index * 0.04, 0.2) }}
                className={cn(
                  "group flex items-center gap-3.5 px-1 py-3.5 transition-colors",
                  isSelected ? "bg-stone-50" : "hover:bg-stone-50/60"
                )}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleSelection(document.id)}
                  aria-label={`Выбрать «${document.title}» для проверки`}
                  className="shrink-0"
                />

                <FileText className="h-3.5 w-3.5 shrink-0 text-stone-300" />

                {/* Клик по строке открывает разбор — это основное действие */}
                <button
                  type="button"
                  onClick={() => openDocumentReview(document.id)}
                  className="flex min-w-0 flex-1 flex-col text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
                >
                  <span className="truncate text-[13px] text-stone-900 underline-offset-4 group-hover:underline">
                    {document.title}
                  </span>
                  <span className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.1em] text-stone-400">
                    {document.type} · {formatDate(document.createdAt)}
                  </span>
                </button>

                <span
                  className={cn(
                    "hidden shrink-0 rounded border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] sm:inline-flex",
                    status.className
                  )}
                >
                  {status.label}
                </span>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Действия с документом</span>
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem
                      onSelect={() => openDocumentReview(document.id)}
                    >
                      <ShieldCheck className="h-4 w-4 text-stone-400" />
                      Разобрать по пунктам
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() =>
                        startExtraction({
                          name: document.title,
                          sizeBytes: 1_048_576,
                        })
                      }
                    >
                      <ScanLine className="h-4 w-4 text-stone-400" />
                      Извлечь реквизиты
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={() => void handleDownload(document.id)}
                    >
                      <Download className="h-4 w-4 text-stone-400" />
                      Скачать
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={() => deleteDocument(document.id)}
                      className="text-red-600 focus:bg-red-50 focus:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      Удалить
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </motion.li>
            );
          })}
        </ul>
      )}

      {/* Разбор одного договора по пунктам */}
      <Dialog
        open={Boolean(reviewedDocument)}
        onOpenChange={(open) => {
          if (!open) closeDocumentReview();
        }}
      >
        <DialogContent
          className="h-[88vh] max-w-6xl gap-0 overflow-hidden p-0"
          hideClose
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Разбор документа по пунктам</DialogTitle>
            <DialogDescription>
              Слева оригинал документа, справа найденные замечания.
            </DialogDescription>
          </DialogHeader>

          {reviewedDocument && (
            <ReviewSplitView
              file={{ name: reviewedDocument.title, sizeBytes: 1_258_291 }}
              onClose={closeDocumentReview}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Результаты пакетной проверки */}
      <BatchReviewSheet />
    </div>
  );
}
