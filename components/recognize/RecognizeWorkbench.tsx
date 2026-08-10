"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
        current={
          selectedId && target
            ? { documentId: selectedId, page: target.page }
            : null
        }
      />

      {recognized.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]">
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
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />

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
          className="h-12 pl-11 pr-44 text-[14px]"
          aria-label="Поиск по распознанному тексту"
        />

        {/* Счётчик и стрелки — там же, где их ищут: справа в поле */}
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {isSearching && (
            <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin text-stone-400" />
          )}

          {hits !== null && !isSearching && (
            <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.1em] text-stone-400">
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
            className="scrollable-area flex max-h-64 flex-col divide-y divide-stone-200 overflow-y-auto rounded-lg border border-stone-200 bg-white"
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
                      isCurrent ? "bg-amber-50/70" : "hover:bg-stone-50"
                    )}
                  >
                    <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-stone-400">
                      <span className="truncate">{hit.documentTitle}</span>
                      <span className="shrink-0 text-stone-300">·</span>
                      <span className="shrink-0">стр. {hit.page}</span>
                    </span>
                    <span className="text-[13px] leading-relaxed text-stone-700">
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
      className="rounded p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-900 disabled:pointer-events-none disabled:opacity-30"
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
  /** Номер совпадения, к которому перешли стрелками. −1 — ни к какому. */
  const [active, setActive] = useState(-1);
  const [showOriginal, setShowOriginal] = useState(true);
  const [openPage, setOpenPage] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  /* Новый запрос — начинаем с первого совпадения, а не с того, где были. */
  useEffect(() => {
    setActive(marks.total > 0 ? 0 : -1);
  }, [marks.total, query]);

  /* На какой странице стоит текущее совпадение: туда же ведём и оригинал. */
  const activePage = useMemo(() => {
    if (active < 0) return null;

    const found = [...marks.offsets]
      .reverse()
      .find((entry) => entry.offset <= active);

    return found?.page ?? null;
  }, [active, marks.offsets]);

  useEffect(() => {
    if (activePage) setOpenPage(activePage);
  }, [activePage]);

  /* Прокрутка к текущему совпадению. */
  useEffect(() => {
    if (active < 0) return;

    const anchor = scrollRef.current?.querySelector(`#match-${active}`);
    anchor?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [active, pages]);

  /*
   * Переход из поиска: подставляем запрос в поле подсветки и прокручиваем к
   * найденной странице. Прокрутка ждёт, пока страницы приедут, — иначе
   * прокручивать нечего, элемента ещё нет.
   */
  useEffect(() => {
    if (!target) return;
    setQuery(target.query);
    setOpenPage(target.page);
  }, [target]);

  /*
   * Переход из поиска ведёт не к первому совпадению в файле, а к тому, что на
   * найденной странице. Иначе щелчок по «страница 12» открывал бы страницу 1 —
   * ту, где нашлось первое вхождение, — и человек оказывался бы не там, куда
   * шёл.
   */
  useEffect(() => {
    if (!target || filled.length === 0) return;

    const entry = marks.offsets.find((item) => item.page === target.page);
    if (entry) setActive(entry.offset);
  }, [target, filled.length, marks.offsets]);

  const fullText = filled
    .map((page) => `— Страница ${page.page} —\n\n${page.text}`)
    .join("\n\n");

  function step(direction: number) {
    if (marks.total === 0) return;
    setActive((current) => (current + direction + marks.total) % marks.total);
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
      <div className="flex items-center justify-center rounded-lg border border-stone-200 bg-white/60 p-12 text-[13px] text-stone-500">
        Выберите файл слева.
      </div>
    );
  }

  const isRunning =
    document.ocrStatus === "pending" || document.ocrStatus === "running";
  const hasText = filled.length > 0;
  /* Оригинал есть смысл показывать только у PDF: у картинки страниц нет. */
  const isPdf = /\.pdf$/i.test(document.title);
  const withOriginal = showOriginal && isPdf && hasText;

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {/* Шапка: имя файла, поиск по нему, действия */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-stone-200 bg-white px-4 py-2.5">
        <h2 className="min-w-0 flex-1 truncate text-[14px] font-medium tracking-[-0.01em] text-stone-900">
          {document.title}
        </h2>

        {hasText && (
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
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
              className="h-8 w-52 pl-8 pr-24 text-[12.5px]"
              aria-label="Найти в этом файле"
            />

            <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center">
              {terms.length > 0 && (
                <span className="mr-1 font-mono text-[9px] uppercase tracking-[0.1em] text-stone-400">
                  {marks.total === 0 ? "нет" : `${active + 1}/${marks.total}`}
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

        {isPdf && hasText && (
          <IconButton
            title={showOriginal ? "Скрыть оригинал" : "Показать оригинал"}
            onClick={() => setShowOriginal((value) => !value)}
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

      <div
        className={cn(
          "grid min-w-0 gap-4",
          withOriginal && "xl:grid-cols-2"
        )}
      >
        {/* Расшифровка */}
        <div className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-stone-200 bg-white">
          <div
            ref={scrollRef}
            className="scrollable-area h-[70vh] min-w-0 overflow-y-auto"
          >
            {document.ocrStatus === "failed" ? (
              /*
               * Причину показываем дословно, как её записал исполнитель. Общее
               * «не удалось» отправляет человека искать наугад, а здесь причина
               * всегда конкретна: не принят ключ, файла нет в хранилище, модель
               * ответила отказом. Прочитать её больше негде — исполнитель
               * работает на другой машине.
               */
              <div className="m-5 flex flex-col gap-2 rounded border border-red-200 bg-red-50/60 p-3.5">
                <p className="flex items-start gap-2 text-[12.5px] font-medium leading-relaxed text-red-800">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  Распознать не удалось
                </p>

                {job?.error ? (
                  <p className="pl-5 font-mono text-[12px] leading-relaxed text-red-700">
                    {job.error}
                  </p>
                ) : (
                  <p className="pl-5 text-[12.5px] leading-relaxed text-red-700">
                    Причина не записана. Загляните в журнал заданий.
                  </p>
                )}

                <p className="pl-5 text-[12px] leading-relaxed text-stone-500">
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
              <p className="p-5 text-[13px] leading-relaxed text-stone-500">
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
                        "sticky top-0 z-10 flex items-center gap-2 border-b border-stone-200 bg-white/95 px-5 py-2 backdrop-blur",
                        position > 0 && "border-t"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenPage(page.page)}
                        className="font-mono text-[10px] uppercase tracking-[0.12em] text-stone-500 transition-colors hover:text-stone-900"
                        title="Показать эту страницу в оригинале"
                      >
                        Страница {page.page}
                      </button>

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

                      {openPage === page.page && withOriginal && (
                        <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.1em] text-amber-700">
                          показана справа
                        </span>
                      )}
                    </header>

                    <pre className="whitespace-pre-wrap break-words px-5 py-4 font-mono text-[12.5px] leading-[1.7] text-stone-700">
                      <HighlightedText
                        text={page.text}
                        terms={terms}
                        offset={
                          marks.offsets.find((entry) => entry.page === page.page)
                            ?.offset ?? 0
                        }
                        active={active}
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

        {/* Оригинал */}
        {withOriginal && (
          <div className="hidden h-[70vh] min-w-0 xl:block">
            <OriginalPane
              documentId={document.id}
              title={document.title}
              page={openPage}
            />
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
