import "server-only";

import { redirect } from "next/navigation";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

/**
 * Данные для администратора установки.
 *
 * ПРАВО ПРОВЕРЯЕТ БАЗА, А НЕ ПРИЛОЖЕНИЕ. Каждая функция `platform_*` объявлена
 * `security definer` и начинается с `app.is_platform_admin()`. Поэтому здесь
 * работает обычный клиент вошедшего: даже если страницу однажды откроют
 * обходным путём, база ответит отказом.
 *
 * Первая версия раздела ходила служебным ключом, обходящим политики. Работало,
 * но требовало держать ключ в переменных площадки и означало: любая ошибка в
 * коде страницы — утечка всех арендаторов разом. Проверка, живущая в одном
 * месте внутри базы, надёжнее восьми политик и одного «не забыть».
 *
 * ОТКАЗ — ЭТО ДАННЫЕ, А НЕ ИСКЛЮЧЕНИЕ. Функции могут не существовать (миграция
 * не накатана) или ответить отказом. Оба случая обычны при развёртывании, и
 * страница обязана объяснить их словами, а не стеком.
 */

type Rpc = Database["public"]["Functions"];

export interface AdminGuard {
  userId: string;
  email: string;
  fullName: string;
}

/**
 * Пускает дальше только администратора установки.
 *
 * Уводит, а не бросает: для человека без прав раздела просто не существует, и
 * страница ошибки сообщила бы ему, что он что-то нашёл.
 */
export async function requirePlatformAdmin(): Promise<AdminGuard> {
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
/*  ТИПЫ                                                               */
/* ------------------------------------------------------------------ */

export type JobStatus = Database["public"]["Enums"]["job_status"];
export type AiTask = Database["public"]["Enums"]["ai_task"];
export type PlatformRole = Database["public"]["Enums"]["platform_role"];

export interface AdminTotals {
  users: number;
  usersNew7d: number;
  workspaces: number;
  workspacesArchived: number;
  cases: number;
  documents: number;
  entities: number;
  pages: number;
  storageBytes: number;
  jobs30d: number;
  cost30d: number;
  tokensIn30d: number;
  tokensOut30d: number;
  failureRate: number;
}

export interface QueueRow {
  status: JobStatus;
  jobs: number;
  oldest: string | null;
}

export interface SpendDay {
  day: string;
  jobs: number;
  failed: number;
  tokensIn: number;
  tokensOut: number;
  cost: number;
}

export interface AdminWorkspace {
  id: string;
  name: string;
  slug: string;
  plan: string;
  ownerEmail: string | null;
  members: number;
  cases: number;
  documents: number;
  storageBytes: number;
  cost30d: number;
  lastActivityAt: string | null;
  archivedAt: string | null;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string | null;
  jobTitle: string | null;
  role: PlatformRole;
  workspaces: number;
  owns: number;
  lastActivityAt: string | null;
  createdAt: string;
}

export interface AdminJob {
  id: string;
  task: AiTask;
  status: JobStatus;
  workspaceName: string | null;
  actorEmail: string | null;
  model: string | null;
  attempts: number;
  progress: number;
  tokensIn: number;
  tokensOut: number;
  cost: number;
  error: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
}

/** Раздел открылся, а данные не пришли. Всегда с причиной. */
export interface AdminFailure {
  reason: string;
}

export function isFailure<T>(value: T | AdminFailure): value is AdminFailure {
  return typeof value === "object" && value !== null && "reason" in value;
}

/* ------------------------------------------------------------------ */
/*  ЧТЕНИЕ                                                             */
/* ------------------------------------------------------------------ */

/**
 * Превращает отказ базы в человеческую причину.
 *
 * Самая частая причина здесь — не накатанная миграция: код раздела уехал на
 * площадку раньше функций. Сообщение Postgres об этом («function ... does not
 * exist») администратору ничего не говорит, поэтому подменяем его на понятное.
 */
function explain(message: string): string {
  if (/does not exist|schema cache/i.test(message)) {
    return (
      "В базе нет функций раздела. Накатите миграцию " +
      "supabase/migrations/20260811090000_platform_admin.sql — до этого " +
      "показывать нечего."
    );
  }
  if (/администратору установки/i.test(message)) {
    return "База отказала: у этой учётной записи нет прав администратора установки.";
  }
  return message;
}

export async function loadOverview(): Promise<
  | {
      totals: AdminTotals;
      queue: QueueRow[];
      spend: SpendDay[];
    }
  | AdminFailure
> {
  const supabase = createClient();

  const [overview, queue, spend] = await Promise.all([
    supabase.rpc("platform_overview"),
    supabase.rpc("platform_queue"),
    supabase.rpc("platform_spend_daily", { days: 30 }),
  ]);

  const failed = overview.error ?? queue.error ?? spend.error;
  if (failed) return { reason: explain(failed.message) };

  const row = (overview.data as Rpc["platform_overview"]["Returns"])?.[0];
  if (!row) return { reason: "База вернула пустую сводку." };

  return {
    totals: {
      users: Number(row.users ?? 0),
      usersNew7d: Number(row.users_new_7d ?? 0),
      workspaces: Number(row.workspaces ?? 0),
      workspacesArchived: Number(row.workspaces_archived ?? 0),
      cases: Number(row.cases ?? 0),
      documents: Number(row.documents ?? 0),
      entities: Number(row.entities ?? 0),
      pages: Number(row.pages ?? 0),
      storageBytes: Number(row.storage_bytes ?? 0),
      jobs30d: Number(row.jobs_30d ?? 0),
      cost30d: Number(row.cost_30d ?? 0),
      tokensIn30d: Number(row.tokens_in_30d ?? 0),
      tokensOut30d: Number(row.tokens_out_30d ?? 0),
      failureRate: Number(row.failure_rate ?? 0),
    },
    queue: (queue.data ?? []).map((item) => ({
      status: item.status,
      jobs: Number(item.jobs ?? 0),
      oldest: item.oldest,
    })),
    spend: (spend.data ?? []).map((item) => ({
      day: item.day,
      jobs: Number(item.jobs ?? 0),
      failed: Number(item.failed ?? 0),
      tokensIn: Number(item.tokens_in ?? 0),
      tokensOut: Number(item.tokens_out ?? 0),
      cost: Number(item.cost ?? 0),
    })),
  };
}

export async function loadWorkspaces(
  search?: string
): Promise<AdminWorkspace[] | AdminFailure> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("platform_workspaces", {
    search: search?.trim() || undefined,
    limit_count: 100,
    offset_count: 0,
  });

  if (error) return { reason: explain(error.message) };

  return (data ?? []).map((row) => ({
    id: row.workspace_id,
    name: row.name,
    slug: row.slug,
    plan: row.plan ?? "free",
    ownerEmail: row.owner_email,
    members: Number(row.members ?? 0),
    cases: Number(row.cases ?? 0),
    documents: Number(row.documents ?? 0),
    storageBytes: Number(row.storage_bytes ?? 0),
    cost30d: Number(row.cost_30d ?? 0),
    lastActivityAt: row.last_activity_at,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
  }));
}

export async function loadUsers(
  search?: string
): Promise<AdminUser[] | AdminFailure> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("platform_users", {
    search: search?.trim() || undefined,
    limit_count: 100,
    offset_count: 0,
  });

  if (error) return { reason: explain(error.message) };

  return (data ?? []).map((row) => ({
    id: row.user_id,
    email: row.email,
    fullName: row.full_name,
    jobTitle: row.job_title,
    role: row.platform_role,
    workspaces: Number(row.workspaces ?? 0),
    owns: Number(row.owns ?? 0),
    lastActivityAt: row.last_activity_at,
    createdAt: row.created_at,
  }));
}

export async function loadJobs(filters: {
  status?: JobStatus;
  task?: AiTask;
}): Promise<AdminJob[] | AdminFailure> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("platform_jobs", {
    status_filter: filters.status,
    task_filter: filters.task,
    limit_count: 100,
    offset_count: 0,
  });

  if (error) return { reason: explain(error.message) };

  return (data ?? []).map((row) => ({
    id: row.job_id,
    task: row.task,
    status: row.status,
    workspaceName: row.workspace_name,
    actorEmail: row.actor_email,
    model: row.model,
    attempts: Number(row.attempts ?? 0),
    progress: Number(row.progress ?? 0),
    tokensIn: Number(row.tokens_in ?? 0),
    tokensOut: Number(row.tokens_out ?? 0),
    cost: Number(row.cost ?? 0),
    error: row.error,
    createdAt: row.created_at,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
  }));
}
