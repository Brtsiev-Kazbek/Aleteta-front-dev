"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAppStore } from "@/store/useAppStore";

/**
 * Распознанный текст документа — как есть, без обработки.
 *
 * Это не украшение и не отладочный экран. Всё, что приложение потом скажет про
 * документ — извлечённые реквизиты, найденные риски, ответ ассистента, —
 * выведено из этого текста. Если модель прочитала номер неверно, ошибка
 * разойдётся по всем документам дела, и заметить её можно только здесь.
 *
 * Поэтому текст показывается дословно и моноширинным шрифтом: так видно
 * лишние пробелы, склеенные строки и подменённые цифры.
 */
export function RecognizedTextSheet({
  documentId,
  title,
  onClose,
}: {
  documentId: string | null;
  title: string;
  onClose: () => void;
}) {
  const readDocumentText = useAppStore((state) => state.readDocumentText);

  const [text, setText] = useState<string | null>(null);
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    if (!documentId) {
      setText(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void readDocumentText(documentId).then((result) => {
      if (cancelled) return;
      setText(result ?? "");
      setLoading(false);
    });

    // Шторку закрыли, пока текст ехал: писать в размонтированный экран нельзя.
    return () => {
      cancelled = true;
    };
  }, [documentId, readDocumentText]);

  return (
    <Sheet
      open={documentId !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Распознанный текст</SheetTitle>
          <SheetDescription>
            {title}. Это тот текст, из которого будут браться реквизиты и
            формулировки — проверьте номера и даты.
          </SheetDescription>
        </SheetHeader>

        <div className="scrollable-area mt-6 flex-1 overflow-y-auto rounded-lg border border-stone-200 bg-stone-50/60 p-5">
          {isLoading ? (
            <p className="flex items-center gap-2 text-[13px] text-stone-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Читаю…
            </p>
          ) : text ? (
            <pre className="whitespace-pre-wrap break-words font-mono text-[12.5px] leading-relaxed text-stone-700">
              {text}
            </pre>
          ) : (
            <p className="text-[13px] text-stone-500">
              Текста пока нет. Либо распознавание ещё идёт, либо страницы
              оказались пустыми.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
