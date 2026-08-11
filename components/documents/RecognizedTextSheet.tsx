"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  Copy,
  Download,
  FileSearch,
  Loader2,
  ScanText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
 * Шторка устроена в три яруса: заголовок, панель действий и текст, занимающий
 * всё оставшееся место. Пустые состояния выровнены по центру этого места, а не
 * прижаты к его верхнему краю: строчка текста под шапкой большой пустой рамки
 * выглядит недоделанной вёрсткой, а не ответом.
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
  const done = document?.pagesDone ?? 0;
  const total = document?.pageCount ?? null;
  const isRunning = status === "pending" || status === "running";
  /*
   * Повтор закрыт только на «читаю». «В очереди» — состояние, в котором файл
   * может застрять навсегда: если задание не создалось, ждать нечего, а
   * закрытая кнопка не оставляет человеку выхода. Повторное нажатие безопасно:
   * задание с тем же отпечатком не заводится дважды.
   */
  const isBusy = status === "running";

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
    setLoading(true);

    void readDocumentPages(documentId).then((result) => {
      if (cancelled) return;
      setPages(result);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [documentId, done, readDocumentPages]);

  const filled = useMemo(
    () => (pages ?? []).filter((page) => page.text.trim().length > 0),
    [pages]
  );

  const fullText = useMemo(
    () =>
      filled
        .map((page) => `— Страница ${page.page} —\n\n${page.text}`)
        .join("\n\n"),
    [filled]
  );

  async function handleCopy() {
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    const blob = new Blob([fullText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");

    link.href = url;
    link.download = `${title.replace(/\.[^.]+$/, "") || "текст"}.txt`;
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <Sheet
      open={documentId !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-3xl"
      >
        {/* Ярус 1: что это за файл */}
        {/* Место справа оставлено крестику: он висит поверх, в правом верхнем углу. */}
        <SheetHeader className="border-b border-line px-6 py-5 pr-14">
          <SheetTitle className="text-body">{title || "Документ"}</SheetTitle>
          <SheetDescription className="text-caption leading-relaxed">
            Текст дословно, как его прочитала модель. Из него потом берутся
            реквизиты и формулировки — проверьте номера и даты.
          </SheetDescription>
        </SheetHeader>

        {/* Ярус 2: состояние и действия */}
        <div className="shrink-0 border-b border-line bg-bg/70 px-6 py-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <StatusLine
              status={status}
              done={done}
              total={total}
              recognized={filled.length}
            />

            <div className="ml-auto flex items-center gap-1">
              {fullText.length > 0 && (
                <>
                  <IconButton title="Скопировать текст" onClick={() => void handleCopy()}>
                    {isCopied ? (
                      <Check className="h-3.5 w-3.5 text-ok-fg" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </IconButton>
                  <IconButton title="Скачать текстом" onClick={handleDownload}>
                    <Download className="h-3.5 w-3.5" />
                  </IconButton>
                </>
              )}

              <Button
                variant="outline"
                size="sm"
                className="ml-1 gap-1.5"
                disabled={!documentId || isBusy || !isAvailable}
                onClick={() => {
                  if (documentId) void recognizeDocument(documentId);
                }}
              >
                <ScanText className="h-3.5 w-3.5" />
                {status ? "Распознать заново" : "Распознать"}
              </Button>
            </div>
          </div>

          {isRunning && (
            <Progress
              value={total ? (done / total) * 100 : 8}
              className="mt-3"
              indicatorClassName="bg-brand"
            />
          )}
        </div>

        {/* Предупреждения — только когда есть о чём предупредить */}
        {!isAvailable && (
          <div className="shrink-0 border-b border-warn-line bg-warn-bg/60 px-6 py-3 text-caption leading-relaxed text-warn-fg">
            Распознавание не настроено: нет модели, читающей картинки. Задайте
            приложению <code className="font-mono">LLM_BASE_URL</code> и{" "}
            <code className="font-mono">LLM_MODEL_VISION</code>, а ключ — в
            секретах исполнителя.
          </div>
        )}

        {status === "failed" && job?.error && (
          <div className="flex shrink-0 items-start gap-2 border-b border-danger-line bg-danger-bg/60 px-6 py-3 text-caption leading-relaxed text-danger-fg">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {job.error}
          </div>
        )}

        {/* Ярус 3: сам текст */}
        <div className="scrollable-area min-h-0 flex-1 overflow-y-auto px-6 py-6">
          {isLoading && pages === null ? (
            <Empty icon={Loader2} spinning title="Читаю" />
          ) : filled.length > 0 ? (
            <div className="flex flex-col gap-7">
              {filled.map((page) => (
                <PageBlock key={page.page} page={page} />
              ))}

              {isRunning && (
                <Meta>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Дочитываю остальное
                </Meta>
              )}
            </div>
          ) : isRunning ? (
            <Empty
              icon={Loader2}
              spinning
              title={
                total
                  ? `Читаю страницу ${Math.min(done + 1, total)} из ${total}`
                  : "Открываю файл"
              }
              hint="Текст появится здесь сам, по мере готовности страниц. Шторку можно закрыть — работа идёт на сервере."
            />
          ) : (
            <Empty
              icon={FileSearch}
              title="Текста пока нет"
              hint={
                status
                  ? "Страницы оказались пустыми — либо распознавание ещё не дошло до этого файла."
                  : "Этот файл ещё не распознавали. Нажмите «Распознать» наверху."
              }
            />
          )}
        </div>

        {/* Ярус 4: куда идти дальше */}
        <div className="shrink-0 border-t border-line px-6 py-3">
          <Link
            href="/dashboard/recognize"
            className="inline-flex items-center gap-1.5 font-mono text-label uppercase text-fg-subtle transition-colors hover:text-fg"
          >
            Все расшифровки и поиск по ним
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Одна страница: номер, откуда взят текст, сам текст. */
function PageBlock({ page }: { page: RecognizedPage }) {
  return (
    <section>
      <header className="mb-2 flex items-center gap-2 border-b border-line pb-1.5">
        <span className="font-mono text-label uppercase text-fg-subtle">
          Страница {page.page}
        </span>
        <span
          className={cn(
            "rounded-full border px-1.5 py-0.5 font-mono text-label uppercase ",
            page.source === "embedded"
              ? "border-line text-fg-faint"
              : "border-brand-line bg-brand-soft/60 text-brand-strong"
          )}
          title={page.model ?? undefined}
        >
          {describeSource(page.source)}
        </span>
      </header>

      <pre className="whitespace-pre-wrap break-words font-mono text-caption leading-relaxed text-fg-muted">
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
  done,
  total,
  recognized,
}: {
  status: string | undefined;
  done: number;
  total: number | null;
  recognized: number;
}) {
  if (status === "pending") {
    return (
      <Meta>
        <Loader2 className="h-3 w-3 animate-spin" />В очереди
      </Meta>
    );
  }

  if (status === "running") {
    return (
      <Meta>
        <Loader2 className="h-3 w-3 animate-spin" />
        {total ? `Страница ${Math.min(done + 1, total)} из ${total}` : "Читаю"}
      </Meta>
    );
  }

  if (status === "failed") {
    return (
      <Meta className="text-danger-fg">
        <AlertTriangle className="h-3 w-3" />
        Распознать не удалось
      </Meta>
    );
  }

  if (!status) return <Meta>Не распознавался</Meta>;

  return (
    <Meta>
      <Check className="h-3 w-3 text-ok-fg" />
      {recognized} {plural(recognized, "страница", "страницы", "страниц")}
    </Meta>
  );
}

/* ------------------------------------------------------------------ */
/*  МЕЛОЧИ                                                             */
/* ------------------------------------------------------------------ */

function Empty({
  icon: Icon,
  spinning,
  title,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  spinning?: boolean;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <Icon
        className={cn("h-5 w-5 text-fg-ghost", spinning && "animate-spin")}
      />
      <p className="text-body text-fg">{title}</p>
      {hint && (
        <p className="max-w-sm text-caption leading-relaxed text-fg-subtle">
          {hint}
        </p>
      )}
    </div>
  );
}

function Meta({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 font-mono text-label uppercase text-fg-subtle",
        className
      )}
    >
      {children}
    </span>
  );
}

function IconButton({
  children,
  title,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="rounded-xl p-1.5 text-fg-faint transition-colors hover:bg-surface-3/70 hover:text-fg"
    >
      {children}
      <span className="sr-only">{title}</span>
    </button>
  );
}
