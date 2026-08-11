"use client";

import { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileWarning,
  Link2,
  Link2Off,
  Loader2,
} from "lucide-react";

import { createDocumentUrlAction } from "@/app/actions/documents";
import { cn } from "@/lib/utils";
import { createLogger, shortId } from "@/lib/logger";

const log = createLogger("original");

/**
 * Оригинал файла рядом с расшифровкой.
 *
 * Смысл не в красоте. Распознанное надо сверять — особенно номера, суммы и
 * даты, — а сверять по памяти нельзя. Пока оригинал лежал в хранилище, сверка
 * означала «скачай файл, открой в просмотрщике, найди страницу двенадцать».
 * Теперь она означает «посмотри направо».
 *
 * ПОЧЕМУ ВСТРОЕННЫЙ ПРОСМОТРЩИК, А НЕ СВОЙ. Браузер умеет показывать PDF сам и
 * умеет открывать его на нужной странице — `#page=12`. Свой просмотрщик на
 * канве означал бы второй экземпляр движка PDF в приложении: полтора мегабайта
 * в браузер ради того, что уже есть. Плата за встроенный — управлять им можно
 * только адресом, а не кодом; для сверки этого достаточно.
 *
 * ПОЧЕМУ ФАЙЛ СКАЧИВАЕТСЯ ЦЕЛИКОМ. Переход на другую страницу меняет адрес, а
 * смена адреса перезагружает просмотрщик. По сети это означало бы качать
 * двадцать мегабайт на каждое нажатие стрелки — при массовом поиске, ради
 * которого всё и делается, это невыносимо. Скачанный один раз файл живёт в
 * памяти вкладки, и переходы становятся мгновенными.
 */
export function OriginalPane({
  documentId,
  title,
  page,
  pageCount,
  onPageChange,
  syncScroll,
  onToggleSync,
}: {
  documentId: string;
  title: string;
  /** Какую страницу показать. Меняется при переходе по совпадениям. */
  page: number;
  pageCount: number | null;
  onPageChange: (page: number) => void;
  /** Следовать за прокруткой текста. */
  syncScroll: boolean;
  onToggleSync: () => void;
}) {
  /** Ссылка на скачивание — подписанная, живёт час. */
  const [link, setLink] = useState<string | null>(null);
  /** Тот же файл, уже в памяти вкладки: по нему листаем без сети. */
  const [local, setLocal] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;

    setLink(null);
    setLocal(null);
    setError(null);

    void (async () => {
      const result = await createDocumentUrlAction(documentId);

      if (cancelled) return;

      if (!result.ok || !result.data) {
        log.warn("url", {
          документ: shortId(documentId),
          ошибка: result.error ?? "ссылки нет",
        });
        setError(result.error ?? "Не удалось получить ссылку на файл.");
        return;
      }

      setLink(result.data);

      try {
        const response = await fetch(result.data);
        if (!response.ok) throw new Error(`хранилище ответило ${response.status}`);

        const blob = await response.blob();
        if (cancelled) return;

        objectUrl = URL.createObjectURL(blob);
        setLocal(objectUrl);

        log.debug("loaded", {
          документ: shortId(documentId),
          байт: blob.size,
        });
      } catch (caught) {
        if (cancelled) return;

        /*
         * Не скачался — не беда: покажем по подписанной ссылке. Листать будет
         * медленнее, но работать будет.
         */
        log.warn("blob", {
          документ: shortId(documentId),
          ошибка: caught instanceof Error ? caught.message : String(caught),
        });
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [documentId]);

  const source = local ?? link;

  if (error) {
    return (
      <Frame page={page} pageCount={pageCount} onPageChange={onPageChange} link={null} syncScroll={syncScroll} onToggleSync={onToggleSync}>
        <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
          <FileWarning className="h-5 w-5 text-fg-ghost" />
          <p className="text-body text-fg">Оригинал не открылся</p>
          <p className="max-w-xs text-caption leading-relaxed text-fg-subtle">
            {error}
          </p>
        </div>
      </Frame>
    );
  }

  if (!source) {
    return (
      <Frame page={page} pageCount={pageCount} onPageChange={onPageChange} link={null} syncScroll={syncScroll} onToggleSync={onToggleSync}>
        <div className="flex h-full items-center justify-center gap-2 text-caption text-fg-subtle">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Открываю оригинал
        </div>
      </Frame>
    );
  }

  /*
   * Номер страницы стоит в якоре, а не в параметрах: так его понимает встроенный
   * просмотрщик. `key` меняется вместе со страницей нарочно — иначе браузер
   * оставит открытым то, что уже показывает, и переход по совпадению никуда не
   * приведёт.
   */
  const address = `${source}#page=${page}&view=FitH`;

  return (
    <Frame page={page} pageCount={pageCount} onPageChange={onPageChange} link={link} syncScroll={syncScroll} onToggleSync={onToggleSync}>
      <iframe key={address} src={address} title={`Оригинал: ${title}`} className="h-full w-full" />
    </Frame>
  );
}

/** Рамка с шапкой: номер страницы, листалка, ссылка на отдельное окно. */
function Frame({
  children,
  page,
  pageCount,
  onPageChange,
  link,
  syncScroll,
  onToggleSync,
}: {
  children: React.ReactNode;
  page: number;
  pageCount: number | null;
  onPageChange: (page: number) => void;
  link: string | null;
  syncScroll: boolean;
  onToggleSync: () => void;
}) {
  const last = pageCount ?? page;

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-line bg-surface">
      <div className="flex shrink-0 items-center gap-2 border-b border-line px-4 py-2.5">
        <span className="font-mono text-label uppercase text-fg-subtle">
          Оригинал
        </span>

        {/*
          Связь с текстом видно сразу: включена — оригинал сам идёт за чтением,
          выключена — листается отдельно. Без пометки человек не понимает, почему
          страница «сама переехала».
        */}
        <button
          type="button"
          onClick={onToggleSync}
          title={
            syncScroll
              ? "Следует за текстом — выключить"
              : "Листается отдельно — связать с текстом"
          }
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-2 py-1 font-mono text-label uppercase transition-colors",
            syncScroll
              ? "border-warn-line bg-warn-bg text-warn-fg"
              : "border-line text-fg-faint hover:text-fg"
          )}
        >
          {syncScroll ? (
            <Link2 className="h-3 w-3" />
          ) : (
            <Link2Off className="h-3 w-3" />
          )}
          {syncScroll ? "за текстом" : "отдельно"}
        </button>

        <div className="ml-auto flex items-center gap-1">
          <PageStep
            title="Предыдущая страница"
            disabled={page <= 1}
            onClick={() => onPageChange(Math.max(1, page - 1))}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </PageStep>

          <span className="min-w-[4.5rem] text-center font-mono text-label uppercase text-fg-subtle tabular-nums">
            {page}
            {pageCount ? ` из ${pageCount}` : ""}
          </span>

          <PageStep
            title="Следующая страница"
            disabled={pageCount !== null && page >= last}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </PageStep>

          {link && (
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              title="Открыть в отдельном окне"
              className="ml-1 rounded-xl p-1.5 text-fg-faint transition-colors hover:bg-surface-2 hover:text-fg"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="sr-only">Открыть в отдельном окне</span>
            </a>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 bg-surface-2">{children}</div>
    </div>
  );
}

function PageStep({
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
      className="rounded-xl p-1.5 text-fg-faint transition-colors hover:bg-surface-2 hover:text-fg disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
      <span className="sr-only">{title}</span>
    </button>
  );
}
