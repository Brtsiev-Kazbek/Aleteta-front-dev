"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MailPlus, UserMinus, X } from "lucide-react";

import {
  cancelInviteAction,
  inviteMemberAction,
  removeMemberAction,
  updateMemberRoleAction,
} from "@/app/actions/workspace";
import { FormError, FormSuccess, TextField } from "@/components/auth/fields";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { validateEmail } from "@/lib/auth/validation";
import type { SettingsInvite, SettingsMember } from "@/lib/data/workspace";
import type { WorkspaceRole } from "@/types/database";

const ROLE_LABELS: Record<WorkspaceRole, string> = {
  owner: "Владелец",
  admin: "Администратор",
  member: "Участник",
  viewer: "Наблюдатель",
};

/** Роли, которые можно назначить приглашением или сменой. Владельца — нет. */
const ASSIGNABLE: WorkspaceRole[] = ["admin", "member", "viewer"];

/**
 * Участники пространства и незакрытые приглашения.
 *
 * Приглашение — это строка в базе, а не письмо: человек получает доступ и
 * тогда, когда письмо не дошло, — при первом входе под приглашённым адресом.
 * Поэтому «письмо не отправлено» здесь предупреждение, а не ошибка.
 */
export function MembersPanel({
  members,
  invites,
  canManage,
}: {
  members: SettingsMember[];
  invites: SettingsInvite[];
  /** Приглашать и менять роли может владелец или администратор. */
  canManage: boolean;
}) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("member");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleInvite(event: React.FormEvent) {
    event.preventDefault();
    if (isPending || !canManage) return;

    const localError = validateEmail(email);
    setEmailError(localError);
    if (localError) return;

    setError(null);
    setNotice(null);

    startTransition(async () => {
      const result = await inviteMemberAction(email, role);

      if (!result.ok) {
        setError(result.error ?? "Не удалось отправить приглашение.");
        return;
      }

      setEmail("");
      setNotice(
        result.data?.emailSent
          ? `Приглашение отправлено на ${result.data.email}.`
          : `Приглашение создано. Письмо не ушло — доступ появится, когда человек войдёт под этим адресом.`
      );
      router.refresh();
    });
  }

  function runAction(request: Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    setNotice(null);

    startTransition(async () => {
      const result = await request;
      if (!result.ok) {
        setError(result.error ?? "Действие не выполнено.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Состав */}
      <ul className="flex flex-col divide-y divide-stone-200 border-y border-stone-200">
        {members.map((member) => (
          <li key={member.userId} className="flex items-center gap-4 py-3.5">
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm text-stone-900">
                {member.fullName}
                {member.isSelf && (
                  <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.12em] text-stone-400">
                    это вы
                  </span>
                )}
              </span>
              <span className="mt-0.5 truncate text-[12px] text-stone-500">
                {member.email}
                {member.jobTitle ? ` · ${member.jobTitle}` : ""}
              </span>
            </div>

            {canManage && member.role !== "owner" ? (
              <select
                value={member.role}
                disabled={isPending}
                onChange={(event) =>
                  runAction(
                    updateMemberRoleAction(
                      member.userId,
                      event.target.value as WorkspaceRole
                    )
                  )
                }
                className="h-8 shrink-0 rounded-md border border-stone-200 bg-white px-2 text-[13px] text-stone-700 transition-colors hover:border-stone-300 focus-visible:border-stone-900 focus-visible:outline-none disabled:opacity-50"
                aria-label={`Роль участника ${member.fullName}`}
              >
                {ASSIGNABLE.map((value) => (
                  <option key={value} value={value}>
                    {ROLE_LABELS[value]}
                  </option>
                ))}
              </select>
            ) : (
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-stone-400">
                {ROLE_LABELS[member.role]}
              </span>
            )}

            {canManage && !member.isSelf && member.role !== "owner" && (
              <Button
                variant="ghost"
                size="icon"
                disabled={isPending}
                onClick={() => runAction(removeMemberAction(member.userId))}
                className="h-8 w-8 shrink-0 hover:text-red-600"
              >
                <UserMinus className="h-4 w-4" />
                <span className="sr-only">
                  Исключить участника {member.fullName}
                </span>
              </Button>
            )}
          </li>
        ))}
      </ul>

      {/* Незакрытые приглашения */}
      {invites.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-stone-400">
            Приглашения ждут ответа
          </span>

          <ul className="flex flex-col divide-y divide-stone-100">
            {invites.map((invite) => (
              <li key={invite.id} className="flex items-center gap-3 py-2.5">
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[13px] text-stone-700">
                    {invite.email}
                  </span>
                  <span className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-stone-400">
                    {ROLE_LABELS[invite.role]} · действует до{" "}
                    {formatDate(invite.expiresAt)}
                  </span>
                </div>

                {canManage && (
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={isPending}
                    onClick={() => runAction(cancelInviteAction(invite.id))}
                    className="h-8 w-8 shrink-0 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">
                      Отозвать приглашение для {invite.email}
                    </span>
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Приглашение */}
      {canManage && (
        <form
          onSubmit={handleInvite}
          className="flex flex-col gap-3 border-t border-stone-200 pt-5"
          noValidate
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <TextField
                label="Пригласить по почте"
                type="email"
                inputMode="email"
                value={email}
                error={emailError}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (emailError) setEmailError(null);
                }}
                placeholder="colleague@example.ru"
                autoComplete="off"
              />
            </div>

            <select
              value={role}
              onChange={(event) =>
                setRole(event.target.value as WorkspaceRole)
              }
              className="h-10 shrink-0 rounded-md border border-stone-200 bg-white px-2 text-sm text-stone-700 focus-visible:border-stone-900 focus-visible:outline-none"
              aria-label="Роль приглашаемого"
            >
              {ASSIGNABLE.map((value) => (
                <option key={value} value={value}>
                  {ROLE_LABELS[value]}
                </option>
              ))}
            </select>

            <Button type="submit" disabled={isPending} className="h-10 gap-2">
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MailPlus className="h-4 w-4" />
              )}
              Пригласить
            </Button>
          </div>

          {error && <FormError>{error}</FormError>}
          {notice && <FormSuccess>{notice}</FormSuccess>}
        </form>
      )}
    </div>
  );
}
