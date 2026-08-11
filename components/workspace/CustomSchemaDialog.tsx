"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MetaLabel } from "@/components/layout/PanelHeading";
import { plural } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";

interface DraftField {
  id: number;
  label: string;
  required: boolean;
}

const INITIAL_FIELDS: DraftField[] = [
  { id: 1, label: "Наименование", required: true },
  { id: 2, label: "", required: false },
];

interface CustomSchemaDialogProps {
  /**
   * Дело, в которое сразу добавится объект нового типа. Без него создаётся
   * только сам тип — он общий и доступен во всех делах.
   */
  caseId?: string;
}

export function CustomSchemaDialog({ caseId }: CustomSchemaDialogProps) {
  const isOpen = useAppStore((state) => state.isCustomSchemaOpen);
  const setOpen = useAppStore((state) => state.setCustomSchemaOpen);
  const createCustomSchema = useAppStore((state) => state.createCustomSchema);

  const [label, setLabel] = useState("");
  const [fields, setFields] = useState<DraftField[]>(INITIAL_FIELDS);
  const [nextFieldId, setNextFieldId] = useState(3);
  const [isPending, setPending] = useState(false);

  function reset() {
    setLabel("");
    setFields(INITIAL_FIELDS);
    setNextFieldId(3);
  }

  function addField() {
    setFields((current) => [
      ...current,
      { id: nextFieldId, label: "", required: false },
    ]);
    setNextFieldId((id) => id + 1);
  }

  function updateField(id: number, patch: Partial<DraftField>) {
    setFields((current) =>
      current.map((field) => (field.id === id ? { ...field, ...patch } : field))
    );
  }

  function removeField(id: number) {
    setFields((current) => current.filter((field) => field.id !== id));
  }

  async function handleCreate() {
    if (isPending) return;
    setPending(true);

    try {
      /*
       * Ждём ответа базы: тип получает настоящий идентификатор, и объекты,
       * созданные следом, должны ссылаться уже на него. Отказ показывает общее
       * уведомление о неудачной записи — оно же вернёт список в прежний вид.
       */
      await createCustomSchema(
        {
          label,
          fields: fields.map(({ label: fieldLabel, required }) => ({
            label: fieldLabel,
            required,
          })),
        },
        caseId
      );
      reset();
    } finally {
      setPending(false);
    }
  }

  const filledFields = fields.filter((field) => field.label.trim()).length;
  const requiredCount = fields.filter(
    (field) => field.label.trim() && field.required
  ).length;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (isPending) return;
        setOpen(open);
        if (!open) reset();
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <MetaLabel>Свои типы объектов</MetaLabel>
          <DialogTitle className="mt-1">
            {caseId ? "Новый тип объекта в деле" : "Новый тип объекта"}
          </DialogTitle>
          <DialogDescription>
            Реквизиты станут колонками таблицы и будут проверяться перед
            генерацией. {caseId
              ? "Тип останется доступен и в остальных делах."
              : "Тип появится в списке типов во всех делах."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="schema-label">
              <MetaLabel>Название типа</MetaLabel>
            </label>
            <Input
              id="schema-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Например: Транспортное средство"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="flex items-baseline justify-between gap-3">
              <MetaLabel>Реквизиты</MetaLabel>
              <span className="font-mono text-label tabular-nums text-fg-faint">
                {filledFields} {plural(filledFields, "поле", "поля", "полей")}
                {requiredCount > 0 &&
                  ` · ${requiredCount} ${plural(
                    requiredCount,
                    "обязательное",
                    "обязательных",
                    "обязательных"
                  )}`}
              </span>
            </div>

            <div className="scrollable-area flex max-h-64 flex-col gap-2 overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {fields.map((field, index) => (
                  <motion.div
                    key={field.id}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                    className="flex items-center gap-2"
                  >
                    <span className="w-5 shrink-0 font-mono text-label tabular-nums text-fg-ghost">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <Input
                      value={field.label}
                      onChange={(event) =>
                        updateField(field.id, { label: event.target.value })
                      }
                      placeholder="Название реквизита"
                      className="flex-1"
                    />

                    <label className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-line px-2.5 py-2 font-mono text-label uppercase text-fg-subtle transition-colors hover:border-line-strong hover:text-fg">
                      <Checkbox
                        checked={field.required}
                        onCheckedChange={(checked) =>
                          updateField(field.id, { required: checked === true })
                        }
                      />
                      Обязательное
                    </label>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeField(field.id)}
                      disabled={fields.length <= 1}
                      className="h-9 w-9 shrink-0 hover:text-danger-fg"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Удалить реквизит</span>
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={addField}
              className="w-full gap-1.5 border-dashed"
            >
              <Plus className="h-3.5 w-3.5" />
              Добавить реквизит
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Отмена
          </Button>
          <Button
            onClick={handleCreate}
            disabled={filledFields === 0 || isPending}
            className="gap-2"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {caseId ? "Создать тип и объект" : "Создать тип"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
