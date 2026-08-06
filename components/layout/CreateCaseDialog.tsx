"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { FormError } from "@/components/auth/fields";
import { Button } from "@/components/ui/button";
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
import { useAppStore } from "@/store/useAppStore";

/**
 * Диалог создания дела живёт рядом с сайдбаром, поэтому доступен на всех
 * экранах приложения — и с дашборда, и изнутри рабочего пространства.
 */
export function CreateCaseDialog() {
  const router = useRouter();
  const isOpen = useAppStore((state) => state.isCreateCaseOpen);
  const setOpen = useAppStore((state) => state.setCreateCaseOpen);
  const createCase = useAppStore((state) => state.createCase);

  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setPending] = useState(false);

  async function handleCreate() {
    if (isPending) return;

    const trimmed = title.trim();
    if (!trimmed) {
      setError("Назовите дело — по названию его потом искать.");
      return;
    }

    setError(null);
    setPending(true);

    try {
      const created = await createCase(trimmed);

      /*
       * При отказе диалог остаётся открытым: закрыть его — значит потерять
       * введённое название вместе с причиной отказа.
       */
      if (!created) {
        setError("Дело не создано. Попробуйте ещё раз.");
        return;
      }

      setTitle("");
      setOpen(false);
      router.push(`/cases/${created.id}`);
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        // Пока идёт запись, закрывать диалог нечем: результат ещё неизвестен.
        if (isPending) return;
        setOpen(open);
        if (!open) {
          setTitle("");
          setError(null);
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <MetaLabel>Рабочее пространство</MetaLabel>
          <DialogTitle className="mt-1">Новое дело</DialogTitle>
          <DialogDescription>
            Назовите рабочее пространство — файлы и объекты добавите внутри.
          </DialogDescription>
        </DialogHeader>

        <Input
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void handleCreate();
            }
          }}
          placeholder="Например: Купля-продажа участка на ул. Мира"
          disabled={isPending}
          autoFocus
        />

        {error && <FormError>{error}</FormError>}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Отмена
          </Button>
          <Button onClick={handleCreate} disabled={isPending} className="gap-2">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Создать дело
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
