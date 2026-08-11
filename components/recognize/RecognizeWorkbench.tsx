"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  FileText,
  Loader2,
  PanelRightClose,
  PanelRightOpen,
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
  countMatches,
  HighlightedText,
  SearchFragment,
} from "@/components/recognize/HighlightedText";
import { OriginalPane } from "@/components/recognize/OriginalPane";
import { createLogger } from "@/lib/logger";
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

const log = createLogger("recognize");

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
  /*
   * Оригинал живёт здесь, а не внутри панели текста, потому что от него зависит
   * вся раскладка: когда он открыт, места нужно втрое больше, и список файлов
   * уходит, чтобы освободить его. Раскладку нельзя решать изнутри одной из
   * колонок.
   */
  const [showOriginal, setShowOriginal] = useState(true);
  const [openPage, setOpenPage] = useState(1);
  /** Вести оригинал за прокруткой текста. Смысл имеет только при сверке. */
  const [syncScroll, setSyncScroll] = useState(true);
  const [isDragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = recognized.find((item) => item.id === selectedId) ?? null;

  /* Оригинал показываем только у PDF: у картинки страниц нет и листать нечего. */
  const isPdf = /\.pdf$/i.test(selected?.title ?? "");
  const withOriginal = showOriginal && isPdf && selected !== null;

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
        current={
          selectedId && target
            ? { documentId: selectedId, page: target.page }
            : null
        }
      />

      {recognized.length > 0 &&
        (withOriginal ? (
          /*
           * Режим сверки. Список файлов уходит наверх полосой, а текст и
           * оригинал встают рядом — иначе на обычном ноутбуке им не хватает
           * ширины, колонки складываются, и «рядом» превращается в «одно под
           * другим». Ради чего тогда всё это.
           */
          <div className="flex min-w-0 flex-col gap-4">
            <FileStrip
              documents={recognized}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />

            <div className="grid min-w-0 gap-4 md:grid-cols-2 md:items-stretch">
              <div className="h-[78vh] min-w-0">
                <TextPane
                  document={selected}
                  readPages={readDocumentPages}
                  onRetry={recognizeDocument}
                  canRetry={isAvailable}
                  target={target}
                  openPage={openPage}
                  onOpenPage={setOpenPage}
                  showOriginal={showOriginal}
                  onToggleOriginal={() => setShowOriginal((value) => !value)}
                  canShowOriginal={isPdf}
                  syncScroll={syncScroll}
                />
              </div>

              {selected && (
                <div className="h-[78vh] min-w-0">
                  <OriginalPane
                    documentId={selected.id}
                    title={selected.title}
                    page={openPage}
                    pageCount={selected.pageCount ?? null}
                    onPageChange={setOpenPage}
                    syncScroll={syncScroll}
                    onToggleSync={() => setSyncScroll((value) => !value)}
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]">
            <FileList
              documents={recognized}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onRetry={recognizeDocument}
              onDelete={deleteDocument}
            />

            <div className="h-[75vh] min-w-0">
              <TextPane
                document={selected}
                readPages={readDocumentPages}
                onRetry={recognizeDocument}
                canRetry={isAvailable}
                target={target}
                openPage={openPage}
                onOpenPage={setOpenPage}
                showOriginal={showOriginal}
                onToggleOriginal={() => setShowOriginal((value) => !value)}
                canShowOriginal={isPdf}
              />
            </div>
          </div>
        ))}
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
          ? "border-brand bg-brand-soft/50"
          : "border-line-strong bg-surface/60 hover:border-fg-faint"
      )}
    >
      <Upload
        className={cn(
          "text-fg-ghost transition-colors",
          compact ? "h-5 w-5" : "h-7 w-7",
          isDragging && "text-brand"
        )}
      />

      <p
        className={cn(
          "font-medium text-fg",
          compact ? "text-body" : "text-title-sm"
        )}
      >
        {isDragging ? "Отпустите — начну читать" : "Перетащите файл сюда"}
      </p>

      {!compact && (
        <p className="max-w-md text-body-sm leading-relaxed text-fg-subtle">
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
        <p className="text-caption text-fg-faint">
          Загрузка работает только с подключённой базой.
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ПОИСК                                                              */
/* ------------------------------------------------------------------ */

/**
 * Поиск по всем расшифровкам.
 *
 * Устроен как поиск в читалке, а не как список результатов: набрал — и ходишь
 * по совпадениям стрелками, не отрывая рук от клавиатуры. Enter — вперёд,
 * Shift+Enter — назад, Esc — очистить. Список под полем остаётся: по нему
 * видно, в каких файлах нашлось, и можно прыгнуть сразу в нужный.
 *
 * Почему это важнее, чем кажется. Юрист ищет условие, а не файл: «где у нас
 * про неустойку 0,1 %». Ответ «нашлось в семнадцати местах» бесполезен, если
 * пройти по ним можно только мышью, по одному, возвращаясь к списку.
 */
function SearchPanel({
  onSearch,
  onOpen,
  documents,
  current,
}: {
  onSearch: (query: string, documentId?: string | null) => Promise<SearchHit[]>;
  onOpen: (hit: SearchHit, query: string) => void;
  documents: Document[];
  /** Какое совпадение открыто сейчас: подсвечиваем его в списке. */
  current: { documentId: string; page: number } | null;
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

  const found = hits ?? [];

  /* Который из найденных открыт. −1, пока не переходили ни к одному. */
  const index = current
    ? found.findIndex(
        (hit) =>
          hit.documentId === current.documentId && hit.page === current.page
      )
    : -1;

  function go(step: number) {
    if (found.length === 0) return;

    // По кругу: с последнего — на первый. Тупик в конце списка раздражает.
    const next = (index + step + found.length) % found.length;
    onOpen(found[next]!, query.trim());
  }

  const hasDocuments = documents.length > 0;

  return (
    <section className="flex flex-col gap-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-faint" />

        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              go(event.shiftKey ? -1 : 1);
            }
            if (event.key === "Escape") setQuery("");
          }}
          placeholder={
            hasDocuments
              ? "Найти в расшифровках: неустойка, срок оплаты, кадастровый номер…"
              : "Поиск заработает, когда появится первая расшифровка"
          }
          className="h-12 pl-11 pr-44 text-body"
          aria-label="Поиск по распознанному тексту"
        />

        {/* Счётчик и стрелки — там же, где их ищут: справа в поле */}
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {isSearching && (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin text-fg-faint" />
          )}

          {hits !== null && !isSearching && (
            <span className="mr-1 font-mono text-label uppercase text-fg-faint">
              {found.length === 0
                ? "нет совпадений"
                : `${index >= 0 ? index + 1 : "—"} из ${found.length}`}
            </span>
          )}

          <StepButton
            title="Предыдущее совпадение (Shift+Enter)"
            disabled={found.length === 0}
            onClick={() => go(-1)}
          >
            <ChevronUp className="h-4 w-4" />
          </StepButton>

          <StepButton
            title="Следующее совпадение (Enter)"
            disabled={found.length === 0}
            onClick={() => go(1)}
          >
            <ChevronDown className="h-4 w-4" />
          </StepButton>

          {query.length > 0 && (
            <StepButton title="Очистить (Esc)" onClick={() => setQuery("")}>
              <X className="h-3.5 w-3.5" />
            </StepButton>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {hits !== null && !isSearching && found.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="scrollable-area flex max-h-64 flex-col divide-y divide-line overflow-y-auto rounded-lg border border-line bg-surface"
          >
            {found.map((hit, position) => {
              const isCurrent = position === index;

              return (
                <li key={`${hit.documentId}-${hit.page}`}>
                  <button
                    type="button"
                    onClick={() => onOpen(hit, query.trim())}
                    className={cn(
                      "flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors",
                      isCurrent ? "bg-warn-bg/70" : "hover:bg-bg"
                    )}
                  >
                    <span className="flex items-center gap-2 font-mono text-label uppercase text-fg-faint">
                      <span className="truncate">{hit.documentTitle}</span>
                      <span className="shrink-0 text-fg-ghost">·</span>
                      <span className="shrink-0">стр. {hit.page}</span>
                    </span>
                    <span className="text-body-sm leading-relaxed text-fg-muted">
                      <SearchFragment fragment={hit.fragment} />
                    </span>
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </section>
  );
}

/** Кнопка-шаг в поле поиска: стрелки и крестик. */
function StepButton({
  children,
  title,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="rounded p-1.5 text-fg-faint transition-colors hover:bg-surface-2 hover:text-fg disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
      <span className="sr-only">{title}</span>
    </button>
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
                  ? "border-fg bg-surface"
                  : "border-line bg-surface/60 hover:border-fg-faint"
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(document.id)}
                className="flex w-full items-start gap-2.5 text-left"
              >
                <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-fg-ghost" />

                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-body-sm text-fg">
                    {document.title}
                  </span>
                  <span className="mt-0.5 truncate font-mono text-label uppercase text-fg-faint">
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
                    className="hover:text-danger-fg"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </IconButton>
                </div>
              </div>

              {isRunning && (
                <Progress
                  value={total > 0 ? (done / total) * 100 : 8}
                  className="mt-2.5"
                  indicatorClassName="bg-brand"
                />
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Полоса файлов для режима сверки.
 *
 * Тот же выбор, что и в списке, но по горизонтали: когда рядом стоит оригинал,
 * ширина дороже всего, а список файлов при сверке нужен реже прочего — к нему
 * обращаются, чтобы перейти к следующему документу, и всё.
 */
function FileStrip({
  documents,
  selectedId,
  onSelect,
}: {
  documents: Document[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="scrollable-area -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {documents.map((document) => {
        const isSelected = document.id === selectedId;

        return (
          <button
            key={document.id}
            type="button"
            onClick={() => onSelect(document.id)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 transition-colors",
              isSelected
                ? "border-fg bg-surface"
                : "border-line bg-surface/60 hover:border-fg-faint"
            )}
          >
            <FileText className="h-3.5 w-3.5 shrink-0 text-fg-ghost" />

            <span className="max-w-[14rem] truncate text-caption text-fg">
              {document.title}
            </span>

            <span className="shrink-0">
              <StatusText document={document} />
            </span>
          </button>
        );
      })}
    </div>
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
        <Meta className="text-danger-fg">
          <AlertTriangle className="h-3 w-3" />
          Не удалось
        </Meta>
      );
    default:
      return (
        <Meta>
          <Check className="h-3 w-3 text-ok-fg" />
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
  openPage,
  onOpenPage,
  showOriginal,
  onToggleOriginal,
  canShowOriginal,
  syncScroll = false,
}: {
  document: Document | null;
  readPages: (documentId: string) => Promise<RecognizedPage[]>;
  onRetry: (documentId: string) => void;
  canRetry: boolean;
  /** Переход из поиска: какую страницу показать и что в ней подсветить. */
  target: { page: number; query: string } | null;
  /** Какая страница открыта в оригинале — им распоряжается рабочий стол. */
  openPage: number;
  onOpenPage: (page: number) => void;
  showOriginal: boolean;
  onToggleOriginal: () => void;
  canShowOriginal: boolean;
  /** Вести оригинал за прокруткой текста. Имеет смысл только при сверке. */
  syncScroll?: boolean;
}) {
  const [pages, setPages] = useState<RecognizedPage[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [isCopied, setCopied] = useState(false);
  const [query, setQuery] = useState("");
  /** Номер совпадения, к которому перешли стрелками. −1 — ни к какому. */
  const [active, setActive] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  /** Обработанный переход из поиска: повторно на него не смотрим. */
  const handledTarget = useRef<typeof target>(null);
  /** Номер, который сброс по смене запроса должен взять вместо нуля. */
  const pendingActive = useRef<number | null>(null);

  /* Задание нужно ради одного поля — текста ошибки, если оно упало. */
  const job = useAppStore((state) =>
    document ? state.recognitionJobs[document.id] : undefined
  );
  const refreshRecognition = useAppStore((state) => state.refreshRecognition);

  /*
   * У упавшего документа наблюдателя нет — он остановился вместе с работой.
   * Значит, после перезагрузки страницы текста ошибки в сторе не окажется, и
   * человек увидит «не удалось» без объяснения. Спрашиваем один раз.
   */
  useEffect(() => {
    if (!document || document.ocrStatus !== "failed" || job) return;
    void refreshRecognition(document.id);
  }, [document, job, refreshRecognition]);

  const documentId = document?.id ?? null;
  const pagesDone = document?.pagesDone ?? 0;

  /**
   * Чей текст сейчас в `pages`.
   *
   * Без этого страницы предыдущего файла продолжают считаться текущими всё
   * время, пока едут новые, — а это несколько сотен миллисекунд, в которые
   * успевает отработать переход из поиска. Он тогда ищет совпадение в чужом
   * тексте, помечает переход обработанным и больше к нему не возвращается.
   * Снаружи это выглядит именно так, как выглядело: оригинал открылся на
   * нужной странице, а текст остался на месте.
   */
  const loadedFor = useRef<string | null>(null);

  /* Перечитываем по числу готовых страниц: за самим ходом дела следит стор. */
  useEffect(() => {
    if (!documentId) {
      loadedFor.current = null;
      setPages([]);
      return;
    }

    // Сменился файл — старый текст больше не наш, даже на время загрузки.
    if (loadedFor.current !== documentId) {
      loadedFor.current = documentId;
      handledTarget.current = null;
      setPages([]);
      setActive(-1);
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

  const filled = useMemo(
    () => pages.filter((page) => page.text.trim().length > 0),
    [pages]
  );

  const terms = useMemo(
    () => query.trim().split(/\s+/).filter(Boolean),
    [query]
  );

  /*
   * Сквозная нумерация совпадений по всему документу.
   *
   * Страница получает смещение — сколько совпадений было до неё, — и нумерует
   * свои от него. Это единственный способ ходить стрелками по всему тексту, а
   * не внутри одной страницы: номер совпадения должен пережить переход через
   * границу страницы.
   */
  const marks = useMemo(() => {
    let running = 0;

    const offsets = filled.map((page) => {
      const offset = running;
      running += countMatches(page.text, terms);
      return { page: page.page, offset };
    });

    return { offsets, total: running };
  }, [filled, terms]);

  /*
   * Номер текущего совпадения держим в границах.
   *
   * Совпадений становится то больше, то меньше — от каждой набранной буквы, —
   * и номер, законный секунду назад, легко оказывается за пределами. Чинить
   * это состоянием значило бы гоняться за ним из нескольких мест; проще
   * приводить к границам при чтении.
   */
  const at = marks.total === 0 ? -1 : Math.min(Math.max(active, 0), marks.total - 1);

  /*
   * Переход из общего поиска — ровно один раз на переход.
   *
   * Здесь была поломка, стоившая работающего поиска по файлу: эффект зависел
   * от `marks.offsets`, а этот массив пересоздаётся при каждом изменении
   * запроса, то есть на каждое нажатие клавиши. Значит, после первого же
   * перехода из общего поиска ввод в поле «в этом файле» откатывал позицию к
   * старой странице — и стрелки будто переставали работать.
   *
   * Признак перехода — сам объект `target`: он создаётся заново на каждый
   * щелчок по находке. Запоминаем обработанный и больше на него не смотрим.
   */

  /**
   * Прокрутка внутри окна чтения.
   *
   * Считаем смещение сами и двигаем именно наш контейнер, а не полагаемся на
   * `scrollIntoView`. Тот сам решает, какой из прокручиваемых предков двигать,
   * и в разметке из вложенных `flex` с `overflow` регулярно выбирает не тот —
   * снаружи это выглядит как «текст не прокручивается вообще».
   *
   * Ждём кадр: разметку с новой подсветкой браузер ещё не построил, и
   * искать в ней нечего.
   */
  const scrollTo = useCallback((selector: string, ratio = 0.35) => {
    window.requestAnimationFrame(() => {
      const node = scrollRef.current;

      if (!node) {
        log.debug("scroll.no-container", { куда: selector });
        return;
      }

      const element = node.querySelector(selector);

      if (!element) {
        log.debug("scroll.no-anchor", { куда: selector });
        return;
      }

      const before = node.scrollTop;
      const shift =
        element.getBoundingClientRect().top -
        node.getBoundingClientRect().top +
        before -
        node.clientHeight * ratio;

      node.scrollTo({ top: Math.max(0, shift), behavior: "smooth" });

      /*
       * Страховка. Если наш контейнер прокручивать нечем — разметка изменилась,
       * высота не задана, содержимое короче окна, — просим браузер довести до
       * элемента как умеет. Хуже от этого не станет, а «текст не прокрутился»
       * перестанет быть возможным.
       */
      if (node.scrollHeight <= node.clientHeight + 4) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      log.debug("scroll", {
        куда: selector,
        было: Math.round(before),
        стало: Math.round(shift),
        высота: node.scrollHeight,
        окно: node.clientHeight,
      });
    });
  }, []);

  /**
   * Ведём текст к совпадению, а если его нет — к началу страницы.
   *
   * Совпадения может не быть законно: база ищет по основам своим разбором,
   * подсветка — своим, и на редком слове они расходятся.
   */
  const reveal = useCallback(
    (index: number, page: number | null) => {
      window.requestAnimationFrame(() => {
        const node = scrollRef.current;
        if (!node) return;

        if (index >= 0 && node.querySelector(`#match-${index}`)) {
          scrollTo(`#match-${index}`, 0.35);
          return;
        }

        if (page !== null) scrollTo(`#page-${page}`, 0.02);
      });
    },
    [scrollTo]
  );

  useEffect(() => {
    if (!target || handledTarget.current === target) return;
    // Страницы ещё не приехали — обработаем на следующем проходе.
    if (filled.length === 0) return;

    handledTarget.current = target;

    /*
     * Смещение считаем по запросу самой находки, а не по тому, что сейчас
     * набрано в поле. Запрос из поиска только что передан в поле, но состояние
     * обновится лишь к следующему проходу — `marks` здесь ещё про старый
     * запрос, и взятое из них смещение указывало бы не туда.
     */
    const targetTerms = target.query.trim().split(/\s+/).filter(Boolean);

    let running = 0;
    let position = 0;

    for (const page of filled) {
      if (page.page === target.page) {
        position = running;
        break;
      }
      running += countMatches(page.text, targetTerms);
    }

    /*
     * Смена запроса сбрасывает позицию на первое совпадение — это правильно,
     * когда человек печатает сам, и неправильно сейчас. Оставляем записку,
     * которую сброс прочитает вместо нуля.
     */
    pendingActive.current = position;

    setQuery(target.query);
    onOpenPage(target.page);
    setActive(position);

    /*
     * Прокручиваем явно, а не полагаемся на эффект по номеру совпадения.
     * Номер мог не измениться — тогда React не перерисовывает, эффект не
     * срабатывает, и текст остаётся на месте, пока оригинал уезжает. Ровно это
     * и выглядело как «прокручивается только PDF».
     */
    reveal(position, target.page);
  }, [target, filled, onOpenPage, reveal]);

  /* Новый запрос — с первого совпадения. Кроме перехода из общего поиска. */
  useEffect(() => {
    setActive(pendingActive.current ?? 0);
    pendingActive.current = null;
  }, [query]);

  /* На какой странице стоит текущее совпадение: туда же ведём и оригинал. */
  const activePage = useMemo(() => {
    if (at < 0) return null;

    const found = [...marks.offsets]
      .reverse()
      .find((entry) => entry.offset <= at);

    return found?.page ?? null;
  }, [at, marks.offsets]);

  useEffect(() => {
    if (activePage) onOpenPage(activePage);
  }, [activePage, onOpenPage]);

  /*
   * Прокрутка к текущему совпадению.
   *
   * Зависимость — число страниц, а не сам список: список приезжает заново на
   * каждом опросе состояния, и прокрутка дёргалась бы у человека под руками.
   */
  useEffect(() => {
    if (at < 0) return;
    reveal(at, activePage);
  }, [at, filled.length, reveal, activePage]);

  /*
   * Оригинал следует за чтением.
   *
   * Прокрутил текст до девятой страницы — справа девятая. Иначе сверка
   * распадается на два независимых занятия: читаешь в одном месте, листаешь в
   * другом, и держать соответствие приходится в голове.
   *
   * Обратной связи нет и быть не может: просмотрщик встроен в браузер и с
   * другого домена о своей прокрутке ничего не сообщает.
   */
  useEffect(() => {
    const node = scrollRef.current;
    if (!node || !syncScroll || filled.length === 0) return;

    let timer = 0;

    function decide() {
      if (!node) return;

      const top = node.getBoundingClientRect().top;
      let best: number | null = null;
      let nearest = Number.POSITIVE_INFINITY;

      for (const page of filled) {
        const section = node.querySelector(`#page-${page.page}`);
        if (!section) continue;

        // Насколько начало страницы отстоит от верха окна чтения.
        const distance = section.getBoundingClientRect().top - top;

        // Берём ближайшую из тех, что уже начались или вот-вот начнутся.
        if (distance <= 80 && Math.abs(distance) < nearest) {
          nearest = Math.abs(distance);
          best = page.page;
        }
      }

      if (best !== null) onOpenPage(best);
    }

    function onScroll() {
      /*
       * Ждём остановки: смена страницы перезагружает просмотрщик, и делать это
       * на каждый пиксель прокрутки — значит мигать им без остановки.
       */
      window.clearTimeout(timer);
      timer = window.setTimeout(decide, 200);
    }

    node.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      node.removeEventListener("scroll", onScroll);
      window.clearTimeout(timer);
    };
  }, [filled, onOpenPage, syncScroll]);

  const fullText = filled
    .map((page) => `— Страница ${page.page} —\n\n${page.text}`)
    .join("\n\n");

  function step(direction: number) {
    if (marks.total === 0) return;

    // Считаем от приведённого номера, а не от сырого: сырой мог уехать за край.
    const from = at < 0 ? 0 : at;
    const next = (from + direction + marks.total) % marks.total;

    setActive(next);

    /*
     * И прокручиваем сразу, не дожидаясь эффекта. Единственное совпадение в
     * документе означает, что номер не меняется, React не перерисовывает и
     * эффект не срабатывает, — а перейти к нему человек всё равно просит.
     */
    const page =
      [...marks.offsets].reverse().find((entry) => entry.offset <= next)?.page ??
      null;

    reveal(next, page);
  }

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
      <div className="flex items-center justify-center rounded-lg border border-line bg-surface/60 p-12 text-body-sm text-fg-subtle">
        Выберите файл слева.
      </div>
    );
  }

  const isRunning =
    document.ocrStatus === "pending" || document.ocrStatus === "running";
  const hasText = filled.length > 0;

  return (
    /*
     * Высоту задаёт тот, кто эту панель ставит: в режиме сверки она должна
     * совпасть с высотой оригинала, иначе колонки разъезжаются и «рядом»
     * перестаёт быть рядом.
     */
    <div className="flex h-full min-w-0 flex-col gap-3">
      {/* Шапка: имя файла, поиск по нему, действия */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-line bg-surface px-4 py-2.5">
        <h2 className="min-w-0 flex-1 truncate text-body font-medium text-fg">
          {document.title}
        </h2>

        {hasText && (
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-faint" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  step(event.shiftKey ? -1 : 1);
                }
                if (event.key === "Escape") setQuery("");
              }}
              placeholder="В этом файле"
              className="h-8 w-52 pl-8 pr-24 text-caption"
              aria-label="Найти в этом файле"
            />

            <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center">
              {terms.length > 0 && (
                <span className="mr-1 font-mono text-label uppercase text-fg-faint">
                  {marks.total === 0 ? "нет" : `${at + 1}/${marks.total}`}
                </span>
              )}
              <StepButton
                title="Предыдущее (Shift+Enter)"
                disabled={marks.total === 0}
                onClick={() => step(-1)}
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </StepButton>
              <StepButton
                title="Следующее (Enter)"
                disabled={marks.total === 0}
                onClick={() => step(1)}
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </StepButton>
            </div>
          </div>
        )}

        {canShowOriginal && (
          <IconButton
            title={showOriginal ? "Скрыть оригинал" : "Показать оригинал"}
            onClick={onToggleOriginal}
          >
            {showOriginal ? (
              <PanelRightClose className="h-3.5 w-3.5" />
            ) : (
              <PanelRightOpen className="h-3.5 w-3.5" />
            )}
          </IconButton>
        )}

        {hasText && (
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

        {document.ocrStatus !== "running" && canRetry && (
          <IconButton
            title="Распознать заново"
            onClick={() => onRetry(document.id)}
          >
            <RotateCw className="h-3.5 w-3.5" />
          </IconButton>
        )}
      </div>

      {/* Расшифровка */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-line bg-surface">
        <div
          ref={scrollRef}
          className="scrollable-area min-h-0 min-w-0 flex-1 overflow-y-auto"
        >
            {document.ocrStatus === "failed" ? (
              /*
               * Причину показываем дословно, как её записал исполнитель. Общее
               * «не удалось» отправляет человека искать наугад, а здесь причина
               * всегда конкретна: не принят ключ, файла нет в хранилище, модель
               * ответила отказом. Прочитать её больше негде — исполнитель
               * работает на другой машине.
               */
              <div className="m-5 flex flex-col gap-2 rounded border border-danger-line bg-danger-bg/60 p-3.5">
                <p className="flex items-start gap-2 text-caption font-medium leading-relaxed text-danger-fg">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Распознать не удалось
                </p>

                {job?.error ? (
                  <p className="pl-5 font-mono text-caption leading-relaxed text-danger-fg">
                    {job.error}
                  </p>
                ) : (
                  <p className="pl-5 text-caption leading-relaxed text-danger-fg">
                    Причина не записана. Загляните в журнал заданий.
                  </p>
                )}

                <p className="pl-5 text-caption leading-relaxed text-fg-subtle">
                  Исправив причину, нажмите «распознать заново».
                </p>
              </div>
            ) : isLoading && !hasText ? (
              <div className="flex h-full items-center justify-center">
                <Meta>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Читаю
                </Meta>
              </div>
            ) : !hasText ? (
              <p className="p-5 text-body-sm leading-relaxed text-fg-subtle">
                {isRunning
                  ? "Страницы дочитываются — текст появится здесь сам, по мере готовности."
                  : "Текста нет: страницы оказались пустыми."}
              </p>
            ) : (
              <div className="flex flex-col">
                {filled.map((page, position) => (
                  <section key={page.page} id={`page-${page.page}`}>
                    {/*
                      Заголовок липнет к верху при прокрутке: в длинной
                      расшифровке иначе теряется, на какой ты странице, — а это
                      главный ориентир при сверке с оригиналом.
                    */}
                    <header
                      className={cn(
                        "sticky top-0 z-10 flex items-center gap-2 border-b border-line bg-surface/95 px-5 py-2 backdrop-blur",
                        position > 0 && "border-t"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => onOpenPage(page.page)}
                        className="font-mono text-label uppercase text-fg-subtle transition-colors hover:text-fg"
                        title="Показать эту страницу в оригинале"
                      >
                        Страница {page.page}
                      </button>

                      <span
                        className={cn(
                          "rounded border px-1.5 py-0.5 font-mono text-label uppercase ",
                          page.source === "embedded"
                            ? "border-line text-fg-faint"
                            : "border-brand-line bg-brand-soft/60 text-brand-strong"
                        )}
                        title={page.model ?? undefined}
                      >
                        {describeSource(page.source)}
                      </span>

                      {openPage === page.page && showOriginal && canShowOriginal && (
                        <span className="ml-auto font-mono text-label uppercase text-warn-fg">
                          открыта в оригинале
                        </span>
                      )}
                    </header>

                    <pre className="whitespace-pre-wrap break-words px-5 py-4 font-mono text-caption leading-[1.7] text-fg-muted">
                      <HighlightedText
                        text={page.text}
                        terms={terms}
                        offset={
                          marks.offsets.find((entry) => entry.page === page.page)
                            ?.offset ?? 0
                        }
                        active={at}
                      />
                    </pre>
                  </section>
                ))}

                {isRunning && (
                  <div className="px-5 py-4">
                    <Meta>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Дочитываю остальное
                    </Meta>
                  </div>
                )}
              </div>
            )}
        </div>
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
        "flex items-center gap-1.5 font-mono text-label uppercase text-fg-subtle",
        className
      )}
    >
      {children}
    </span>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-warn-line bg-warn-bg/60 px-4 py-3 text-caption leading-relaxed text-warn-fg">
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
        "rounded p-1.5 text-fg-faint transition-colors hover:bg-surface-2 hover:text-fg",
        className
      )}
    >
      {children}
      <span className="sr-only">{title}</span>
    </button>
  );
}
