import Link from "next/link";
import { ArrowLeft, Building2, Coins, Layers, ListChecks } from "lucide-react";

import { Panel } from "@/components/layout/Panel";
import { AdminJobs } from "@/components/admin/AdminJobs";
import { AdminQueue } from "@/components/admin/AdminQueue";
import { AdminWorkspaces } from "@/components/admin/AdminWorkspaces";
import { loadAdminOverview, requirePlatformAdmin } from "@/lib/data/admin";
import { plural } from "@/lib/utils";

/*
 * Раздел читает состояние установки целиком, поэтому кэшировать его нельзя:
 * весь смысл в том, что цифры свежие.
 */
export const dynamic = "force-dynamic";

/**
 * Панель администратора установки.
 *
 * КОМУ. Не владельцу пространства — тот всё своё видит в настройках. Здесь
 * человек, который отвечает за установку целиком: сколько арендаторов, не
 * встала ли очередь заданий, куда уходит расход на модель.
 *
 * ЧТО ПОКАЗЫВАЕМ ТОЛЬКО НАСТОЯЩЕЕ. Ни одного показателя, который нельзя
 * посчитать по базе прямо сейчас. Панель администратора с придуманными
 * графиками опаснее её отсутствия: по ней принимают решения.
 *
 * ПОРЯДОК БЛОКОВ — ПОРЯДОК ТРЕВОГИ. Сначала очередь: застрявшее задание видно
 * пользователю как «ничего не происходит», и узнать об этом надо первым.
 * Потом расход — вторая вещь, которая может внезапно кончиться. Дальше
 * пространства и журнал, за которыми приходят разбираться, а не следить.
 */
export default async function AdminPage() {
  await requirePlatformAdmin();
  const overview = await loadAdminOverview();

  if ("reason" in overview) return <Unavailable reason={overview.reason} />;

  const totals = [
    {
      icon: Building2,
      value: overview.totals.workspaces,
      label: plural(
        overview.totals.workspaces,
        "пространство",
        "пространства",
        "пространств"
      ),
    },
    {
      icon: Layers,
      value: overview.totals.users,
      label: plural(
        overview.totals.users,
        "пользователь",
        "пользователя",
        "пользователей"
      ),
    },
    {
      icon: ListChecks,
      value: overview.totals.cases,
      label: plural(overview.totals.cases, "дело", "дела", "дел"),
    },
    {
      icon: Coins,
      value: overview.totals.pages,
      label: plural(
        overview.totals.pages,
        "страница распознана",
        "страницы распознаны",
        "страниц распознано"
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-bg">
      {/* Шапка: та же тёмная полоса, что в кабинете, — это одна установка */}
      <header className="relative overflow-hidden bg-inverse">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="mesh-dark absolute inset-0 opacity-90" />
          <div className="bg-grid-dark absolute inset-0 opacity-50" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-inverse" />
        </div>

        <div className="relative mx-auto max-w-6xl px-8 pb-16 pt-8">
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-1.5 font-mono text-label uppercase text-inverse-fg/40 transition-colors hover:text-inverse-fg"
          >
            <ArrowLeft className="h-3 w-3 transition-transform duration-200 group-hover:-translate-x-0.5" />
            В кабинет
          </Link>

          <span className="mt-6 block font-mono text-label uppercase text-brand-line/70">
            Администратор установки
          </span>

          <h1 className="mt-3 text-heading font-medium text-inverse-fg">
            Состояние установки
          </h1>

          <p className="mt-2 max-w-2xl text-body-lg text-inverse-fg/55">
            Всё, что здесь показано, посчитано по базе на момент открытия
            страницы.
          </p>

          <ul className="mt-9 grid grid-cols-1 gap-3 border-t border-inverse-fg/10 pt-6 sm:grid-cols-2 lg:grid-cols-4">
            {totals.map((item) => (
              <li
                key={item.label}
                className="glass flex items-center gap-3.5 rounded-2xl px-4 py-3"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-inverse-fg/10 text-inverse-fg/70">
                  <item.icon className="h-4 w-4" />
                </span>

                <span className="flex min-w-0 flex-col">
                  <span className="font-mono text-title-sm tabular-nums leading-none text-inverse-fg">
                    {item.value}
                  </span>
                  <span className="mt-1.5 truncate font-mono text-label uppercase text-inverse-fg/40">
                    {item.label}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-8 pb-16">
        <div className="relative z-10 -mt-8 grid gap-4 lg:grid-cols-12">
          <AdminQueue queue={overview.queue} className="lg:col-span-7" />

          <Panel title="Расход на модель" className="lg:col-span-5">
            <p className="font-mono text-label uppercase text-fg-faint">
              За {overview.spend.days} дней
            </p>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-mono text-display tabular-nums text-fg">
                {overview.spend.cost.toFixed(2)}
              </span>
              <span className="text-body text-fg-faint">$</span>
            </div>

            <dl className="mt-5 flex flex-col divide-y divide-line-soft border-t border-line-soft">
              {[
                { label: "Запросов", value: overview.spend.requests },
                { label: "Из них неудачных", value: overview.spend.failed },
                { label: "Токенов на вход", value: overview.spend.tokensIn },
                { label: "Токенов на выход", value: overview.spend.tokensOut },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-baseline justify-between gap-4 py-2.5"
                >
                  <dt className="font-mono text-label uppercase text-fg-faint">
                    {row.label}
                  </dt>
                  <dd className="font-mono text-body tabular-nums text-fg">
                    {row.value.toLocaleString("ru-RU")}
                  </dd>
                </div>
              ))}
            </dl>
          </Panel>
        </div>

        <div className="mt-4">
          <AdminWorkspaces workspaces={overview.workspaces} />
        </div>

        <div className="mt-4">
          <AdminJobs jobs={overview.jobs} />
        </div>
      </div>
    </div>
  );
}

/** Раздел есть, данных нет: объясняем причину, а не показываем нули. */
function Unavailable({ reason }: { reason: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-6">
      <div className="max-w-md rounded-2xl border border-line bg-surface p-7 text-center">
        <span className="font-mono text-label uppercase text-brand">
          Администрирование
        </span>
        <h1 className="mt-4 text-title font-medium text-fg">
          Сводка недоступна
        </h1>
        <p className="mt-3 text-body leading-relaxed text-fg-subtle">{reason}</p>

        <Link
          href="/dashboard"
          className="mt-6 inline-flex h-10 items-center rounded-lg border border-line bg-bg px-4 text-body text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
        >
          В кабинет
        </Link>
      </div>
    </div>
  );
}
