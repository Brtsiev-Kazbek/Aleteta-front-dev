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
  Inbox,
  MapPinned,
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
import {
  BUILTIN_SCHEMAS,
  type Entity,
  type EntityFieldSchema,
  type EntitySchema,
} from "@/types";

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
  const customSchemas = useAppStore((state) => state.customSchemas);
  const addEntity = useAppStore((state) => state.addEntity);
  const setEditingCell = useAppStore((state) => state.setEditingCell);
  const startGeneration = useAppStore((state) => state.startGeneration);
  const setCustomSchemaOpen = useAppStore((state) => state.setCustomSchemaOpen);

  const entities = useMemo(
    () => allEntities.filter((entity) => entity.caseId === caseId),
    [allEntities, caseId]
  );

  const availableSchemas = useMemo(
    () => [...BUILTIN_SCHEMAS, ...customSchemas],
    [customSchemas]
  );

  /** Валидация по каждой сущности с учётом её собственной схемы. */
  const validations = useMemo(() => {
    const map: Record<string, EntityValidation> = {};
    for (const entity of entities) {
      map[entity.id] = validateEntity(
        entity,
        findSchema(customSchemas, entity.type)
      );
    }
    return map;
  }, [entities, customSchemas]);

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
      schema: findSchema(customSchemas, typeId),
      entities: items,
    }));
  }, [entities, customSchemas]);

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
    const target = findFirstInvalidCell(entities, customSchemas);
    if (target) setEditingCell(target);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      {/* Панель над таблицей */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3">
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-medium text-zinc-900">
            Сущности дела
          </span>
          <span className="text-xs text-zinc-500">
            Реквизиты подставляются в шаблоны при массовой генерации
          </span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="h-9 gap-1.5 border-zinc-200"
            >
              <Plus className="h-3.5 w-3.5" />
              Добавить сущность
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Тип сущности</DropdownMenuLabel>

            {availableSchemas.map((schema) => {
              const Icon = getTypeIcon(schema);
              return (
                <DropdownMenuItem
                  key={schema.id}
                  onSelect={() => addEntity(caseId, schema.id)}
                  className="items-start gap-2.5 py-2.5"
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">{schema.label}</span>
                    <span className="truncate text-xs text-zinc-400">
                      {schema.hint}
                    </span>
                  </span>
                </DropdownMenuItem>
              );
            })}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onSelect={() => setCustomSchemaOpen(true)}
              className="items-start gap-2.5 py-2.5 text-indigo-700 focus:bg-indigo-50 focus:text-indigo-700"
            >
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="flex min-w-0 flex-col">
                <span className="font-medium">Создать свой тип</span>
                <span className="truncate text-xs text-indigo-400">
                  Произвольный набор реквизитов
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
          <div className="flex h-full min-h-[260px] flex-col items-center justify-center gap-3 p-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100">
              <Inbox className="h-5 w-5 text-zinc-400" />
            </div>
            <p className="text-sm font-medium text-zinc-900">
              В деле пока нет сущностей
            </p>
            <p className="max-w-sm text-sm text-zinc-500">
              Добавьте участок, контрагента, правообладателя — или опишите свой
              тип с нужными реквизитами.
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {groups.map((group) => (
              <EntityGroupTable
                key={group.schema.id}
                schema={group.schema}
                entities={group.entities}
                validations={validations}
              />
            ))}
          </div>
        )}
      </div>

      {/* Липкая панель валидации и запуска генерации */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-zinc-200 bg-white/95 px-4 py-3.5 backdrop-blur">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              stats.allValid
                ? "bg-emerald-50 text-emerald-600"
                : "bg-red-50 text-red-600"
            )}
          >
            {stats.allValid ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
          </div>

          <div className="flex flex-col leading-tight">
            <span className="text-sm">
              <span className="text-zinc-500">Готово к генерации: </span>
              <span className="font-semibold text-zinc-900">
                {stats.valid} / {stats.total}
              </span>
            </span>
            <span className="text-xs text-zinc-400">
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
              className="h-9 gap-1.5 border-red-200 bg-red-50/60 text-red-700 hover:bg-red-50"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Исправить
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
                Заполните обязательные поля у всех сущностей
              </TooltipContent>
            </Tooltip>
          )}
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
          <div className="flex h-11 items-center px-3">
            {validation?.isValid ? (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200/70 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Валидно
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-red-200/70 bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                <AlertTriangle className="h-3.5 w-3.5" />
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
        <div className="flex h-11 items-center justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-zinc-300 transition-colors hover:bg-red-50 hover:text-red-600"
                onClick={() => deleteEntity(row.original.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="sr-only">Удалить сущность</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Удалить сущность</TooltipContent>
          </Tooltip>
        </div>
      ),
    };

    return [...fieldColumns, statusColumn, actionsColumn];
  }, [schema, validations, deleteEntity]);

  const table = useReactTable({
    data: entities,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  return (
    <section className="border-b border-zinc-200 last:border-b-0">
      {/* Заголовок группы */}
      <div className="sticky left-0 flex items-center gap-2 bg-zinc-50/80 px-4 py-2.5">
        <Icon className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          {schema.label}
        </span>
        <span className="rounded bg-zinc-200/70 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600">
          {entities.length}
        </span>
        {schema.isCustom && (
          <span className="rounded border border-indigo-200 bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700">
            свой тип
          </span>
        )}
      </div>

      <table className="w-full border-separate border-spacing-0 text-sm">
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
                      "h-9 whitespace-nowrap border-y border-zinc-200 bg-white px-3 text-left text-xs font-medium text-zinc-400",
                      isSticky &&
                        "sticky z-10 shadow-[1px_0_0_0_rgb(228,228,231)]"
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
              className="group hover:bg-zinc-50/70"
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
                      "border-b border-zinc-200/70 p-0 align-middle",
                      isSticky &&
                        "sticky z-10 bg-white shadow-[1px_0_0_0_rgb(228,228,231)] group-hover:bg-[#fafafa]"
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
      <div className="h-11 p-1">
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
          className="h-full w-full rounded-md border-2 border-indigo-500 bg-white px-2.5 text-sm text-zinc-900 shadow-[0_0_0_3px_rgba(99,102,241,0.12)] outline-none placeholder:text-zinc-300"
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
            className="flex h-11 w-full items-center gap-1.5 border border-red-200 bg-red-50 px-3 text-left text-red-900 transition-colors hover:bg-red-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-400"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
            <span className="truncate text-sm">{value || "Не заполнено"}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <span className="flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />
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
        className="group/cell flex h-11 w-full items-center gap-1.5 px-3 text-left transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400"
      >
        <Plus className="h-3.5 w-3.5 shrink-0 text-zinc-300 transition-colors group-hover/cell:text-indigo-500" />
        <span className="truncate text-sm text-zinc-300 transition-colors group-hover/cell:text-zinc-500">
          Добавить
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditingCell({ entityId: entity.id, field: field.key })}
      className="flex h-11 w-full items-center px-3 text-left transition-colors hover:bg-indigo-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400"
    >
      <span className="truncate text-sm text-zinc-900">{value}</span>
    </button>
  );
}
