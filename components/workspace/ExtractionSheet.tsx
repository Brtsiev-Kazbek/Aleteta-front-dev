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
export function ExtractionSheet() {
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

  // Без разбираемого файла шторке нечего показывать — не открываем её пустой.
  return (
    <Sheet open={isOpen && extraction !== null} onOpenChange={setOpen}>
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

        {extraction && (
          <>
            {/* Исходный файл */}
            <div className="flex shrink-0 items-center gap-2.5 border-b border-stone-200 px-5 py-3.5">
              <FileText className="h-3.5 w-3.5 shrink-0 text-stone-300" />
              <span className="min-w-0 flex-1 truncate text-[13px] text-stone-700">
                {extraction.file.name}
              </span>
              <span className="shrink-0 font-mono text-[10px] text-stone-400">
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
                <div className="mt-5 rounded border border-red-200 bg-red-50/70 px-3.5 py-3">
                  <div className="flex items-start gap-2">
                    <XCircle className="mt-px h-3.5 w-3.5 shrink-0 text-red-500" />
                    <p className="text-[12.5px] leading-relaxed text-red-900">
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
                    <p className="mt-3 text-[12.5px] leading-relaxed text-stone-500">
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
                              ? "border-amber-200 bg-amber-50/60"
                              : "border-stone-200 bg-white"
                          )}
                        >
                          <span className="flex shrink-0 flex-col">
                            <span className="text-[11px] text-stone-400">
                              {field.label}
                            </span>
                            {field.page != null && (
                              <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-stone-300">
                                стр. {field.page}
                              </span>
                            )}
                          </span>

                          <span className="flex min-w-0 items-center gap-1.5">
                            {field.uncertain && (
                              <AlertTriangle className="h-3 w-3 shrink-0 text-amber-600" />
                            )}
                            <span className="min-w-0 truncate text-right text-[13px] text-stone-900">
                              {field.value}
                            </span>
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {uncertainCount > 0 && (
                    <p className="mt-3 text-[11px] leading-relaxed text-stone-500">
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
                        className="rounded border border-stone-200 px-2 py-1 text-[11px] text-stone-500"
                      >
                        {schema?.fields.find((field) => field.key === key)
                          ?.label ?? key}
                      </span>
                    ))}
                  </div>
                  <p className="mt-2.5 text-[11px] leading-relaxed text-stone-500">
                    Эти поля остались пустыми: модель их в тексте не увидела и
                    не стала додумывать.
                  </p>
                </div>
              )}
            </ScrollArea>

            <div className="flex shrink-0 items-center gap-2 border-t border-stone-200 px-5 py-4">
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
                <span className="flex flex-1 items-center gap-2 text-[12.5px] text-stone-500">
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
                  ? "bg-emerald-100 text-emerald-600"
                  : isCurrent
                    ? "bg-stone-900 text-white"
                    : "bg-stone-100 text-stone-300"
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
                "text-[13px] transition-colors",
                isStepDone
                  ? "text-stone-400"
                  : isCurrent
                    ? "text-stone-900"
                    : "text-stone-300"
              )}
            >
              {step.label}
            </span>

            {isCurrent && progress > 0 && progress < 100 && (
              <span className="ml-auto font-mono text-[10px] tabular-nums text-stone-400">
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
        full ? "border-stone-200 bg-stone-50" : "border-amber-200 bg-amber-50/60"
      )}
    >
      <ScanLine
        className={cn(
          "mt-px h-3.5 w-3.5 shrink-0",
          full ? "text-stone-400" : "text-amber-600"
        )}
      />
      <p className="text-[12px] leading-relaxed text-stone-600">
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
