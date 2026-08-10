"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  FileText,
  Loader2,
  RotateCw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  HighlightedText,
  SearchFragment,
} from "@/components/recognize/HighlightedText";
import { cn, formatDate, plural } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import type { Document, RecognizedPage, SearchHit } from "@/types";

/**
 * Рабочий стол распознавания: положил файл — получил текст.
 *
 * Отдельная страница, а не пункт внутри дела, потому что это отдельная работа.
 * Дело заводят, когда с документами предстоит жить: собирать реквизиты, следить
 * за сроками, готовить бумаги. А прочитать один скан надо здесь и сейчас, и
 * заставлять человека придумывать этому скану папку — значит просить у него
 * плату за то, чего он не просил.
 *
 * Экран устроен в три полосы. Сверху — куда положить файл. Ниже слева — что уже
 * положили и в каком оно состоянии. Справа — текст. Поиск идёт поперёк всего:
 * он ищет не по этой странице, а по всем расшифровкам пространства, потому что
 * искать условие в договоре обычно приходят тогда, когда сам договор уже забыт.
 */

/** Что считаем разумным размером: у бакета предел пятьдесят мегабайт. */
const MAX_BYTES = 50 * 1024 * 1024;

const ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,.tif,.tiff,.doc,.docx,.xls,.xlsx";

export function RecognizeWorkbench() {
  const documents = useAppStore((state) => state.documents);
  const addDocuments = useAppStore((state) => state.addDocuments);
  const deleteDocument = useAppStore((state) => state.deleteDocument);
  const recognizeDocument = useAppStore((state) => state.recognizeDocument);
  const readDocumentPages = useAppStore((state) => state.readDocumentPages);
  const searchDocumentText = useAppStore((state) => state.searchDocumentText);
  const isAvailable = useAppStore((state) => state.isRecognitionAvailable);
  const isBackedByDatabase = useAppStore((state) => state.isBackedByDatabase);

  /* Показываем всё, что вообще проходило распознавание, новое сверху. */
  const recognized = useMemo(
    () =>
      documents
        .filter((document) => document.ocrStatus)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [documents]
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  /* Куда прокрутить текст после перехода из поиска и что в нём подсветить. */
  const [target, setTarget] = useState<{ page: number; query: string } | null>(
    null
  );
  const [isDragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = recognized.find((item) => item.id === selectedId) ?? null;

  /* Сам собой выделяется первый: экран без выбранного файла выглядит пустым. */
  useEffect(() => {
    if (selectedId && recognized.some((item) => item.id === selectedId)) return;
    setSelectedId(recognized[0]?.id ?? null);
  }, [recognized, selectedId]);

  function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;

    const picked = Array.from(list);
    const tooBig = picked.filter((file) => file.size > MAX_BYTES);

    if (tooBig.length > 0) {
      useAppStore.setState({
        syncError: `Файл «${tooBig[0]!.name}» больше 50 МБ — хранилище такой не примет.`,
      });
    }

    const accepted = picked.filter((file) => file.size <= MAX_BYTES);
    if (accepted.length === 0) return;

    // Дела нет: файл живёт сам по себе, ради одного лишь распознавания.
    void addDocuments(
      null,
      accepted.map((file) => ({
        name: file.name,
        sizeBytes: file.size,
        file,
      }))
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <Dropzone
        compact={recognized.length > 0}
        isDragging={isDragging}
        disabled={!isBackedByDatabase}
        onPick={() => inputRef.current?.click()}
        onDragStateChange={setDragging}
        onFiles={handleFiles}
      />

      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        accept={ACCEPT}
        onChange={(event) => {
          handleFiles(event.target.files);
          // Сброс, чтобы тот же файл можно было выбрать второй раз.
          event.target.value = "";
        }}
      />

      {!isAvailable && isBackedByDatabase && (
        <Notice>
          Распознавание выключено: не задан ключ модели. Файлы загрузятся и
          дождутся своей очереди, но текста пока не будет.
        </Notice>
      )}

      <SearchPanel
        onSearch={searchDocumentText}
        onOpen={(hit, query) => {
          setSelectedId(hit.documentId);
          setTarget({ page: hit.page, query });
        }}
        documents={recognized}
      />

      {recognized.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          <FileList
            documents={recognized}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onRetry={recognizeDocument}
            onDelete={deleteDocument}
          />

          <TextPane
            document={selected}
            readPages={readDocumentPages}
            onRetry={recognizeDocument}
            canRetry={isAvailable}
            target={target}
          />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  КУДА ПОЛОЖИТЬ ФАЙЛ                                                 */
/* ------------------------------------------------------------------ */

function Dropzone({
  compact,
  isDragging,
  disabled,
  onPick,
  onDragStateChange,
  onFiles,
}: {
  compact: boolean;
  isDragging: boolean;
  disabled: boolean;
  onPick: () => void;
  onDragStateChange: (dragging: boolean) => void;
  onFiles: (files: FileList | null) => void;
}) {
  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        onDragStateChange(true);
      }}
      onDragLeave={() => onDragStateChange(false)}
      onDrop={(event) => {
        event.preventDefault();
        onDragStateChange(false);
        onFiles(event.dataTransfer.files);
      }}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed text-center transition-colors",
        compact ? "px-6 py-8" : "px-6 py-20",
        isDragging
          ? "border-violet-400 bg-violet-50/50"
          : "border-stone-300 bg-white/60 hover:border-stone-400"
      )}
    >
      <Upload
        className={cn(
          "text-stone-300 transition-colors",
          compact ? "h-5 w-5" : "h-7 w-7",
          isDragging && "text-violet-500"
        )}
      />

      <p
        className={cn(
          "font-medium tracking-[-0.01em] text-stone-900",
          compact ? "text-[14px]" : "text-[17px]"
        )}
      >
        {isDragging ? "Отпустите — начну читать" : "Перетащите файл сюда"}
      </p>

      {!compact && (
        <p className="max-w-md text-[13px] leading-relaxed text-stone-500">
          Скан, фотография или PDF. Текст появится на этой же странице по мере
          того, как читаются страницы, — уходить и возвращаться не нужно.
        </p>
      )}

      <Button
        variant="outline"
        size="sm"
        className="mt-1 gap-1.5"
        disabled={disabled}
        onClick={onPick}
      >
        <FileText className="h-3.5 w-3.5" />
        Выбрать файл
      </Button>

      {disabled && (
        <p className="text-[12px] text-stone-400">
          Загрузка работает только с подключённой базой.
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ПОИСК                                                              */
/* ------------------------------------------------------------------ */

function SearchPanel({
  onSearch,
  onOpen,
  documents,
}: {
  onSearch: (query: string, documentId?: string | null) => Promise<SearchHit[]>;
  onOpen: (hit: SearchHit, query: string) => void;
  documents: Document[];
}) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [isSearching, setSearching] = useState(false);

  /*
   * Ждём, пока человек перестанет печатать. Иначе на «неустойка» уходит девять
   * запросов, из которых восемь никому не нужны, а последний ещё и приходит
   * не последним.
   */
  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setHits(null);
      setSearching(false);
      return;
    }

    setSearching(true);
    let cancelled = false;

    const timer = window.setTimeout(() => {
      void onSearch(trimmed).then((result) => {
        if (cancelled) return;
        setHits(result);
        setSearching(false);
      });
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, onSearch]);

  const hasDocuments = documents.length > 0;

  return (
    <section className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={
            hasDocuments
              ? "Найти в расшифровках: неустойка, срок оплаты, кадастровый номер…"
              : "Поиск заработает, когда появится первая расшифровка"
          }
          className="h-11 pl-9 pr-9"
          aria-label="Поиск по распознанному тексту"
        />
        {query.length > 0 && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-stone-400 transition-colors hover:text-stone-900"
          >
            <X className="h-3.5 w-3.5" />
            <span className="sr-only">Очистить</span>
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>
        {hits !== null && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {isSearching ? (
              <Meta>
                <Loader2 className="h-3 w-3 animate-spin" />
                Ищу
              </Meta>
            ) : hits.length === 0 ? (
              <Meta>Ничего не нашлось</Meta>
            ) : (
              <>
                <Meta>
                  {hits.length}{" "}
                  {plural(hits.length, "совпадение", "совпадения", "совпадений")}
                </Meta>

                <ul className="mt-2 flex flex-col divide-y divide-stone-200 border-y border-stone-200">
                  {hits.map((hit) => (
                    <li key={`${hit.documentId}-${hit.page}`}>
                      <button
                        type="button"
                        onClick={() => onOpen(hit, query.trim())}
                        className="flex w-full flex-col gap-1 px-1 py-3 text-left transition-colors hover:bg-stone-50"
                      >
                        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-stone-400">
                          {hit.documentTitle} · страница {hit.page}
                        </span>
                        <span className="text-[13px] leading-relaxed text-stone-700">
                          <SearchFragment fragment={hit.fragment} />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  СПИСОК ФАЙЛОВ                                                      */
/* ------------------------------------------------------------------ */

function FileList({
  documents,
  selectedId,
  onSelect,
  onRetry,
  onDelete,
}: {
  documents: Document[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {documents.map((document) => {
        const isSelected = document.id === selectedId;
        const total = document.pageCount ?? 0;
        const done = document.pagesDone ?? 0;
        const isRunning =
          document.ocrStatus === "pending" || document.ocrStatus === "running";
        // Повтор прячем только на «читаю»: из «в очереди» файл может не выйти.
        const isBusy = document.ocrStatus === "running";

        return (
          <li key={document.id}>
            <div
              className={cn(
                "group rounded-lg border p-3 transition-colors",
                isSelected
                  ? "border-stone-900 bg-white"
                  : "border-stone-200 bg-white/60 hover:border-stone-400"
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(document.id)}
                className="flex w-full items-start gap-2.5 text-left"
              >
                <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-300" />

                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[13px] text-stone-900">
                    {document.title}
                  </span>
                  <span className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.1em] text-stone-400">
                    {formatDate(document.createdAt)}
                  </span>
                </span>
              </button>

              <div className="mt-2.5 flex items-center gap-2">
                <StatusText document={document} />

                <div className="ml-auto flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  {!isBusy && (
                    <IconButton
                      title="Распознать заново"
                      onClick={() => onRetry(document.id)}
                    >
                      <RotateCw className="h-3.5 w-3.5" />
                    </IconButton>
                  )}
                  <IconButton
                    title="Удалить"
                    onClick={() => onDelete(document.id)}
                    className="hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </IconButton>
                </div>
              </div>

              {isRunning && (
                <Progress
                  value={total > 0 ? (done / total) * 100 : 8}
                  className="mt-2.5"
                  indicatorClassName="bg-violet-500"
                />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function StatusText({ document }: { document: Document }) {
  const done = document.pagesDone ?? 0;
  const total = document.pageCount;

  switch (document.ocrStatus) {
    case "pending":
      return (
        <Meta>
          <Loader2 className="h-3 w-3 animate-spin" />В очереди
        </Meta>
      );
    case "running":
      return (
        <Meta>
          <Loader2 className="h-3 w-3 animate-spin" />
          {total ? `Страница ${Math.min(done + 1, total)} из ${total}` : "Читаю"}
        </Meta>
      );
    case "failed":
      return (
        <Meta className="text-red-600">
          <AlertTriangle className="h-3 w-3" />
          Не удалось
        </Meta>
      );
    default:
      return (
        <Meta>
          <Check className="h-3 w-3 text-emerald-600" />
          {total
            ? `${total} ${plural(total, "страница", "страницы", "страниц")}`
            : "Готово"}
        </Meta>
      );
  }
}

/* ------------------------------------------------------------------ */
/*  ТЕКСТ                                                              */
/* ------------------------------------------------------------------ */

function TextPane({
  document,
  readPages,
  onRetry,
  canRetry,
  target,
}: {
  document: Document | null;
  readPages: (documentId: string) => Promise<RecognizedPage[]>;
  onRetry: (documentId: string) => void;
  canRetry: boolean;
  /** Переход из поиска: какую страницу показать и что в ней подсветить. */
  target: { page: number; query: string } | null;
}) {
  const [pages, setPages] = useState<RecognizedPage[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [isCopied, setCopied] = useState(false);
  const [query, setQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const documentId = document?.id ?? null;
  const pagesDone = document?.pagesDone ?? 0;

  /* Перечитываем по числу готовых страниц: за самим ходом дела следит стор. */
  useEffect(() => {
    if (!documentId) {
      setPages([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void readPages(documentId).then((result) => {
      if (cancelled) return;
      setPages(result);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [documentId, pagesDone, readPages]);

  /*
   * Переход из поиска: подставляем запрос в поле подсветки и прокручиваем к
   * найденной странице. Прокрутка ждёт, пока страницы приедут, — иначе
   * прокручивать нечего, элемента ещё нет.
   */
  useEffect(() => {
    if (!target) return;
    setQuery(target.query);
  }, [target]);

  useEffect(() => {
    if (!target || pages.length === 0) return;

    const anchor = scrollRef.current?.querySelector(`#page-${target.page}`);
    anchor?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [target, pages]);

  const filled = pages.filter((page) => page.text.trim().length > 0);
  const fullText = filled
    .map((page) => `— Страница ${page.page} —\n\n${page.text}`)
    .join("\n\n");

  const terms = useMemo(
    () => query.trim().split(/\s+/).filter(Boolean),
    [query]
  );

  async function handleCopy() {
    await navigator.clipboard.writeText(fullText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    if (!document) return;

    const blob = new Blob([fullText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");

    link.href = url;
    link.download = `${document.title.replace(/\.[^.]+$/, "")}.txt`;
    link.click();

    URL.revokeObjectURL(url);
  }

  if (!document) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-stone-200 bg-white/60 p-12 text-[13px] text-stone-500">
        Выберите файл слева.
      </div>
    );
  }

  const isRunning =
    document.ocrStatus === "pending" || document.ocrStatus === "running";

  return (
    <div className="flex min-w-0 flex-col rounded-lg border border-stone-200 bg-white">
      {/* Шапка панели */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-stone-200 px-5 py-3">
        <h2 className="min-w-0 flex-1 truncate text-[14px] font-medium tracking-[-0.01em] text-stone-900">
          {document.title}
        </h2>

        {filled.length > 0 && (
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-stone-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="В этом файле"
              className="h-8 w-44 pl-7 text-[12.5px]"
              aria-label="Подсветить слова в тексте"
            />
          </div>
        )}

        {filled.length > 0 && (
          <>
            <IconButton title="Скопировать текст" onClick={() => void handleCopy()}>
              {isCopied ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </IconButton>
            <IconButton title="Скачать текстом" onClick={handleDownload}>
              <Download className="h-3.5 w-3.5" />
            </IconButton>
          </>
        )}

        {document.ocrStatus !== "running" && canRetry && (
          <IconButton
            title="Распознать заново"
            onClick={() => onRetry(document.id)}
          >
            <RotateCw className="h-3.5 w-3.5" />
          </IconButton>
        )}
      </div>

      {/* Текст */}
      <div
        ref={scrollRef}
        className="scrollable-area max-h-[70vh] min-w-0 overflow-y-auto px-5 py-5"
      >
        {document.ocrStatus === "failed" ? (
          <p className="flex items-start gap-2 rounded border border-red-200 bg-red-50/60 p-3 text-[12.5px] leading-relaxed text-red-700">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Распознать не удалось. Нажмите «распознать заново» — если не поможет,
            загляните в журнал заданий.
          </p>
        ) : isLoading && filled.length === 0 ? (
          <Meta>
            <Loader2 className="h-3 w-3 animate-spin" />
            Читаю
          </Meta>
        ) : filled.length === 0 ? (
          <p className="text-[13px] leading-relaxed text-stone-500">
            {isRunning
              ? "Страницы дочитываются — текст появится здесь сам, по мере готовности."
              : "Текста нет: страницы оказались пустыми."}
          </p>
        ) : (
          <div className="flex flex-col gap-7">
            {filled.map((page) => (
              <section
                key={page.page}
                id={`page-${page.page}`}
                className={cn(
                  "scroll-mt-4 rounded transition-colors",
                  target?.page === page.page && "bg-amber-50/60"
                )}
              >
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
                  <HighlightedText text={page.text} terms={terms} />
                </pre>
              </section>
            ))}

            {isRunning && (
              <Meta>
                <Loader2 className="h-3 w-3 animate-spin" />
                Дочитываю остальное
              </Meta>
            )}
          </div>
        )}
      </div>
    </div>
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

/* ------------------------------------------------------------------ */
/*  МЕЛОЧИ                                                             */
/* ------------------------------------------------------------------ */

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
        "flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-stone-500",
        className
      )}
    >
      {children}
    </span>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3 text-[12.5px] leading-relaxed text-amber-900">
      {children}
    </p>
  );
}

function IconButton({
  children,
  title,
  onClick,
  className,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "rounded p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-900",
        className
      )}
    >
      {children}
      <span className="sr-only">{title}</span>
    </button>
  );
}
