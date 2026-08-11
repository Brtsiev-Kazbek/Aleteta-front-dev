import Link from "next/link";
import {
  ArrowRight,
  Building2,
  FileText,
  HardDrive,
  Layers,
  UserPlus,
  Users,
} from "lucide-react";

import { Panel } from "@/components/layout/Panel";
import { AdminFailureNotice } from "@/components/admin/AdminFailureNotice";
import { QueuePanel } from "@/components/admin/QueuePanel";
import { SpendChart } from "@/components/admin/SpendChart";
import { isFailure, loadOverview } from "@/lib/data/admin";
import { formatFileSize, plural } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Обзор установки.
 *
 * ПОРЯДОК БЛОКОВ — ПОРЯДОК ТРЕВОГИ, а не порядок важности вообще. Сначала
 * очередь: она ломается чаще всего и ломается тихо. Потом нагрузка и расход —
 * вторая вещь, которая кончается внезапно. Плитки со счётчиками идут после:
 * они отвечают на «как мы растём», а этот вопрос терпит до завтра.
 */
export default async function AdminOverviewPage() {
  const overview = await loadOverview();

  if (isFailure(overview)) {
    return (
      <div className="relative z-10 -mt-8">
        <AdminFailureNotice reason={overview.reason} />
      </div>
    );
  }

  const { totals, queue, spend } = overview;

  const tiles = [
    {
      icon: Building2,
      value: String(totals.workspaces),
      label: plural(totals.workspaces, "пространство", "пространства", "пространств"),
      hint:
        totals.workspacesArchived > 0
          ? `${totals.workspacesArchived} в архиве`
          : undefined,
    },
    {
      icon: Users,
      value: String(totals.users),
      label: plural(totals.users, "пользователь", "пользователя", "пользователей"),
      hint:
        totals.usersNew7d > 0 ? `+${totals.usersNew7d} за неделю` : undefined,
    },
    {
      icon: Layers,
      value: String(totals.cases),
      label: plural(totals.cases, "дело", "дела", "дел"),
      hint: `${totals.entities} ${plural(totals.entities, "объект", "объекта", "объектов")}`,
    },
    {
      icon: FileText,
      value: String(totals.documents),
      label: plural(totals.documents, "документ", "документа", "документов"),
      hint: `${totals.pages} ${plural(totals.pages, "страница", "страницы", "страниц")} распознано`,
    },
  ];

  return (
    <>
      <div className="relative z-10 -mt-8 grid gap-4 lg:grid-cols-12">
        <QueuePanel queue={queue} className="lg:col-span-5" />
        <SpendChart spend={spend} className="lg:col-span-7" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="rounded-2xl border border-line bg-surface p-5"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
              <tile.icon className="h-4 w-4" />
            </span>

            <span className="mt-4 block font-mono text-heading tabular-nums leading-none text-fg">
              {tile.value}
            </span>

            <span className="mt-2 block font-mono text-label uppercase text-fg-faint">
              {tile.label}
            </span>

            {tile.hint && (
              <span className="mt-1 block text-caption text-fg-subtle">
                {tile.hint}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <Panel title="Хранилище" className="lg:col-span-4">
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-bg text-fg-faint">
              <HardDrive className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <span className="block font-mono text-title tabular-nums text-fg">
                {formatFileSize(totals.storageBytes)}
              </span>
              <span className="mt-0.5 block text-caption text-fg-subtle">
                в загруженных файлах
              </span>
            </div>
          </div>
        </Panel>

        <Panel title="Задания за 30 дней" className="lg:col-span-8">
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
            {[
              { label: "Всего", value: totals.jobs30d.toLocaleString("ru-RU") },
              {
                label: "Доля отказов",
                value: `${Math.round(totals.failureRate * 100)}%`,
                alarming: totals.failureRate > 0.2,
              },
              {
                label: "Токенов на вход",
                value: totals.tokensIn30d.toLocaleString("ru-RU"),
              },
              {
                label: "Токенов на выход",
                value: totals.tokensOut30d.toLocaleString("ru-RU"),
              },
            ].map((row) => (
              <div key={row.label} className="flex flex-col">
                <dt className="font-mono text-label uppercase text-fg-faint">
                  {row.label}
                </dt>
                <dd
                  className={
                    row.alarming
                      ? "mt-1 font-mono text-title-sm tabular-nums text-danger-fg"
                      : "mt-1 font-mono text-title-sm tabular-nums text-fg"
                  }
                >
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>

          <Link
            href="/admin/jobs"
            className="group mt-5 inline-flex items-center gap-1.5 font-mono text-label uppercase text-fg-faint transition-colors hover:text-fg"
          >
            Открыть журнал заданий
            <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </Panel>
      </div>

      {totals.usersNew7d > 0 && (
        <div className="mt-4">
          <Panel title="За последнюю неделю">
            <span className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ok-bg text-ok">
                <UserPlus className="h-4 w-4" />
              </span>
              <span className="text-body text-fg">
                {totals.usersNew7d}{" "}
                {plural(
                  totals.usersNew7d,
                  "новая регистрация",
                  "новые регистрации",
                  "новых регистраций"
                )}
              </span>
            </span>
          </Panel>
        </div>
      )}
    </>
  );
}
