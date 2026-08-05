"use client";

import { useState } from "react";
import { GripVertical, Plus, Sparkles, Trash2 } from "lucide-react";

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

export function CustomSchemaDialog({ caseId }: { caseId: string }) {
  const isOpen = useAppStore((state) => state.isCustomSchemaOpen);
  const setOpen = useAppStore((state) => state.setCustomSchemaOpen);
  const createCustomSchema = useAppStore((state) => state.createCustomSchema);

  const [label, setLabel] = useState("");
  const [fields, setFields] = useState<DraftField[]>(INITIAL_FIELDS);
  const [nextFieldId, setNextFieldId] = useState(3);

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

  function handleCreate() {
    createCustomSchema(caseId, {
      label,
      fields: fields.map(({ label: fieldLabel, required }) => ({
        label: fieldLabel,
        required,
      })),
    });
    reset();
  }

  const filledFields = fields.filter((field) => field.label.trim()).length;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setOpen(open);
        if (!open) reset();
      }}
    >
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
              <Sparkles className="h-4 w-4 text-indigo-600" />
            </div>
            <DialogTitle>Свой тип сущности</DialogTitle>
          </div>
          <DialogDescription>
            Опишите, какие реквизиты нужны — они станут колонками в таблице и
            будут проверяться перед генерацией.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="schema-label"
              className="text-xs font-medium text-zinc-500"
            >
              Название типа
            </label>
            <Input
              id="schema-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Например: Транспортное средство"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-500">
                Реквизиты
              </span>
              <span className="text-xs text-zinc-400">
                Обязательные проверяются перед генерацией
              </span>
            </div>

            <div className="flex max-h-64 flex-col gap-2 overflow-y-auto pr-1">
              {fields.map((field) => (
                <div key={field.id} className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 shrink-0 text-zinc-300" />

                  <Input
                    value={field.label}
                    onChange={(event) =>
                      updateField(field.id, { label: event.target.value })
                    }
                    placeholder="Название реквизита"
                    className="flex-1"
                  />

                  <label className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-zinc-200 px-2.5 py-2 text-xs text-zinc-600 transition-colors hover:bg-zinc-50">
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
                    className="h-9 w-9 shrink-0 text-zinc-400 hover:text-red-600 disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Удалить реквизит</span>
                  </Button>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={addField}
              className="w-full gap-1.5 border-dashed border-zinc-300"
            >
              <Plus className="h-3.5 w-3.5" />
              Добавить реквизит
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button onClick={handleCreate} disabled={filledFields === 0}>
            Создать тип и сущность
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
