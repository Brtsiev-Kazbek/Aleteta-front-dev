"use client";

import { AlertTriangle, Check, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Document } from "@/types";

/**
 * Состояние распознавания в строке файла.
 *
 * Показываем страницы, а не проценты: «страница 12 из 18» человек понимает
 * сразу, а «67 %» ничего не говорит о том, сколько ещё ждать. Это же
 * единственный честный способ показать ход дела — числа приходят с сервера по
 * мере записи страниц, а не рисуются по таймеру.
 *
 * Отдельный смысл у источника текста. «Текст из файла» означает, что документ
 * набран в редакторе и распознавание не понадобилось вовсе, то есть не стоило
 * ничего. Юристу это знать незачем, а тому, кто платит за подписку, — очень
 * даже.
 */
export function RecognitionStatus({
  document,
  onRetry,
}: {
  document: Document;
  onRetry?: () => void;
}) {
  const status = document.ocrStatus;

  // У встроенного набора распознавания нет — показывать нечего.
  if (!status) return null;

  if (status === "pending") {
    return <Badge tone="quiet">В очереди</Badge>;
  }

  if (status === "running") {
    const done = document.pagesDone ?? 0;
    const total = document.pageCount;

    return (
      <Badge tone="active">
        <Loader2 className="h-3 w-3 animate-spin" />
        {total ? `Страница ${Math.min(done + 1, total)} из ${total}` : "Читаю"}
      </Badge>
    );
  }

  if (status === "failed") {
    return (
      <Badge tone="alarm" onClick={onRetry} title="Попробовать ещё раз">
        <AlertTriangle className="h-3 w-3" />
        Не распознан
      </Badge>
    );
  }

  return (
    <Badge tone="quiet">
      <Check className="h-3 w-3 text-ok-fg" />
      {describeSource(document)}
    </Badge>
  );
}

/** Откуда взялся текст — человеческими словами. */
function describeSource(document: Document): string {
  const pages = document.pageCount ?? document.pagesDone ?? 0;
  const suffix = pages > 1 ? `, ${pages} с.` : "";

  switch (document.textSource) {
    case "embedded":
      return `Текст из файла${suffix}`;
    case "reused":
      return `Текст взят из копии${suffix}`;
    case "mixed":
      return `Распознан частично${suffix}`;
    default:
      return `Распознан${suffix}`;
  }
}

function Badge({
  children,
  tone,
  onClick,
  title,
}: {
  children: React.ReactNode;
  tone: "quiet" | "active" | "alarm";
  onClick?: () => void;
  title?: string;
}) {
  const className = cn(
    "hidden shrink-0 items-center gap-1.5 rounded border px-2 py-1 font-mono text-label uppercase sm:inline-flex",
    tone === "quiet" && "border-line text-fg-subtle",
    tone === "active" && "border-brand-line bg-brand-soft/60 text-brand-strong",
    tone === "alarm" && "border-danger-line text-danger-fg",
    onClick && "transition-colors hover:border-fg-faint hover:text-fg"
  );

  if (!onClick) return <span className={className}>{children}</span>;

  return (
    <button type="button" onClick={onClick} title={title} className={className}>
      {children}
    </button>
  );
}
