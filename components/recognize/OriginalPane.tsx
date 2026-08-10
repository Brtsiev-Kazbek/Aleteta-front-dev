"use client";

import { useEffect, useState } from "react";
import { ExternalLink, FileWarning, Loader2 } from "lucide-react";

import { createDocumentUrlAction } from "@/app/actions/documents";
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
 * ССЫЛКА ВРЕМЕННАЯ. Бакет закрытый, постоянного адреса у файла нет: сервер
 * выдаёт подписанную ссылку на час. Поэтому запрашиваем её при открытии файла,
 * а не держим в состоянии документа.
 */
export function OriginalPane({
  documentId,
  title,
  page,
}: {
  documentId: string;
  title: string;
  /** Какую страницу показать. Меняется при переходе по совпадениям. */
  page: number;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setUrl(null);
    setError(null);

    void createDocumentUrlAction(documentId).then((result) => {
      if (cancelled) return;

      if (!result.ok || !result.data) {
        log.warn("url", {
          документ: shortId(documentId),
          ошибка: result.error ?? "ссылки нет",
        });
        setError(result.error ?? "Не удалось получить ссылку на файл.");
        return;
      }

      setUrl(result.data);
    });

    return () => {
      cancelled = true;
    };
  }, [documentId]);

  if (error) {
    return (
      <Frame>
        <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
          <FileWarning className="h-5 w-5 text-stone-300" />
          <p className="text-[13px] text-stone-900">Оригинал не открылся</p>
          <p className="max-w-xs text-[12.5px] leading-relaxed text-stone-500">
            {error}
          </p>
        </div>
      </Frame>
    );
  }

  if (!url) {
    return (
      <Frame>
        <div className="flex h-full items-center justify-center gap-2 text-[12.5px] text-stone-500">
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
  const source = `${url}#page=${page}&view=FitH&toolbar=1`;

  return (
    <Frame>
      <iframe
        key={source}
        src={source}
        title={`Оригинал: ${title}`}
        className="h-full w-full"
      />

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute right-2 top-2 flex items-center gap-1.5 rounded border border-stone-200 bg-white/90 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-stone-500 backdrop-blur transition-colors hover:text-stone-900"
      >
        Открыть отдельно
        <ExternalLink className="h-3 w-3" />
      </a>
    </Frame>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-full min-h-[24rem] overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
      {children}
    </div>
  );
}
