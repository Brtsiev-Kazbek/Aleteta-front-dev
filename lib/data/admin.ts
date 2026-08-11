import "server-only";

import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/**
 * Данные для администратора установки.
 *
 * ДВА КЛИЕНТА, И ПОРЯДОК МЕЖДУ НИМИ КРИТИЧЕН. Право проверяется клиентом,
 * работающим под правами вошедшего: политика на `profiles` не даст прочитать
 * чужую строку, поэтому подделать ответ нельзя. И только после этого в дело
 * идёт служебный клиент, который политики обходит.
 *
 * Обратный порядок — сначала данные, потом проверка — выглядел бы так же и был
 * бы дырой: любой вошедший получил бы весь журнал заданий по всем
 * пространствам, пока кто-нибудь не заметил.
 *
 * ПОЧЕМУ ВООБЩЕ СЛУЖЕБНЫЙ КЛИЕНТ. Администратор установки по определению
 * смотрит поверх арендаторов: сколько пространств, где встала очередь, куда
 * уходит расход. Политики на всех таблицах привязаны к членству в
 * пространстве, и обойти их изнутри нельзя — можно только добавить для
 * администратора отдельные политики на каждую таблицу. Это восемь политик,
 * которые придётся держать в согласии; одна проверка в одном месте надёжнее.
 */

export interface AdminGuard {
  userId: string;
  email: string;
  fullName: string;
}

/**
 * Пускает дальше только администратора установки.
 *
 * Не бросает исключение, а уводит: для человека без прав раздела просто не
 * существует, и страница ошибки сообщила бы ему, что он что-то нашёл.
 */
export async function requirePlatformAdmin(): Promise<AdminGuard> {
  /*
   * Без базы раздела не существует. Проверка стоит первой, потому что
   * посредник (middleware) без переменных Supabase пропускает всё подряд —
   * иначе на свежем клоне репозитория не открылся бы даже лендинг.
   */
  if (!isSupabaseConfigured()) redirect("/dashboard");

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login?next=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, platform_role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.platform_role !== "admin") redirect("/dashboard");

  return {
    userId: profile.id,
    email: profile.email ?? "",
    fullName: profile.full_name ?? "",
  };
}

/* ------------------------------------------------------------------ */

export interface AdminWorkspace {
  id: string;
  name: string;
  plan: string;
  createdAt: string;
  archivedAt: string | null;
  members: number;
  cases: number;
  documents: number;
}

export interface AdminJob {
  id: string;
  task: string;
  status: string;
  workspaceName: string;
  model: string | null;
  attempts: number;
  cost: number;
  createdAt: string;
  finishedAt: string | null;
  error: string | null;
}

/**
 * Отчёт не собрался — и почему.
 *
 * Служебный ключ живёт только в переменных окружения площадки: репозиторий
 * открытый, и класть его туда нельзя. Значит, вполне обычен случай, когда
 * приложение развёрнуто, а ключа нет, — и падать пятисотой в этом случае
 * неправильно: администратор увидит стек вместо объяснения и пойдёт искать
 * ошибку в коде.
 */
export interface AdminUnavailable {
  reason: string;
}

export interface AdminOverview {
  totals: {
    workspaces: number;
    users: number;
    cases: number;
    documents: number;
    pages: number;
    entities: number;
  };
  /** Очередь по состояниям — то, из-за чего сюда и заходят. */
  queue: Record<string, number>;
  spend: {
    days: number;
    requests: number;
    failed: number;
    tokensIn: number;
    tokensOut: number;
    cost: number;
  };
  workspaces: AdminWorkspace[];
  jobs: AdminJob[];
}

/** Сколько дней попадает в отчёт о расходе. */
const SPEND_DAYS = 30;

/** Сколько последних заданий показываем. */
const JOB_LIMIT = 20;

export async function loadAdminOverview(): Promise<
  AdminOverview | AdminUnavailable
> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      reason:
        "Не задан SUPABASE_SERVICE_ROLE_KEY. Раздел смотрит поверх всех " +
        "пространств, а политики доступа привязаны к членству — без " +
        "служебного ключа собрать сводку нельзя.",
    };
  }

  const supabase = createAdminClient();

  const since = new Date(
    Date.now() - SPEND_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  /*
   * Счётчики берём через `head: true`: нужен только `count`, и тащить строки
   * ради их числа незачем. На четырёх пространствах разницы нет, на четырёх
   * тысячах — это разница между страницей и таймаутом.
   */
  const [
    workspaces,
    profiles,
    cases,
    documents,
    pages,
    entities,
    members,
    jobs,
    spendRows,
  ] = await Promise.all([
    supabase
      .from("workspaces")
      .select("id, name, plan, created_at, archived_at")
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("cases").select("workspace_id"),
    supabase.from("documents").select("workspace_id"),
    supabase.from("document_pages").select("id", { count: "exact", head: true }),
    supabase.from("entities").select("id", { count: "exact", head: true }),
    supabase.from("workspace_members").select("workspace_id"),
    supabase
      .from("ai_jobs")
      .select(
        "id, task, status, workspace_id, model, attempts, cost, created_at, finished_at, error"
      )
      .order("created_at", { ascending: false })
      .limit(JOB_LIMIT),
    supabase
      .from("ai_jobs")
      .select("status, tokens_in, tokens_out, cost")
      .gte("created_at", since),
  ]);

  const workspaceRows = workspaces.data ?? [];
  const names = new Map(workspaceRows.map((row) => [row.id, row.name]));

  /** Сколько строк приходится на каждое пространство. */
  function countBy(rows: { workspace_id: string }[] | null) {
    const map = new Map<string, number>();
    for (const row of rows ?? []) {
      map.set(row.workspace_id, (map.get(row.workspace_id) ?? 0) + 1);
    }
    return map;
  }

  const memberCounts = countBy(members.data);
  const caseCounts = countBy(cases.data);
  const documentCounts = countBy(documents.data);

  const queue: Record<string, number> = {};
  const spend = {
    days: SPEND_DAYS,
    requests: 0,
    failed: 0,
    tokensIn: 0,
    tokensOut: 0,
    cost: 0,
  };

  for (const row of spendRows.data ?? []) {
    spend.requests += 1;
    if (row.status === "failed") spend.failed += 1;
    spend.tokensIn += row.tokens_in ?? 0;
    spend.tokensOut += row.tokens_out ?? 0;
    spend.cost += Number(row.cost ?? 0);
  }

  /*
   * Состояния очереди считаем по всей таблице, а не за тридцать дней: задание,
   * застрявшее в работе два месяца назад, — ровно то, ради чего этот раздел и
   * нужен, и выпадать из отчёта оно не должно.
   */
  const { data: statusRows } = await supabase.from("ai_jobs").select("status");
  for (const row of statusRows ?? []) {
    queue[row.status] = (queue[row.status] ?? 0) + 1;
  }

  return {
    totals: {
      workspaces: workspaceRows.length,
      users: profiles.count ?? 0,
      cases: cases.data?.length ?? 0,
      documents: documents.data?.length ?? 0,
      pages: pages.count ?? 0,
      entities: entities.count ?? 0,
    },
    queue,
    spend,
    workspaces: workspaceRows.map((row) => ({
      id: row.id,
      name: row.name,
      plan: row.plan ?? "free",
      createdAt: row.created_at,
      archivedAt: row.archived_at,
      members: memberCounts.get(row.id) ?? 0,
      cases: caseCounts.get(row.id) ?? 0,
      documents: documentCounts.get(row.id) ?? 0,
    })),
    jobs: (jobs.data ?? []).map((row) => ({
      id: row.id,
      task: row.task,
      status: row.status,
      workspaceName: names.get(row.workspace_id) ?? "—",
      model: row.model,
      attempts: row.attempts ?? 0,
      cost: Number(row.cost ?? 0),
      createdAt: row.created_at,
      finishedAt: row.finished_at,
      error: row.error,
    })),
  };
}
