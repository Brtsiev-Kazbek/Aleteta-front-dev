"use server";

import { revalidatePath } from "next/cache";

import { requirePlatformAdmin, type AiTask, type PlatformRole } from "@/lib/data/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * Управляющие действия администратора установки.
 *
 * ПРАВО ПРОВЕРЯЕТСЯ ДВАЖДЫ, И ЭТО НЕ ЛИШНЕЕ. Здесь — чтобы не выполнять
 * бессмысленную работу и вернуть человеку понятный отказ. В базе — потому что
 * серверное действие в Next доступно по сети всякому, кто узнал его
 * идентификатор, и единственная настоящая граница проходит по функции
 * `platform_*`, которая сама спрашивает `app.is_platform_admin()`.
 *
 * ФОРМА ОТВЕТА ОДНА НА ВСЕ ДЕЙСТВИЯ: `{ ok }` либо `{ ok: false, error }`.
 * Исключение из серверного действия долетает до клиента обезличенным — Next
 * прячет текст в бою, — и человек видит «что-то пошло не так» вместо «это
 * последний администратор». Текст отказа несёт смысл, ради которого проверки и
 * писались, поэтому он возвращается значением.
 */

export interface ActionResult {
  ok: boolean;
  error?: string;
  /** Сколько строк затронуто — для массовых операций. */
  count?: number;
}

/** Общая обвязка: право, вызов, обновление страницы. */
async function run(
  call: (
    supabase: ReturnType<typeof createClient>
  ) => PromiseLike<{ error: { message: string } | null; data?: unknown }>
): Promise<ActionResult> {
  try {
    await requirePlatformAdmin();
  } catch {
    return { ok: false, error: "Недостаточно прав." };
  }

  const supabase = createClient();
  const { error, data } = await call(supabase);

  if (error) return { ok: false, error: error.message };

  /*
   * Раздел объявлен `force-dynamic`, но серверное действие не перерисовывает
   * страницу само: без этой строки таблица останется с прежними числами, и
   * человек нажмёт кнопку второй раз.
   */
  revalidatePath("/admin", "layout");

  return { ok: true, count: typeof data === "number" ? data : undefined };
}

/* ------------------------------------------------------------------ */

export async function setPlatformRoleAction(
  userId: string,
  role: PlatformRole
): Promise<ActionResult> {
  return run((supabase) =>
    supabase.rpc("platform_set_role", { target_user: userId, new_role: role })
  );
}

export async function setWorkspacePlanAction(
  workspaceId: string,
  plan: string
): Promise<ActionResult> {
  return run((supabase) =>
    supabase.rpc("platform_set_plan", {
      target_workspace: workspaceId,
      new_plan: plan,
    })
  );
}

export async function setWorkspaceArchivedAction(
  workspaceId: string,
  archived: boolean
): Promise<ActionResult> {
  return run((supabase) =>
    supabase.rpc("platform_set_workspace_archived", {
      target_workspace: workspaceId,
      archived,
    })
  );
}

export async function requeueJobAction(jobId: string): Promise<ActionResult> {
  return run((supabase) =>
    supabase.rpc("platform_requeue_job", { target_job: jobId })
  );
}

export async function cancelJobAction(jobId: string): Promise<ActionResult> {
  return run((supabase) =>
    supabase.rpc("platform_cancel_job", { target_job: jobId })
  );
}

export async function requeueFailedAction(
  task?: AiTask
): Promise<ActionResult> {
  return run((supabase) =>
    supabase.rpc("platform_requeue_failed", { task_filter: task })
  );
}
