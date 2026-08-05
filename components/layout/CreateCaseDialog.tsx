"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

  function handleCreate() {
    const created = createCase(title);
    setTitle("");
    setOpen(false);
    router.push(`/cases/${created.id}`);
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setOpen(open);
        if (!open) setTitle("");
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Новое дело</DialogTitle>
          <DialogDescription>
            Назовите рабочее пространство — файлы и сущности добавите внутри.
          </DialogDescription>
        </DialogHeader>

        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleCreate();
            }
          }}
          placeholder="Например: Купля-продажа участка на ул. Мира"
          autoFocus
        />

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button onClick={handleCreate}>Создать дело</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
