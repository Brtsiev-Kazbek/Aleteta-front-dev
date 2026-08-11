"use client";

import { useState } from "react";
import { ShieldCheck, ShieldOff } from "lucide-react";

import { setPlatformRoleAction } from "@/app/actions/admin";
import { ActionButton } from "@/components/admin/ActionButton";
import { Panel } from "@/components/layout/Panel";
import { cn, formatDate } from "@/lib/utils";
import type { AdminUser } from "@/lib/data/admin";

/**
 * Люди установки и их права.
 *
 * ЕДИНСТВЕННОЕ ПРАВО, КОТОРЫМ УПРАВЛЯЮТ ОТСЮДА, — администратор установки.
 * Роли внутри пространства (владелец, участник, наблюдатель) сюда не вынесены
 * нарочно: ими распоряжается владелец пространства, и подменять его решения с
 * площадки — значит однажды сделать это по ошибке и без следа.
 *
 * ЗАЩИТА ОТ САМОЗАПИРАНИЯ ЖИВЁТ В БАЗЕ, а не здесь: снять роль с себя и снять
 * её с последнего администратора запрещает функция. Интерфейс лишь заранее
 * гасит кнопку на своей строке — чтобы человек не узнавал об этом из отказа.
 */
export function UsersTable({
  users,
  currentUserId,
}: {
  users: AdminUser[];
  currentUserId: string;
}) {
  const [query, setQuery] = useState("");

  const admins = users.filter((user) => user.role === "admin").length;

  const visible = users.filter((user) => {
    const needle = query.trim().toLowerCase();
    if (!needle) return true;
    return (
      user.email.toLowerCase().includes(needle) ||
      (user.fullName ?? "").toLowerCase().includes(needle)
    );
  });

  return (
    <Panel
      title="Пользователи"
      meta={`${admins} ${admins === 1 ? "администратор" : "администратора"} установки`}
      bodyClassName="p-0"
      action={
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Имя или почта"
          className="h-9 w-64 rounded-lg border border-line bg-bg px-3 text-body text-fg outline-none transition-colors placeholder:text-fg-faint focus:border-fg"
        />
      }
    >
      {visible.length === 0 ? (
        <p className="px-5 py-8 text-body text-fg-subtle">Ничего не нашлось.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[54rem] border-collapse">
            <thead>
              <tr className="border-b border-line">
                <th className="whitespace-nowrap px-3 py-2.5 pl-5 text-left font-mono text-label uppercase text-fg-faint">
                  Человек
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 text-left font-mono text-label uppercase text-fg-faint">
                  Роль установки
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 text-right font-mono text-label uppercase text-fg-faint">
                  Пространств
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 text-left font-mono text-label uppercase text-fg-faint">
                  Активность
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 text-left font-mono text-label uppercase text-fg-faint">
                  Зарегистрирован
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 pr-5 text-right font-mono text-label uppercase text-fg-faint">
                  Действия
                </th>
              </tr>
            </thead>

            <tbody>
              {visible.map((user) => {
                const isSelf = user.id === currentUserId;
                const isAdmin = user.role === "admin";

                return (
                  <tr
                    key={user.id}
                    className="border-b border-line-soft last:border-b-0 hover:bg-bg"
                  >
                    <td className="min-w-0 py-3 pl-5 pr-3">
                      <span className="block truncate text-body text-fg">
                        {user.fullName || user.email}
                      </span>
                      <span className="mt-0.5 block truncate font-mono text-label uppercase text-fg-faint">
                        {user.email}
                        {user.jobTitle ? ` · ${user.jobTitle}` : ""}
                      </span>
                    </td>

                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-label uppercase",
                          isAdmin
                            ? "border-brand-line bg-brand-soft text-brand-strong"
                            : "border-line bg-bg text-fg-subtle"
                        )}
                      >
                        {isAdmin ? "Администратор" : "Пользователь"}
                        {isSelf && " · это вы"}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-3 py-3 text-right font-mono text-body tabular-nums text-fg">
                      {user.workspaces}
                      {user.owns > 0 && (
                        <span className="ml-1.5 font-mono text-label uppercase text-fg-faint">
                          вл. {user.owns}
                        </span>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-3 py-3 font-mono text-label uppercase text-fg-faint">
                      {user.lastActivityAt
                        ? formatDate(user.lastActivityAt)
                        : "не было"}
                    </td>

                    <td className="whitespace-nowrap px-3 py-3 font-mono text-label uppercase text-fg-faint">
                      {formatDate(user.createdAt)}
                    </td>

                    <td className="py-3 pl-3 pr-5 text-right">
                      <ActionButton
                        tone={isAdmin ? "quiet" : "primary"}
                        disabled={isSelf}
                        confirm={
                          isAdmin
                            ? `Снять права администратора установки с ${user.email}?`
                            : `Выдать ${user.email} права администратора установки? Он увидит все пространства и сможет менять тарифы.`
                        }
                        action={() =>
                          setPlatformRoleAction(
                            user.id,
                            isAdmin ? "user" : "admin"
                          )
                        }
                      >
                        {isAdmin ? (
                          <>
                            <ShieldOff className="h-3 w-3" />
                            Снять права
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="h-3 w-3" />
                            Сделать админом
                          </>
                        )}
                      </ActionButton>
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
