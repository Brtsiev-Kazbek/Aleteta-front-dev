"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";

import { switchWorkspaceAction } from "@/app/actions/workspace";
import { cn } from "@/lib/utils";
import type { WorkspaceRole } from "@/types/database";

const ROLE_LABELS: Record<WorkspaceRole, string> = {
  owner: "Владелец",
  admin: "Администратор",
  member: "Участник",
  viewer: "Наблюдатель",
};

/**
 * Переключатель пространств.
 *
 * Своё пространство есть у каждого, но приглашённый работает сразу в
 * нескольких — и без переключателя чужие дела для него просто недоступны.
 * Выбор запоминается в профиле, поэтому следующий вход открывается там же.
 */
export function WorkspaceSwitcher({
  workspaces,
  currentId,
}: {
  workspaces: { id: string; name: string; role: WorkspaceRole }[];
  currentId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (workspaces.length <= 1) {
    return (
      <p className="text-[13px] leading-relaxed text-stone-500">
        У вас одно пространство. Появятся другие — когда вас пригласят в чужое.
      </p>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-stone-200 border-y border-stone-200">
      {workspaces.map((workspace) => {
        const isCurrent = workspace.id === currentId;

        return (
          <li key={workspace.id}>
            <button
              type="button"
              disabled={isCurrent || isPending}
              onClick={() =>
                startTransition(async () => {
                  const result = await switchWorkspaceAction(workspace.id);
                  if (result.ok) {
                    // Дела и объекты читаются заново под новым пространством.
                    router.refresh();
                  }
                })
              }
              className={cn(
                "flex w-full items-center gap-3 py-3.5 text-left transition-colors",
                isCurrent ? "cursor-default" : "hover:text-stone-900"
              )}
            >
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm text-stone-900">
                  {workspace.name}
                </span>
                <span className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-stone-400">
                  {ROLE_LABELS[workspace.role]}
                </span>
              </div>

              {isCurrent ? (
                <span className="flex shrink-0 items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-stone-500">
                  <Check className="h-3 w-3" />
                  текущее
                </span>
              ) : isPending ? (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-stone-400" />
              ) : (
                <span className="shrink-0 border-b border-stone-300 pb-0.5 text-[13px] text-stone-600">
                  Перейти
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
