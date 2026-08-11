"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowData,
} from "@tanstack/react-table";
import { motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Copy,
  Inbox,
  MapPinned,
  MoreHorizontal,
  Plus,
  Shapes,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CustomSchemaDialog } from "@/components/workspace/CustomSchemaDialog";
import { cn, plural } from "@/lib/utils";
import {
  findFirstInvalidCell,
  findSchema,
  validateEntity,
  type EntityValidation,
} from "@/lib/validation";
import { useAppStore } from "@/store/useAppStore";
import type { Entity, EntityFieldSchema, EntitySchema } from "@/types";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    width: number;
    stickyLeft?: number;
  }
}

/** Иконки встроенных типов; у пользовательских — универсальная. */
const TYPE_ICONS: Record<string, LucideIcon> = {
  real_estate: MapPinned,
  legal_entity: Building2,
  individual: UserRound,
};

function getTypeIcon(schema: EntitySchema): LucideIcon {
  return TYPE_ICONS[schema.id] ?? Shapes;
}

export function BatchGenerationGrid({ caseId }: { caseId: string }) {
  // Выбираем стабильную ссылку и фильтруем локально: селектор, возвращающий
  // новый массив, заставлял бы грид перерисовываться на любое изменение стора.
  const allEntities = useAppStore((state) => state.entities);
  const entitySchemas = useAppStore((state) => state.entitySchemas);
  const addEntity = useAppStore((state) => state.addEntity);
  const setEditingCell = useAppStore((state) => state.setEditingCell);
  const startGeneration = useAppStore((state) => state.startGeneration);
  const setCustomSchemaOpen = useAppStore((state) => state.setCustomSchemaOpen);

  const entities = useMemo(
    () => allEntities.filter((entity) => entity.caseId === caseId),
    [allEntities, caseId]
  );

  /*
   * Склейки со встроенными типами из кода здесь больше нет: список из стора
   * уже содержит все типы, какие есть, — с базой они приходят из неё, без базы
   * подставляются те же встроенные. Склейка давала бы каждый встроенный тип
   * дважды и с разными идентификаторами.
   */
  const availableSchemas = entitySchemas;

  /** Валидация по каждой сущности с учётом её собственной схемы. */
  const validations = useMemo(() => {
    const map: Record<string, EntityValidation> = {};
    for (const entity of entities) {
      map[entity.id] = validateEntity(
        entity,
        findSchema(entitySchemas, entity.type)
      );
    }
    return map;
  }, [entities, entitySchemas]);

  /**
   * Сущности разных типов имеют разные реквизиты, поэтому одна общая таблица
   * не подходит — группируем по типу и рисуем свою таблицу на каждую группу.
   */
  const groups = useMemo(() => {
    const buckets = new Map<string, Entity[]>();
    for (const entity of entities) {
      const bucket = buckets.get(entity.type);
      if (bucket) bucket.push(entity);
      else buckets.set(entity.type, [entity]);
    }

    return [...buckets.entries()].map(([typeId, items]) => ({
      // typeId, а не schema.id: неизвестные типы откатываются к одной и той же
      // запасной схеме, и ключи React стали бы одинаковыми.
      typeId,
      schema: findSchema(entitySchemas, typeId),
      entities: items,
    }));
  }, [entities, entitySchemas]);

  const stats = useMemo(() => {
    const valid = entities.filter(
      (entity) => validations[entity.id]?.isValid
    ).length;
    const errorFields = entities.reduce(
      (sum, entity) =>
        sum + Object.keys(validations[entity.id]?.fieldErrors ?? {}).length,
      0
    );
    return {
      valid,
      total: entities.length,
      allValid: entities.length > 0 && valid === entities.length,
      errorFields,
    };
  }, [entities, validations]);

  function jumpToFirstError() {
    const target = findFirstInvalidCell(entities, entitySchemas);
    if (target) setEditingCell(target);
  }

  return (
    /*
     * Плотная поверхность: строка ниже, чем в читательской части приложения.
     * Дело на сорок объектов должно помещаться на экран целиком — ради этого
     * таблица и делалась.
     */
    <div
      data-density="compact"
      className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-line bg-surface shadow-card"
    >
      {/* Панель над таблицей */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="flex flex-col">
          <span className="font-mono text-label uppercase text-fg-faint">
            Объекты дела
          </span>
          <span className="mt-1 text-body-sm text-fg-subtle">
            Реквизиты подставляются в шаблоны при генерации пакета
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="h-9 gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Добавить объект
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel className="font-mono text-label uppercase text-fg-faint">
              Тип объекта
            </DropdownMenuLabel>

            {availableSchemas.map((schema) => {
              const Icon = getTypeIcon(schema);
              return (
                <DropdownMenuItem
                  key={schema.id}
                  onSelect={() => addEntity(caseId, schema.id)}
                  className="items-start gap-2.5 py-2.5"
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-fg-faint" />
                  <span className="flex min-w-0 flex-col">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate font-medium">
                        {schema.label}
                      </span>
                      {schema.isCustom && (
                        <span className="shrink-0 font-mono text-label uppercase text-brand">
                          свой
                        </span>
                      )}
                    </span>
                    <span className="truncate text-caption text-fg-faint">
                      {schema.hint}
                    </span>
                  </span>
                </DropdownMenuItem>
              );
            })}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onSelect={() => setCustomSchemaOpen(true)}
              className="items-start gap-2.5 py-2.5"
            >
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <span className="flex min-w-0 flex-col">
                <span className="font-medium">Создать свой тип</span>
                <span className="truncate text-caption text-fg-faint">
                  Появится в списке во всех делах
                </span>
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/*
        `relative` обязателен: sticky-ячейки позиционируются относительно
        ближайшего positioned-предка, иначе ширина таблицы протекает
        в горизонтальный скролл всей страницы.
      */}
      <div className="scrollable-area relative min-h-0 flex-1 overflow-auto">
        {entities.length === 0 ? (
          <div className="flex h-full min-h-[260px] flex-col items-center justify-center gap-2.5 p-10 text-center">
            <Inbox className="h-5 w-5 text-fg-ghost" />
            <p className="mt-1 text-body text-fg">
              В деле пока нет объектов
            </p>
            <p className="max-w-sm text-body-sm leading-relaxed text-fg-subtle">
              Добавьте участок, контрагента или сотрудника, опишите свой тип —
              либо загрузите файл во вкладке «Документы», и реквизиты
              перенесутся сюда сами.
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {groups.map((group) => (
              <EntityGroupTable
                key={group.typeId}
                schema={group.schema}
                entities={group.entities}
                validations={validations}
              />
            ))}
          </div>
        )}
      </div>

      {/* Липкая панель готовности и запуска генерации */}
      <div className="shrink-0 border-t border-line bg-surface/95 backdrop-blur">
        {/* Полоса готовности — состояние видно раньше, чем прочитан текст */}
        <div className="h-px w-full bg-surface-3">
          <motion.div
            animate={{
              width: `${
                stats.total === 0 ? 0 : (stats.valid / stats.total) * 100
              }%`,
            }}
            transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
            className={cn(
              "h-px",
              stats.allValid ? "bg-ok" : "bg-fg"
            )}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            {stats.allValid ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-ok-fg" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 text-danger-fg" />
            )}

            <div className="flex flex-col leading-tight">
              <span className="font-mono text-body-sm tabular-nums text-fg">
                {stats.valid} / {stats.total}
                <span className="ml-2 font-sans text-body-sm text-fg-subtle">
                  готово к генерации
                </span>
              </span>
              <span className="mt-0.5 font-mono text-label uppercase text-fg-faint">
                {stats.allValid
                  ? "Все обязательные реквизиты заполнены"
                  : `${stats.errorFields} ${plural(
                      stats.errorFields,
                      "поле требует",
                      "поля требуют",
                      "полей требуют"
                    )} заполнения`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!stats.allValid && stats.total > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={jumpToFirstError}
                className="h-9 gap-1.5 border-danger-line text-danger-fg hover:border-danger-line hover:bg-danger-bg hover:text-danger-fg"
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                К первой ошибке
              </Button>
            )}

            {stats.allValid ? (
              <Button
                size="sm"
                className="h-9 gap-1.5"
                onClick={() => startGeneration(caseId)}
              >
                <Sparkles className="h-4 w-4" />
                Сгенерировать пакет
              </Button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span tabIndex={0} className="inline-block">
                    <Button
                      size="sm"
                      disabled
                      className="pointer-events-none h-9 gap-1.5"
                    >
                      <Sparkles className="h-4 w-4" />
                      Сгенерировать пакет
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">
                  Заполните обязательные поля у всех объектов
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </div>

      <CustomSchemaDialog caseId={caseId} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ТАБЛИЦА ОДНОЙ ГРУППЫ (один тип сущности = свой набор колонок)      */
/* ------------------------------------------------------------------ */

function EntityGroupTable({
  schema,
  entities,
  validations,
}: {
  schema: EntitySchema;
  entities: Entity[];
  validations: Record<string, EntityValidation>;
}) {
  const deleteEntity = useAppStore((state) => state.deleteEntity);
  const duplicateEntity = useAppStore((state) => state.duplicateEntity);
  const Icon = getTypeIcon(schema);

  const columns = useMemo<ColumnDef<Entity>[]>(() => {
    const fieldColumns: ColumnDef<Entity>[] = schema.fields.map(
      (field, index) => ({
        id: field.key,
        header: field.label,
        meta: {
          width: field.width,
          // Первую колонку примораживаем при горизонтальной прокрутке.
          ...(index === 0 ? { stickyLeft: 0 } : {}),
        },
        cell: ({ row }) => (
          <EntityCell
            entity={row.original}
            field={field}
            error={validations[row.original.id]?.fieldErrors[field.key]}
          />
        ),
      })
    );

    const statusColumn: ColumnDef<Entity> = {
      id: "status",
      header: "Статус",
      meta: { width: 150 },
      cell: ({ row }) => {
        const validation = validations[row.original.id];
        const errorCount = Object.keys(validation?.fieldErrors ?? {}).length;

        return (
          <div className="flex h-row items-center px-3">
            {validation?.isValid ? (
              <span className="inline-flex items-center gap-1.5 rounded border border-ok-line px-2 py-1 font-mono text-label uppercase text-ok-fg">
                <CheckCircle2 className="h-3 w-3" />
                Готово
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded border border-danger-line px-2 py-1 font-mono text-label uppercase text-danger-fg">
                <AlertTriangle className="h-3 w-3" />
                {errorCount} {plural(errorCount, "ошибка", "ошибки", "ошибок")}
              </span>
            )}
          </div>
        );
      },
    };

    const actionsColumn: ColumnDef<Entity> = {
      id: "actions",
      header: "",
      meta: { width: 56 },
      cell: ({ row }) => (
        <div className="flex h-row items-center justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-fg-ghost transition-colors hover:text-fg"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Действия над объектом</span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onSelect={() => duplicateEntity(row.original.id)}
              >
                <Copy className="h-4 w-4 text-fg-faint" />
                Дублировать
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => deleteEntity(row.original.id)}
                className="text-danger-fg focus:bg-danger-bg focus:text-danger-fg"
              >
                <Trash2 className="h-4 w-4" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    };

    return [...fieldColumns, statusColumn, actionsColumn];
  }, [schema, validations, deleteEntity, duplicateEntity]);

  const table = useReactTable({
    data: entities,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  return (
    <section className="border-b border-line last:border-b-0">
      {/* Заголовок группы */}
      <div className="sticky left-0 flex items-center gap-2 bg-bg px-4 py-2.5">
        <Icon className="h-3 w-3 shrink-0 text-fg-faint" />
        <span className="font-mono text-label uppercase text-fg-subtle">
          {schema.label}
        </span>
        <span className="font-mono text-label tabular-nums text-fg-ghost">
          {entities.length}
        </span>
        {schema.isCustom && (
          <span className="rounded border border-brand-line px-1.5 py-0.5 font-mono text-label uppercase text-brand-strong">
            свой тип
          </span>
        )}
      </div>

      <table className="w-full border-separate border-spacing-0 text-body">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const meta = header.column.columnDef.meta;
                const isSticky = meta?.stickyLeft !== undefined;
                return (
                  <th
                    key={header.id}
                    style={{
                      width: meta?.width,
                      minWidth: meta?.width,
                      left: meta?.stickyLeft,
                    }}
                    className={cn(
                      "h-9 whitespace-nowrap border-y border-line bg-surface px-3 text-left font-mono text-label font-normal uppercase text-fg-faint",
                      isSticky &&
                        "sticky z-10 shadow-[1px_0_0_0_rgb(231,229,228)]"
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>

        <tbody>
          {table.getRowModel().rows.map((row, index) => (
            <motion.tr
              key={row.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.22,
                delay: Math.min(index * 0.04, 0.24),
              }}
              className="group hover:bg-bg/70"
            >
              {row.getVisibleCells().map((cell) => {
                const meta = cell.column.columnDef.meta;
                const isSticky = meta?.stickyLeft !== undefined;
                return (
                  <td
                    key={cell.id}
                    style={{
                      width: meta?.width,
                      minWidth: meta?.width,
                      left: meta?.stickyLeft,
                    }}
                    className={cn(
                      "border-b border-line/70 p-0 align-middle",
                      isSticky &&
                        "sticky z-10 bg-surface shadow-[1px_0_0_0_rgb(231,229,228)] group-hover:bg-bg/70"
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                );
              })}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  ЯЧЕЙКА С ИНЛАЙН-РЕДАКТИРОВАНИЕМ                                    */
/* ------------------------------------------------------------------ */

function EntityCell({
  entity,
  field,
  error,
}: {
  entity: Entity;
  field: EntityFieldSchema;
  error: string | undefined;
}) {
  const editingCell = useAppStore((state) => state.editingCell);
  const setEditingCell = useAppStore((state) => state.setEditingCell);
  const updateEntityField = useAppStore((state) => state.updateEntityField);

  const inputRef = useRef<HTMLInputElement>(null);
  const isEditing =
    editingCell?.entityId === entity.id && editingCell.field === field.key;

  const value = entity.data[field.key] ?? "";
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (!isEditing) return;
    setDraft(value);
    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  function commit() {
    updateEntityField(entity.id, field.key, draft);
    setEditingCell(null);
  }

  if (isEditing) {
    return (
      <div className="h-row p-1">
        <input
          ref={inputRef}
          value={draft}
          placeholder={field.placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit();
            } else if (event.key === "Escape") {
              event.preventDefault();
              setEditingCell(null);
            }
          }}
          className="h-full w-full rounded border border-fg bg-surface px-2.5 text-body text-fg shadow-[0_0_0_3px_rgba(28,25,23,0.08)] outline-none placeholder:text-fg-ghost"
        />
      </div>
    );
  }

  // Ошибочная ячейка: красный фон, иконка и тултип с причиной.
  if (error) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() =>
              setEditingCell({ entityId: entity.id, field: field.key })
            }
            className="flex h-row w-full items-center gap-1.5 border border-danger-line bg-danger-bg px-3 text-left text-danger-fg transition-colors hover:bg-danger-bg/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-danger"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-danger-fg" />
            <span className="truncate text-body">{value || "Не заполнено"}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <span className="flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-danger-fg" />
            {error}
          </span>
        </TooltipContent>
      </Tooltip>
    );
  }

  // Пустое необязательное поле — не ошибка, но приглашает заполнить.
  if (!value) {
    return (
      <button
        type="button"
        onClick={() =>
          setEditingCell({ entityId: entity.id, field: field.key })
        }
        className="group/cell flex h-row w-full items-center gap-1.5 px-3 text-left transition-colors hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
      >
        <Plus className="h-3.5 w-3.5 shrink-0 text-inverse-fg transition-colors group-hover/cell:text-fg" />
        <span className="truncate text-body text-fg-ghost transition-colors group-hover/cell:text-fg-subtle">
          Добавить
        </span>
      </button>
    );
  }

  /*
   * Значение подставила модель и сама в нём не уверена.
   *
   * Не ошибка — ошибка красная и выше по коду, она главнее. Здесь другое:
   * значение, скорее всего, верное, но проверить его должен человек. Янтарный
   * — ровно та громкость, которая нужна: заметно при взгляде на таблицу и не
   * мешает работать. Пометка снимается сама, как только значение поправили.
   */
  if (entity.uncertainFields.includes(field.key)) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() =>
              setEditingCell({ entityId: entity.id, field: field.key })
            }
            className="flex h-row w-full items-center gap-1.5 border border-warn-line bg-warn-bg/70 px-3 text-left transition-colors hover:bg-warn-bg/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-warn"
          >
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-warn-fg" />
            <span className="truncate text-body text-fg">{value}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-warn-fg" />
            Значение взято из файла, но модель в нём не уверена — сверьте с
            оригиналом. Пометка снимется, как только вы поправите значение.
          </span>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditingCell({ entityId: entity.id, field: field.key })}
      className="flex h-row w-full items-center px-3 text-left transition-colors hover:bg-surface-2/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus"
    >
      <span className="truncate text-body text-fg">{value}</span>
    </button>
  );
}
