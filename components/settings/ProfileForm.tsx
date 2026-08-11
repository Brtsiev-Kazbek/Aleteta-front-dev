"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { updateProfileAction } from "@/app/actions/workspace";
import { FormError, FormSuccess, TextField } from "@/components/auth/fields";
import { Button } from "@/components/ui/button";
import { validateFullName } from "@/lib/auth/validation";

/**
 * Профиль: имя и должность.
 *
 * Почта здесь только показывается — меняется она через письмо-подтверждение,
 * этим занимается соседний раздел безопасности.
 */
export function ProfileForm({
  fullName: initialFullName,
  jobTitle: initialJobTitle,
  email,
}: {
  fullName: string;
  jobTitle: string;
  email: string;
}) {
  const router = useRouter();

  const [fullName, setFullName] = useState(initialFullName);
  const [jobTitle, setJobTitle] = useState(initialJobTitle);
  /*
   * Сохранённые значения держим отдельно от пришедших с сервера: страница
   * перечитывается не мгновенно, и без этого кнопка «Сохранить» ещё пару
   * мгновений после удачной записи выглядела бы активной.
   */
  const [saved, setSavedValues] = useState({
    fullName: initialFullName,
    jobTitle: initialJobTitle,
  });
  const [nameError, setNameError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isDirty = fullName !== saved.fullName || jobTitle !== saved.jobTitle;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isPending) return;

    const localError = validateFullName(fullName);
    setNameError(localError);
    if (localError) return;

    setError(null);
    setSaved(false);

    startTransition(async () => {
      const result = await updateProfileAction({ fullName, jobTitle });

      if (!result.ok) {
        setError(result.error ?? "Не удалось сохранить профиль.");
        return;
      }

      setSavedValues({ fullName, jobTitle });
      setSaved(true);
      // Имя показывается и вне этой страницы — перечитываем серверные данные.
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Имя"
          value={fullName}
          error={nameError}
          onChange={(event) => {
            setFullName(event.target.value);
            if (nameError) setNameError(null);
            setSaved(false);
          }}
          placeholder="Казбек Брциев"
          autoComplete="name"
        />

        <TextField
          label="Должность"
          value={jobTitle}
          onChange={(event) => {
            setJobTitle(event.target.value);
            setSaved(false);
          }}
          placeholder="Юрист-партнёр"
          autoComplete="organization-title"
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-fg-faint">
          Электронная почта
        </span>
        <div className="flex h-10 items-center rounded-md border border-line bg-bg px-3 text-sm text-fg-subtle">
          {email}
        </div>
      </div>

      {error && <FormError>{error}</FormError>}
      {isSaved && !isDirty && <FormSuccess>Профиль сохранён.</FormSuccess>}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending || !isDirty} className="gap-2">
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Сохранить
        </Button>
      </div>
    </form>
  );
}
