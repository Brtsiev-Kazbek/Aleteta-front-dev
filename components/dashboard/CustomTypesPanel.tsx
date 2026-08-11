"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Panel } from "@/components/layout/Panel";
import { CustomSchemaDialog } from "@/components/workspace/CustomSchemaDialog";
import { plural } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

/**
 * Пользовательские типы объектов — общие для всей рабочей области. Тип,
 * созданный здесь или в любом деле, появляется в списке типов везде.
 */
export function CustomTypesPanel() {
  const allSchemas = useAppStore((state) => state.entitySchemas);
  const entities = useAppStore((state) => state.entities);
  const setCustomSchemaOpen = useAppStore((state) => state.setCustomSchemaOpen);
  const deleteCustomSchema = useAppStore((state) => state.deleteCustomSchema);

  /*
   * Раздел про свои типы, поэтому встроенные отсеиваем здесь, а не в сторе: в
   * сторе живут все типы, какие есть, и это правильно — объекту нужна его
   * схема независимо от того, кто её завёл.
   */
  const ownSchemas = allSchemas.filter((schema) => schema.isCustom);

  return (
    <Panel
      title="Свои типы объектов"
      meta="Доступны во всех делах"
      bodyClassName="px-5 py-2"
      action={
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setCustomSchemaOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          Создать тип
        </Button>
      }
    >
      {ownSchemas.length === 0 ? (
        <p className="py-4 text-body leading-relaxed text-fg-subtle">
          Пока ни одного своего типа. Опишите то, с чем работаете именно вы —
          транспорт, оборудование, объекты аренды, студенческие работы: набор
          реквизитов станет колонками таблицы и будет проверяться перед
          генерацией.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-line-soft">
          <AnimatePresence initial={false}>
            {ownSchemas.map((schema) => {
              const usage = entities.filter(
                (entity) => entity.type === schema.id
              ).length;
              const requiredCount = schema.fields.filter(
                (field) => field.required
              ).length;

              return (
                <motion.li
                  key={schema.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22 }}
                  className="group flex items-center gap-3 py-3.5"
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-body text-fg">
                      {schema.label}
                    </span>
                    <span className="mt-0.5 truncate font-mono text-label uppercase text-fg-faint">
                      {schema.fields.length}{" "}
                      {plural(
                        schema.fields.length,
                        "реквизит",
                        "реквизита",
                        "реквизитов"
                      )}{" "}
                      · {requiredCount}{" "}
                      {plural(
                        requiredCount,
                        "обязательный",
                        "обязательных",
                        "обязательных"
                      )}{" "}
                      · {usage}{" "}
                      {plural(usage, "объект", "объекта", "объектов")} в делах
                    </span>
                  </div>

                  <div className="hidden max-w-[45%] flex-wrap justify-end gap-1.5 lg:flex">
                    {schema.fields.slice(0, 4).map((field) => (
                      <span
                        key={field.key}
                        className="rounded-full border border-line bg-bg px-2 py-0.5 font-mono text-label uppercase text-fg-subtle"
                      >
                        {field.label}
                      </span>
                    ))}
                    {schema.fields.length > 4 && (
                      <span className="font-mono text-label text-fg-ghost">
                        +{schema.fields.length - 4}
                      </span>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteCustomSchema(schema.id)}
                    className="h-8 w-8 shrink-0 opacity-0 transition-opacity hover:text-danger-fg focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Удалить тип «{schema.label}»</span>
                  </Button>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      <CustomSchemaDialog />
    </Panel>
  );
}
