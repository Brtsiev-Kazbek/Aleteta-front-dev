"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  FileText,
  Loader2,
  RotateCcw,
  ScanLine,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { MetaLabel } from "@/components/layout/PanelHeading";
import { cn, formatFileSize, plural } from "@/lib/utils";
import { findSchema } from "@/lib/validation";
import { useAppStore } from "@/store/useAppStore";

/**
 * Разбор файла: что нашла модель и что из этого попало в карточку.
 *
 * Настоящая работа, а не показ: задание стоит в очереди на сервере, его
 * выполняет исполнитель, и карточка объекта создаётся в базе. Отсюда три вещи,
 * которых не бывает у имитации.
 *
 * ПЕРВОЕ: у ожидания нет заранее известной длины. Задание может минуту стоять в
 * очереди и полминуты считаться — рисовать красивую полоску «осталось три
 * секунды» здесь значит врать. Показываем то, что известно: в очереди задание
 * или уже читается, и сколько процентов сделано, если исполнитель это сказал.
 *
 * ВТОРОЕ: работа может не получиться. Причину показываем дословно, как её
 * записал исполнитель. «Что-то пошло не так» в юридическом продукте бесполезно:
 * человек не может ни исправить, ни решить, стоит ли повторять.
 *
 * ТРЕТЬЕ: карточка создаётся сразу, без кнопки «перенести». Подтверждать до
 * того, как увидел значения в их собственной таблице, нечего; а неуверенные
 * значения там подсвечены — и это честнее, чем список в шторке, который
 * закроется и забудется.
 */
export function ExtractionSheet({ caseId }: { caseId: string }) {
  const isOpen = useAppStore((state) => state.isExtractionOpen);
  const setOpen = useAppStore((state) => state.setExtractionOpen);
  const extraction = useAppStore((state) => state.extraction);
  const retry = useAppStore((state) => state.retryExtraction);
  const schemas = useAppStore((state) => state.entitySchemas);
  const setActiveTab = useAppStore((state) => state.setActiveTab);

  const schema = extraction
    ? findSchema(schemas, extraction.typeId)
    : null;

  const isDone = extraction?.status === "done";
  const isFailed = extraction?.status === "failed";
  const uncertainCount =
    extraction?.fields.filter((field) => field.uncertain).length ?? 0;

  /*
   * Разбор принадлежит своему делу. Состояние живёт в сторе и переход на другое
   * дело его не гасит — задание-то идёт. Но показывать здесь чужой разбор
   * нельзя: «Открыть карточку» увело бы на матрицу этого дела, где созданной
   * карточки нет.
   */
  const isMine = extraction?.caseId === caseId;

  // Без разбираемого файла шторке нечего показывать — не открываем её пустой.
  return (
    <Sheet open={isOpen && isMine} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader>
          <MetaLabel>Извлечение реквизитов</MetaLabel>
          <SheetTitle>
            {isFailed
              ? "Разбор не удался"
              : isDone
                ? "Реквизиты в карточке"
                : "Читаем документ"}
          </SheetTitle>
          <SheetDescription>
            {isFailed
              ? "Ничего не сохранено. Причина ниже — по ней видно, повторять или чинить."
              : isDone
                ? `Карточка «${schema?.label ?? "объект"}» создана. Проверьте значения — те, в которых модель не уверена, подсвечены.`
                : "Задание выполняет исполнитель на сервере. Окно можно закрыть — работа не прервётся."}
          </SheetDescription>
        </SheetHeader>

        {extraction && isMine && (
          <>
            {/* Исходный файл */}
            <div className="flex shrink-0 items-center gap-2.5 border-b border-line px-5 py-3.5">
              <FileText className="h-3.5 w-3.5 shrink-0 text-fg-ghost" />
              <span className="min-w-0 flex-1 truncate text-body text-fg-muted">
                {extraction.file.name}
              </span>
              <span className="shrink-0 font-mono text-label text-fg-faint">
                {formatFileSize(extraction.file.sizeBytes)}
              </span>
            </div>

            <ScrollArea className="min-h-0 flex-1 px-5 py-5">
              <Progress
                status={extraction.status}
                progress={extraction.progress}
                typeLabel={schema?.label ?? "объект"}
              />

              {/* Причина неудачи — дословно, как её записал исполнитель */}
              {isFailed && extraction.error && (
                <div className="mt-5 rounded border border-danger-line bg-danger-bg/70 px-3.5 py-3">
                  <div className="flex items-start gap-2">
                    <XCircle className="mt-px h-3.5 w-3.5 shrink-0 text-danger-fg" />
                    <p className="text-caption leading-relaxed text-danger-fg">
                      {extraction.error}
                    </p>
                  </div>
                </div>
              )}

              {/* Сколько документа посмотрели */}
              {isDone &&
                extraction.pagesLooked !== null &&
                extraction.pagesTotal !== null && (
                  <PagesNote
                    looked={extraction.pagesLooked}
                    total={extraction.pagesTotal}
                  />
                )}

              {/* Найденные реквизиты */}
              {isDone && (
                <div className="mt-6">
                  <MetaLabel>
                    → {schema?.label ?? "Карточка объекта"}
                  </MetaLabel>

                  {extraction.fields.length === 0 ? (
                    <p className="mt-3 text-caption leading-relaxed text-fg-subtle">
                      Ни одного реквизита в документе не нашлось. Карточка
                      создана пустой — заполните её руками или попробуйте
                      другой тип объекта.
                    </p>
                  ) : (
                    <div className="mt-3 flex flex-col gap-2">
                      {extraction.fields.map((field, index) => (
                        <motion.div
                          key={field.key}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.26, delay: index * 0.06 }}
                          className={cn(
                            "flex items-center justify-between gap-3 rounded border px-3 py-2.5",
                            field.uncertain
                              ? "border-warn-line bg-warn-bg/60"
                              : "border-line bg-surface"
                          )}
                        >
                          <span className="flex shrink-0 flex-col">
                            <span className="text-label text-fg-faint">
                              {field.label}
                            </span>
                            {field.page != null && (
                              <span className="font-mono text-label uppercase text-fg-ghost">
                                стр. {field.page}
                              </span>
                            )}
                          </span>

                          <span className="flex min-w-0 items-center gap-1.5">
                            {field.uncertain && (
                              <AlertTriangle className="h-3 w-3 shrink-0 text-warn-fg" />
                            )}
                            <span className="min-w-0 truncate text-right text-body text-fg">
                              {field.value}
                            </span>
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {uncertainCount > 0 && (
                    <p className="mt-3 text-label leading-relaxed text-fg-subtle">
                      {uncertainCount}{" "}
                      {plural(
                        uncertainCount,
                        "значение распознано",
                        "значения распознаны",
                        "значений распознаны"
                      )}{" "}
                      неуверенно —{" "}
                      {plural(
                        uncertainCount,
                        "оно подсвечено",
                        "они подсвечены",
                        "они подсвечены"
                      )}{" "}
                      и в таблице. Подсветка снимется, как только вы поправите
                      значение.
                    </p>
                  )}
                </div>
              )}

              {/* Чего в документе не нашлось */}
              {isDone && extraction.missing.length > 0 && (
                <div className="mt-6">
                  <MetaLabel>Не нашлось в документе</MetaLabel>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {extraction.missing.map((key) => (
                      <span
                        key={key}
                        className="rounded border border-line px-2 py-1 text-label text-fg-subtle"
                      >
                        {schema?.fields.find((field) => field.key === key)
                          ?.label ?? key}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2.5 text-label leading-relaxed text-fg-subtle">
                    Эти поля остались пустыми: модель их в тексте не увидела и
                    не стала додумывать.
                  </p>
                </div>
              )}
            </ScrollArea>

            <div className="flex shrink-0 items-center gap-2 border-t border-line px-5 py-4">
              {isFailed ? (
                <Button className="flex-1 gap-1.5" onClick={() => void retry()}>
                  <RotateCcw className="h-3.5 w-3.5" />
                  Попробовать снова
                </Button>
              ) : isDone ? (
                <Button
                  variant="outline"
                  className="flex-1 gap-1.5"
                  onClick={() => {
                    setActiveTab("entities");
                    setOpen(false);
                  }}
                >
                  Открыть карточку
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <span className="flex flex-1 items-center gap-2 text-caption text-fg-subtle">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Можно закрыть — работа продолжится
                </span>
              )}

              <Button variant="outline" onClick={() => setOpen(false)}>
                Закрыть
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Ход работы — три состояния, а не выдуманная полоска.
 *
 * «В очереди» и «читается» различает исполнитель, и различие настоящее: в
 * первом случае ждать нечего от нас, во втором работа идёт. Процент показываем
 * только тогда, когда он есть; у одного вызова модели его не бывает, и рисовать
 * ползущую от нуля полоску значило бы придумывать.
 */
function Progress({
  status,
  progress,
  typeLabel,
}: {
  status: "queued" | "running" | "done" | "failed";
  progress: number;
  typeLabel: string;
}) {
  const steps: { key: string; label: string }[] = [
    { key: "queued", label: "Задание в очереди" },
    { key: "running", label: `Модель ищет реквизиты «${typeLabel}»` },
    { key: "done", label: "Карточка создана" },
  ];

  const reached =
    status === "done" ? 3 : status === "running" ? 1 : status === "failed" ? -1 : 0;

  return (
    <ol className="flex flex-col gap-3">
      {steps.map((step, index) => {
        const isStepDone = reached > index;
        const isCurrent = reached === index;

        return (
          <li key={step.key} className="flex items-center gap-2.5">
            <span
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors",
                isStepDone
                  ? "bg-ok-bg text-ok-fg"
                  : isCurrent
                    ? "bg-fg text-inverse-fg"
                    : "bg-surface-2 text-fg-ghost"
              )}
            >
              {isStepDone ? (
                <Check className="h-2.5 w-2.5" strokeWidth={3} />
              ) : isCurrent ? (
                <Loader2 className="h-2.5 w-2.5 animate-spin" />
              ) : (
                <span className="h-1 w-1 rounded-full bg-current" />
              )}
            </span>

            <span
              className={cn(
                "text-body transition-colors",
                isStepDone
                  ? "text-fg-faint"
                  : isCurrent
                    ? "text-fg"
                    : "text-fg-ghost"
              )}
            >
              {step.label}
            </span>

            {isCurrent && progress > 0 && progress < 100 && (
              <span className="ml-auto font-mono text-label tabular-nums text-fg-faint">
                {progress}%
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Сколько страниц модель успела посмотреть.
 *
 * Длинный документ уходит в модель не целиком: реквизиты живут в начале, а
 * сорок листов приложений стоят денег и времени. Умолчать об этом нельзя —
 * иначе пустое поле выглядит как «в документе этого нет», хотя нужное могло
 * лежать на сороковой странице.
 */
function PagesNote({ looked, total }: { looked: number; total: number }) {
  const full = looked >= total;

  return (
    <div
      className={cn(
        "mt-5 flex items-start gap-2 rounded border px-3.5 py-2.5",
        full ? "border-line bg-bg" : "border-warn-line bg-warn-bg/60"
      )}
    >
      <ScanLine
        className={cn(
          "mt-px h-3.5 w-3.5 shrink-0",
          full ? "text-fg-faint" : "text-warn-fg"
        )}
      />
      <p className="text-caption leading-relaxed text-fg-soft">
        {full ? (
          <>
            Просмотрен весь документ — {total}{" "}
            {plural(total, "страница", "страницы", "страниц")}.
          </>
        ) : (
          <>
            Просмотрены первые {looked}{" "}
            {plural(looked, "страница", "страницы", "страниц")} из {total}.
            Дальше модель не читала: реквизиты почти всегда в начале, а весь
            документ целиком стоил бы заметно дороже. Если нужного поля не
            хватает — заполните его руками.
          </>
        )}
      </p>
    </div>
  );
}
