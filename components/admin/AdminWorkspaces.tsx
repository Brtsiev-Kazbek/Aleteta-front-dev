import { Panel } from "@/components/layout/Panel";
import { formatDate, plural } from "@/lib/utils";
import type { AdminWorkspace } from "@/lib/data/admin";

/**
 * Арендаторы установки.
 *
 * Таблицей, а не карточками: пространства сравнивают между собой — где больше
 * дел, кто завёлся и не начал работать, — а сравнение построчно и есть работа
 * таблицы. Карточки хороши там, где предметы выбирают, а не сопоставляют.
 *
 * Пустое пространство помечено отдельно: это самый частый повод сюда прийти —
 * человек зарегистрировался и не сделал ничего, и это сигнал не о базе, а о
 * продукте.
 */
export function AdminWorkspaces({
  workspaces,
}: {
  workspaces: AdminWorkspace[];
}) {
  return (
    <Panel
      title="Пространства"
      meta={`${workspaces.length} ${plural(
        workspaces.length,
        "арендатор",
        "арендатора",
        "арендаторов"
      )}`}
      bodyClassName="p-0"
    >
      {workspaces.length === 0 ? (
        <p className="px-5 py-6 text-body text-fg-subtle">
          Пространств пока нет.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] border-collapse">
            <thead>
              <tr className="border-b border-line">
                <Th className="pl-5">Название</Th>
                <Th>Тариф</Th>
                <Th align="right">Участников</Th>
                <Th align="right">Дел</Th>
                <Th align="right">Документов</Th>
                <Th align="right" className="pr-5">
                  Заведено
                </Th>
              </tr>
            </thead>

            <tbody>
              {workspaces.map((workspace) => {
                const isEmpty =
                  workspace.cases === 0 && workspace.documents === 0;

                return (
                  <tr
                    key={workspace.id}
                    className="border-b border-line-soft last:border-b-0 hover:bg-bg"
                  >
                    <td className="min-w-0 py-3 pl-5 pr-3">
                      <span className="block truncate text-body text-fg">
                        {workspace.name}
                      </span>

                      {(isEmpty || workspace.archivedAt) && (
                        <span className="mt-1 inline-flex items-center gap-2">
                          {workspace.archivedAt && (
                            <span className="rounded-full border border-line px-2 py-0.5 font-mono text-label uppercase text-fg-faint">
                              В архиве
                            </span>
                          )}
                          {isEmpty && !workspace.archivedAt && (
                            <span className="rounded-full border border-warn-line bg-warn-bg px-2 py-0.5 font-mono text-label uppercase text-warn-fg">
                              Ни одного дела
                            </span>
                          )}
                        </span>
                      )}
                    </td>

                    <td className="px-3 py-3">
                      <span className="rounded-full border border-line bg-bg px-2 py-0.5 font-mono text-label uppercase text-fg-subtle">
                        {workspace.plan}
                      </span>
                    </td>

                    <Td>{workspace.members}</Td>
                    <Td>{workspace.cases}</Td>
                    <Td>{workspace.documents}</Td>

                    <td className="whitespace-nowrap py-3 pl-3 pr-5 text-right font-mono text-label uppercase text-fg-faint">
                      {formatDate(workspace.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

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
      className={`whitespace-nowrap px-3 py-2.5 font-mono text-label uppercase text-fg-faint ${
        align === "right" ? "text-right" : "text-left"
      } ${className ?? ""}`}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return (
    <td className="px-3 py-3 text-right font-mono text-body tabular-nums text-fg">
      {children}
    </td>
  );
}
