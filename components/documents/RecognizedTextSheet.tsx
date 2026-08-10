"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, Copy, Loader2, ScanText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn, plural } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import type { RecognizedPage } from "@/types";

/**
 * Распознанный текст документа — как есть, без обработки.
 *
 * Это не украшение и не отладочный экран. Всё, что приложение потом скажет про
 * документ — извлечённые реквизиты, найденные риски, ответ ассистента, —
 * выведено из этого текста. Если модель прочитала номер неверно, ошибка
 * разойдётся по всем документам дела, и заметить её можно только здесь.
 *
 * Поэтому текст показывается дословно, моноширинным шрифтом и постранично: так
 * видно лишние пробелы, склеенные строки, подменённые цифры — и сразу понятно,
 * какую страницу оригинала открывать для сверки.
 *
 * Отсюда же распознавание и запускается. Причин ровно две, и обе настоящие:
 * первая попытка не удалась, или файл загрузили тогда, когда исполнитель ещё не
 * был развёрнут. В обоих случаях человеку нужна кнопка, а не объяснение.
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
  const readDocumentPages = useAppStore((state) => state.readDocumentPages);
  const recognizeDocument = useAppStore((state) => state.recognizeDocument);
  const isAvailable = useAppStore((state) => state.isRecognitionAvailable);

  /* Документ берём из стора: пока идёт работа, его состояние обновляется. */
  const document = useAppStore((state) =>
    state.documents.find((item) => item.id === documentId)
  );
  const job = useAppStore((state) =>
    documentId ? state.recognitionJobs[documentId] : undefined
  );

  const [pages, setPages] = useState<RecognizedPage[] | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [isCopied, setCopied] = useState(false);

  const status = document?.ocrStatus;
  const pagesDone = document?.pagesDone ?? 0;
  const isRunning = status === "pending" || status === "running";

  /*
   * Перечитываем не по таймеру, а по числу готовых страниц. За ходом дела и так
   * следит стор; здесь остаётся подтянуть текст ровно тогда, когда его стало
   * больше — иначе шторка ходила бы на сервер и на дочитанном документе.
   */
  useEffect(() => {
    if (!documentId) {
      setPages(null);
      return;
    }

    let cancelled = false;

    void (async () => {
      const result = await readDocumentPages(documentId);
      if (!cancelled) {
        setPages(result);
        setLoading(false);
      }
    })();

    setLoading(true);

    return () => {
      cancelled = true;
    };
  }, [documentId, pagesDone, readDocumentPages]);

  const fullText = useMemo(
    () => (pages ?? []).map((page) => page.text).join("\n\n"),
    [pages]
  );

  async function handleCopy() {
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  const filled = (pages ?? []).filter((page) => page.text.trim().length > 0);

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

        {/* Строка состояния и действия */}
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-stone-200 pb-4">
          <StatusLine
            status={status}
            pagesDone={pagesDone}
            pageCount={document?.pageCount ?? null}
            recognized={filled.length}
          />

          <div className="ml-auto flex items-center gap-2">
            {fullText.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={() => void handleCopy()}
              >
                {isCopied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {isCopied ? "Скопировано" : "Скопировать"}
              </Button>
            )}

            <Button
              size="sm"
              className="gap-1.5"
              disabled={!documentId || isRunning || !isAvailable}
              onClick={() => {
                if (documentId) void recognizeDocument(documentId);
              }}
            >
              <ScanText className="h-3.5 w-3.5" />
              {status ? "Распознать заново" : "Распознать"}
            </Button>
          </div>
        </div>

        {/* Почему кнопка не нажимается */}
        {!isAvailable && (
          <p className="mt-3 text-[12.5px] leading-relaxed text-stone-500">
            Распознавание выключено: не задан ключ модели. Пока он не появится в
            секретах исполнителя, кнопка ничего не даст.
          </p>
        )}

        {/* Чем именно кончилась неудача */}
        {status === "failed" && job?.error && (
          <p className="mt-3 flex items-start gap-2 rounded border border-red-200 bg-red-50/60 p-3 text-[12.5px] leading-relaxed text-red-700">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {job.error}
          </p>
        )}

        <div className="scrollable-area mt-4 flex-1 overflow-y-auto rounded-lg border border-stone-200 bg-stone-50/60 p-5">
          {isLoading && pages === null ? (
            <p className="flex items-center gap-2 text-[13px] text-stone-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Читаю…
            </p>
          ) : filled.length > 0 ? (
            <div className="flex flex-col gap-6">
              {filled.map((page) => (
                <PageBlock key={page.page} page={page} />
              ))}
            </div>
          ) : (
            <p className="text-[13px] leading-relaxed text-stone-500">
              {isRunning
                ? "Текста пока нет — страницы дочитываются. Он появится здесь по мере готовности."
                : "Текста нет. Либо распознавание ещё не запускали, либо все страницы оказались пустыми."}
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Одна страница: номер, откуда взят текст, сам текст. */
function PageBlock({ page }: { page: RecognizedPage }) {
  return (
    <section>
      <header className="mb-2 flex items-center gap-2 border-b border-stone-200 pb-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-stone-500">
          Страница {page.page}
        </span>
        <span
          className={cn(
            "rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em]",
            page.source === "embedded"
              ? "border-stone-200 text-stone-400"
              : "border-violet-200 bg-violet-50/60 text-violet-700"
          )}
          title={page.model ?? undefined}
        >
          {describeSource(page.source)}
        </span>
      </header>

      <pre className="whitespace-pre-wrap break-words font-mono text-[12.5px] leading-relaxed text-stone-700">
        {page.text}
      </pre>
    </section>
  );
}

/**
 * Откуда взялся текст страницы.
 *
 * Разница не косметическая: текстовый слой перенесён из файла посимвольно и
 * ошибиться в нём нечему, а прочитанное моделью стоит сверить с оригиналом.
 */
function describeSource(source: string | null): string {
  switch (source) {
    case "embedded":
      return "Из файла";
    case "reused":
      return "Из копии";
    case "blank":
      return "Пустая";
    default:
      return "Прочитано моделью";
  }
}

function StatusLine({
  status,
  pagesDone,
  pageCount,
  recognized,
}: {
  status: string | undefined;
  pagesDone: number;
  pageCount: number | null;
  recognized: number;
}) {
  if (status === "pending") {
    return (
      <Line>
        <Loader2 className="h-3.5 w-3.5 animate-spin" />В очереди
      </Line>
    );
  }

  if (status === "running") {
    return (
      <Line>
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {pageCount
          ? `Страница ${Math.min(pagesDone + 1, pageCount)} из ${pageCount}`
          : "Читаю"}
      </Line>
    );
  }

  if (status === "failed") {
    return (
      <Line className="text-red-600">
        <AlertTriangle className="h-3.5 w-3.5" />
        Распознать не удалось
      </Line>
    );
  }

  if (!status) return <Line>Не распознавался</Line>;

  return (
    <Line>
      <Check className="h-3.5 w-3.5 text-emerald-600" />
      {recognized} {plural(recognized, "страница", "страницы", "страниц")}
    </Line>
  );
}

function Line({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-stone-500",
        className
      )}
    >
      {children}
    </span>
  );
}
