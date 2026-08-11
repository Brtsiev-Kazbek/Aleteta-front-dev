"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";

import { switchWorkspaceAction } from "@/app/actions/workspace";
import { cn } from "@/lib/utils";
import type { WorkspaceRole } from "@/types/rows";

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
      <p className="text-body leading-relaxed text-fg-subtle">
        У вас одно пространство. Появятся другие — когда вас пригласят в чужое.
      </p>
    );
  }

  return (
    <ul className="flex flex-col divide-y divide-line border-y border-line">
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
                isCurrent ? "cursor-default" : "hover:text-fg"
              )}
            >
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-body text-fg">
                  {workspace.name}
                </span>
                <span className="mt-0.5 font-mono text-label uppercase text-fg-faint">
                  {ROLE_LABELS[workspace.role]}
                </span>
              </div>

              {isCurrent ? (
                <span className="flex shrink-0 items-center gap-1.5 font-mono text-label uppercase text-fg-subtle">
                  <Check className="h-3 w-3" />
                  текущее
                </span>
              ) : isPending ? (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-fg-faint" />
              ) : (
                <span className="shrink-0 border-b border-line-strong pb-0.5 text-body text-fg-soft">
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
