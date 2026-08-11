"use client";

import { useState, useTransition } from "react";
import { Archive, ArchiveRestore, Loader2 } from "lucide-react";

import {
  setWorkspaceArchivedAction,
  setWorkspacePlanAction,
} from "@/app/actions/admin";
import { ActionButton } from "@/components/admin/ActionButton";
import { Panel } from "@/components/layout/Panel";
import { cn, formatDate, formatFileSize } from "@/lib/utils";
import type { AdminWorkspace } from "@/lib/data/admin";

/**
 * Арендаторы установки: смотреть и управлять.
 *
 * ТАБЛИЦА, А НЕ КАРТОЧКИ. Пространства сравнивают между собой — где больше
 * дел, кто завёлся и не начал, куда уходит расход, — а сравнение построчно и
 * есть работа таблицы.
 *
 * ДВА ДЕЙСТВИЯ, И ОБА ОБРАТИМЫ. Тариф меняется выбором из списка, архив
 * снимается тем же нажатием, что ставится. Кнопки, стирающей чужую работу,
 * здесь нет и быть не должно: администратор установки отвечает за площадку, а
 * не за содержимое чужих дел.
 */

const PLANS = [
  { value: "free", label: "Знакомство" },
  { value: "pro", label: "Практика" },
  { value: "team", label: "Организация" },
];

export function WorkspacesTable({
  workspaces,
}: {
  workspaces: AdminWorkspace[];
}) {
  const [query, setQuery] = useState("");

  const visible = workspaces.filter((workspace) => {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return (
      workspace.name.toLowerCase().includes(needle) ||
      (workspace.ownerEmail ?? "").toLowerCase().includes(needle)
    );
  });

  return (
    <Panel
      title="Пространства"
      meta={`${visible.length} из ${workspaces.length}`}
      bodyClassName="p-0"
      action={
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Название или почта владельца"
          className="h-9 w-64 rounded-lg border border-line bg-bg px-3 text-body text-fg outline-none transition-colors placeholder:text-fg-faint focus:border-fg"
        />
      }
    >
      {visible.length === 0 ? (
        <p className="px-5 py-8 text-body text-fg-subtle">
          {workspaces.length === 0
            ? "Пространств пока нет."
            : "Ничего не нашлось."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[62rem] border-collapse">
            <thead>
              <tr className="border-b border-line">
                <Th className="pl-5">Пространство</Th>
                <Th>Тариф</Th>
                <Th align="right">Людей</Th>
                <Th align="right">Дел</Th>
                <Th align="right">Файлов</Th>
                <Th align="right">Объём</Th>
                <Th align="right">Расход 30д</Th>
                <Th>Активность</Th>
                <Th align="right" className="pr-5">
                  Действия
                </Th>
              </tr>
            </thead>

            <tbody>
              {visible.map((workspace) => (
                <tr
                  key={workspace.id}
                  className={cn(
                    "border-b border-line-soft last:border-b-0",
                    workspace.archivedAt ? "opacity-60" : "hover:bg-bg"
                  )}
                >
                  <td className="min-w-0 py-3 pl-5 pr-3">
                    <span className="block truncate text-body text-fg">
                      {workspace.name}
                    </span>
                    <span className="mt-0.5 block truncate font-mono text-label uppercase text-fg-faint">
                      {workspace.ownerEmail ?? "владелец не найден"}
                    </span>

                    {(workspace.archivedAt ||
                      (workspace.cases === 0 && workspace.documents === 0)) && (
                      <span className="mt-1.5 inline-flex gap-1.5">
                        {workspace.archivedAt ? (
                          <Chip tone="quiet">В архиве</Chip>
                        ) : (
                          <Chip tone="warn">Ни одного дела</Chip>
                        )}
                      </span>
                    )}
                  </td>

                  <td className="px-3 py-3">
                    <PlanSelect
                      workspaceId={workspace.id}
                      plan={workspace.plan}
                    />
                  </td>

                  <Td>{workspace.members}</Td>
                  <Td>{workspace.cases}</Td>
                  <Td>{workspace.documents}</Td>
                  <Td>{formatFileSize(workspace.storageBytes)}</Td>
                  <Td>${workspace.cost30d.toFixed(2)}</Td>

                  <td className="whitespace-nowrap px-3 py-3 font-mono text-label uppercase text-fg-faint">
                    {workspace.lastActivityAt
                      ? formatDate(workspace.lastActivityAt)
                      : "не было"}
                  </td>

                  <td className="py-3 pl-3 pr-5 text-right">
                    <ActionButton
                      tone={workspace.archivedAt ? "quiet" : "danger"}
                      confirm={
                        workspace.archivedAt
                          ? undefined
                          : `Отправить «${workspace.name}» в архив? Данные останутся на месте, вернуть можно тем же нажатием.`
                      }
                      action={() =>
                        setWorkspaceArchivedAction(
                          workspace.id,
                          !workspace.archivedAt
                        )
                      }
                    >
                      {workspace.archivedAt ? (
                        <>
                          <ArchiveRestore className="h-3 w-3" />
                          Вернуть
                        </>
                      ) : (
                        <>
                          <Archive className="h-3 w-3" />В архив
                        </>
                      )}
                    </ActionButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

/**
 * Выбор тарифа.
 *
 * Список, а не диалог: тариф меняют часто и всегда обратимо, а диалог на
 * каждое такое действие превращает работу в череду подтверждений, после чего
 * их перестают читать вовсе.
 */
function PlanSelect({
  workspaceId,
  plan,
}: {
  workspaceId: string;
  plan: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="relative inline-flex flex-col">
      <span className="inline-flex items-center gap-1.5">
        <select
          value={plan}
          disabled={pending}
          onChange={(event) => {
            const next = event.target.value;
            setError(null);
            startTransition(async () => {
              const result = await setWorkspacePlanAction(workspaceId, next);
              if (!result.ok) setError(result.error ?? "Не получилось.");
            });
          }}
          className="h-8 rounded-lg border border-line bg-bg px-2 text-caption text-fg outline-none transition-colors focus:border-fg disabled:opacity-50"
        >
          {PLANS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>

        {pending && <Loader2 className="h-3 w-3 animate-spin text-fg-faint" />}
      </span>

      {error && (
        <span className="mt-1 max-w-[14rem] text-caption text-danger-fg">
          {error}
        </span>
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ */

function Th({
  children,
  align = "left",
  className,
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <th
      className={cn(
        "whitespace-nowrap px-3 py-2.5 font-mono text-label uppercase text-fg-faint",
        align === "right" ? "text-right" : "text-left",
        className
      )}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td className="whitespace-nowrap px-3 py-3 text-right font-mono text-body tabular-nums text-fg">
      {children}
    </td>
  );
}

function Chip({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "quiet" | "warn";
}) {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 font-mono text-label uppercase",
        tone === "warn"
          ? "border-warn-line bg-warn-bg text-warn-fg"
          : "border-line bg-bg text-fg-faint"
      )}
    >
      {children}
    </span>
  );
}
