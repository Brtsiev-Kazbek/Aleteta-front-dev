"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2, MailPlus, UserMinus, X } from "lucide-react";

import {
  cancelInviteAction,
  inviteMemberAction,
  removeMemberAction,
  updateMemberRoleAction,
} from "@/app/actions/workspace";
import { FormError, FormSuccess, TextField } from "@/components/auth/fields";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import { validateEmail } from "@/lib/auth/validation";
import type { SettingsInvite, SettingsMember } from "@/lib/data/workspace";
import type { WorkspaceRole } from "@/types/rows";

const ROLE_LABELS: Record<WorkspaceRole, string> = {
  owner: "Владелец",
  admin: "Администратор",
  member: "Участник",
  viewer: "Наблюдатель",
};

/** Роли, которые можно назначить приглашением или сменой. Владельца — нет. */
const ASSIGNABLE: WorkspaceRole[] = ["admin", "member", "viewer"];

/**
 * Выбор роли.
 *
 * Нативный список браузер рисует по-своему на каждой системе, и рядом с
 * ровными полями формы он выглядит чужеродно. Оформление снимаем, стрелку
 * рисуем сами — поведение при этом остаётся родным, включая клавиатуру.
 */
function RoleSelect({
  value,
  onChange,
  label,
  disabled,
  className,
}: {
  value: WorkspaceRole;
  onChange: (role: WorkspaceRole) => void;
  label: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className="relative shrink-0">
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as WorkspaceRole)}
        aria-label={label}
        className={cn(
          "w-full appearance-none rounded-md border border-line bg-surface pl-2.5 pr-7 text-[13px] text-fg-muted transition-colors hover:border-line-strong focus-visible:border-fg focus-visible:outline-none disabled:opacity-50",
          className
        )}
      >
        {ASSIGNABLE.map((item) => (
          <option key={item} value={item}>
            {ROLE_LABELS[item]}
          </option>
        ))}
      </select>

      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-fg-faint"
      />
    </div>
  );
}

/** Инициалы из имени: аватаров у участников нет, а различать их взглядом надо. */
function initials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

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
      <ul className="flex flex-col divide-y divide-line border-y border-line">
        {members.map((member) => (
          <li key={member.userId} className="flex items-center gap-3.5 py-3.5">
            <span
              aria-hidden
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line bg-surface font-mono text-[11px] uppercase text-fg-subtle"
            >
              {initials(member.fullName)}
            </span>

            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm text-fg">
                {member.fullName}
                {member.isSelf && (
                  <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.12em] text-fg-faint">
                    это вы
                  </span>
                )}
              </span>
              <span className="mt-0.5 truncate text-[12px] text-fg-subtle">
                {member.email}
                {member.jobTitle ? ` · ${member.jobTitle}` : ""}
              </span>
            </div>

            {canManage && member.role !== "owner" ? (
              <RoleSelect
                value={member.role}
                disabled={isPending}
                onChange={(role) =>
                  runAction(updateMemberRoleAction(member.userId, role))
                }
                label={`Роль участника ${member.fullName}`}
                className="h-8"
              />
            ) : (
              <span
                className={cn(
                  "shrink-0 rounded border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em]",
                  member.role === "owner"
                    ? "border-line-strong text-fg-muted"
                    : "border-line text-fg-faint"
                )}
              >
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
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-fg-faint">
            Приглашения ждут ответа
          </span>

          <ul className="flex flex-col divide-y divide-line-soft">
            {invites.map((invite) => (
              <li key={invite.id} className="flex items-center gap-3 py-2.5">
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[13px] text-fg-muted">
                    {invite.email}
                  </span>
                  <span className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-fg-faint">
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
          className="flex flex-col gap-3 border-t border-line pt-5"
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

            <RoleSelect
              value={role}
              onChange={setRole}
              label="Роль приглашаемого"
              className="h-11"
            />

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
