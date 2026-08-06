"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { updateWorkspaceAction } from "@/app/actions/workspace";
import { FormError, FormSuccess, TextField } from "@/components/auth/fields";
import { Button } from "@/components/ui/button";
import { validateInn } from "@/lib/validation";
import type { SettingsWorkspace } from "@/lib/data/workspace";

/**
 * Реквизиты организации.
 *
 * Эти значения подставляются в документы вместо ручного ввода, поэтому ИНН
 * проверяется по контрольным цифрам: опечатка здесь расходится по всем
 * сгенерированным файлам разом.
 */
export function OrganizationForm({
  workspace,
  canEdit,
}: {
  workspace: SettingsWorkspace;
  /** Реквизиты меняют владелец и администратор; остальные их только видят. */
  canEdit: boolean;
}) {
  const router = useRouter();

  const [name, setName] = useState(workspace.name);
  const [legalName, setLegalName] = useState(workspace.legalName);
  const [inn, setInn] = useState(workspace.inn);
  const [address, setAddress] = useState(workspace.address);

  const [saved, setSavedValues] = useState({
    name: workspace.name,
    legalName: workspace.legalName,
    inn: workspace.inn,
    address: workspace.address,
  });

  const [innError, setInnError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isDirty =
    name !== saved.name ||
    legalName !== saved.legalName ||
    inn !== saved.inn ||
    address !== saved.address;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (isPending || !canEdit) return;

    if (!name.trim()) {
      setError("У пространства должно быть название.");
      return;
    }

    const localInnError = validateInn(inn);
    setInnError(localInnError);
    if (localInnError) return;

    setError(null);
    setSaved(false);

    startTransition(async () => {
      const result = await updateWorkspaceAction({
        name,
        legalName,
        inn,
        address,
      });

      if (!result.ok) {
        setError(result.error ?? "Не удалось сохранить реквизиты.");
        return;
      }

      setSavedValues({ name, legalName, inn, address });
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Название пространства"
          value={name}
          disabled={!canEdit}
          onChange={(event) => {
            setName(event.target.value);
            setSaved(false);
          }}
          placeholder="Алетейя Лигал"
        />

        <TextField
          label="Наименование по документам"
          value={legalName}
          disabled={!canEdit}
          onChange={(event) => {
            setLegalName(event.target.value);
            setSaved(false);
          }}
          placeholder="ООО «Алетейя Лигал»"
          autoComplete="organization"
        />

        <TextField
          label="ИНН"
          value={inn}
          error={innError}
          disabled={!canEdit}
          inputMode="numeric"
          onChange={(event) => {
            setInn(event.target.value.replace(/\D/g, "").slice(0, 12));
            if (innError) setInnError(null);
            setSaved(false);
          }}
          placeholder="1513000000"
        />

        <TextField
          label="Адрес"
          value={address}
          disabled={!canEdit}
          onChange={(event) => {
            setAddress(event.target.value);
            setSaved(false);
          }}
          placeholder="г. Владикавказ, ул. Мира, д. 10"
          autoComplete="street-address"
        />
      </div>

      {!canEdit && (
        <p className="text-[13px] leading-relaxed text-stone-500">
          Реквизиты меняет владелец или администратор пространства.
        </p>
      )}

      {error && <FormError>{error}</FormError>}
      {isSaved && !isDirty && <FormSuccess>Реквизиты сохранены.</FormSuccess>}

      {canEdit && (
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isPending || !isDirty}
            className="gap-2"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Сохранить
          </Button>
        </div>
      )}
    </form>
  );
}
