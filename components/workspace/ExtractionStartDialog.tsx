"use client";

import { useEffect, useState } from "react";
import { ScanLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MetaLabel } from "@/components/layout/PanelHeading";
import { cn, plural } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import type { Document } from "@/types";

/**
 * Во что разбирать файл — спрашиваем до, а не после.
 *
 * Реквизиты извлекаются в карточку определённого типа, и от типа зависит,
 * что именно модель ищет в документе: у участка это кадастровый номер и
 * площадь, у контрагента — ИНН и адрес. Список реквизитов уходит в промпт, и
 * благодаря этому свои типы работают без единой правки кода.
 *
 * Угадывать тип по имени файла мы пробовали — так устроена витрина на рабочем
 * столе, и там это уместно. В деле нет: «скан_1.pdf» не говорит ни о чём, а
 * цена ошибки — карточка не того типа с пустыми полями и потраченный вызов
 * модели. Один вопрос до запуска дешевле.
 */
export function ExtractionStartDialog({
  document,
  caseId,
  onClose,
}: {
  /** Файл, который разбираем. null — диалог закрыт. */
  document: Document | null;
  caseId: string;
  onClose: () => void;
}) {
  const schemas = useAppStore((state) => state.entitySchemas);
  const startExtraction = useAppStore((state) => state.startExtraction);

  const [typeId, setTypeId] = useState<string>("");

  // Новый файл — новый выбор: прошлый тип к нему отношения не имеет.
  useEffect(() => {
    if (document) return;
    setTypeId("");
  }, [document]);

  return (
    <Dialog
      open={document !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <MetaLabel>Извлечение реквизитов</MetaLabel>
          <DialogTitle className="mt-1">
            Во что переносить реквизиты
          </DialogTitle>
          <DialogDescription>
            {document
              ? `Модель прочитает распознанный текст «${document.title}» и заполнит карточку выбранного типа. Реквизиты она берёт из описания типа — поэтому свои типы работают наравне со встроенными.`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="-mx-1 max-h-[45vh] px-1">
          <div className="flex flex-col gap-1.5">
            {schemas.map((schema) => {
              const requiredCount = schema.fields.filter(
                (field) => field.required
              ).length;

              return (
                <button
                  key={schema.id}
                  type="button"
                  onClick={() => setTypeId(schema.id)}
                  className={cn(
                    "flex flex-col gap-0.5 rounded border px-3.5 py-3 text-left transition-colors",
                    typeId === schema.id
                      ? "border-stone-900 bg-stone-50"
                      : "border-stone-200 hover:border-stone-300"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "h-1.5 w-1.5 shrink-0 rounded-full",
                        typeId === schema.id ? "bg-stone-900" : "bg-stone-300"
                      )}
                    />
                    <span className="text-[13px] text-stone-900">
                      {schema.label}
                    </span>
                    {schema.isCustom && (
                      <span className="rounded border border-stone-200 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-stone-400">
                        свой
                      </span>
                    )}
                  </span>

                  <span className="pl-3.5 text-[11.5px] leading-relaxed text-stone-500">
                    {schema.hint || "Без пояснения"}
                  </span>

                  <span className="pl-3.5 font-mono text-[9px] uppercase tracking-[0.1em] text-stone-400">
                    {schema.fields.length}{" "}
                    {plural(
                      schema.fields.length,
                      "реквизит",
                      "реквизита",
                      "реквизитов"
                    )}
                    {requiredCount > 0 && ` · ${requiredCount} обязательных`}
                  </span>
                </button>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Отмена
          </Button>
          <Button
            className="gap-1.5"
            disabled={!typeId || !document}
            onClick={() => {
              if (!document || !typeId) return;

              onClose();
              void startExtraction({
                documentId: document.id,
                caseId,
                typeId,
                title: document.title,
                sizeBytes: document.sizeBytes ?? 0,
              });
            }}
          >
            <ScanLine className="h-3.5 w-3.5" />
            {typeId ? "Разобрать" : "Выберите тип"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
