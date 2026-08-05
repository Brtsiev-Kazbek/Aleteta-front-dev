"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  FileText,
  MoreHorizontal,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    addDocuments(
      caseId,
      Array.from(list).map((file) => ({
        name: file.name,
        sizeBytes: file.size,
      }))
    );
  }

  return (
    <div
      className="flex flex-col gap-4"
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
      <div
        className={cn(
          "flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border bg-white px-5 py-3.5 shadow-sm transition-colors",
          isDragging ? "border-indigo-400 bg-indigo-50/50" : "border-zinc-200"
        )}
      >
        <span className="text-sm font-semibold text-zinc-900">
          {documents.length}{" "}
          {plural(documents.length, "документ", "документа", "документов")}
        </span>

        {isDragging && (
          <span className="text-xs font-medium text-indigo-600">
            Отпустите файлы — они добавятся в дело
          </span>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="ml-auto h-8 gap-1.5 text-xs text-indigo-600 hover:text-indigo-700"
          onClick={() => toggleAssistant(true)}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Проверить документы на риски
        </Button>

        <Button
          size="sm"
          className="h-8 gap-1.5"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-3.5 w-3.5" />
          Добавить документы
        </Button>

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

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        {documents.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100">
              <FileText className="h-5 w-5 text-zinc-400" />
            </div>
            <p className="text-sm font-medium text-zinc-900">
              Документов пока нет
            </p>
            <p className="text-xs text-zinc-500">
              Сгенерируйте пакет во вкладке «Сущности и Генерация».
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-200/70">
            {documents.map((document, index) => {
              const status = DOCUMENT_STATUS_META[document.status];

              return (
                <motion.li
                  key={document.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="flex items-center gap-3.5 px-5 py-3.5 transition-colors hover:bg-zinc-50/70"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                    <FileText className="h-4 w-4 text-zinc-500" />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium text-zinc-900">
                      {document.title}
                    </span>
                    <span className="truncate text-xs text-zinc-400">
                      {document.type} · {formatDate(document.createdAt)}
                    </span>
                  </div>

                  <span
                    className={cn(
                      "hidden shrink-0 rounded-md border px-2 py-1 text-xs font-medium sm:inline-flex",
                      status.className
                    )}
                  >
                    {status.label}
                  </span>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-zinc-400 hover:text-zinc-900"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Действия с документом</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem>
                        <Download className="h-4 w-4 text-zinc-400" />
                        Скачать
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Sparkles className="h-4 w-4 text-zinc-400" />
                        Проверить риски
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
      </div>
    </div>
  );
}
