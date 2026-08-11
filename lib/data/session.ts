import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export interface SessionContext {
  userId: string;
  email: string;
  fullName: string;
  workspaceId: string;
  workspaceName: string;
  /**
   * Администратор установки, а не пространства.
   *
   * Нужен здесь, а не только на странице раздела: без него сайдбар не знает,
   * показывать ли пункт «Администрирование», и либо показывает его всем, либо
   * не показывает никому.
   */
  isPlatformAdmin: boolean;
}

/**
 * Текущий пользователь и его рабочее пространство.
 *
 * Пространство создаётся триггером при регистрации, поэтому у вошедшего оно
 * есть всегда. Если его вдруг нет — это сломанные данные, а не обычный случай,
 * и притворяться, что всё хорошо, вредно: лучше упасть явно.
 */
export async function requireSession(): Promise<SessionContext> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, last_workspace_id, platform_role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw new Error(`Не удалось прочитать профиль: ${error.message}`);
  if (!profile) throw new Error("Профиль не найден — проверьте миграции.");

  // last_workspace_id может отставать, если человека добавили в чужое
  // пространство: берём его, иначе первое доступное по членству.
  let workspaceId = profile.last_workspace_id;

  if (!workspaceId) {
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    workspaceId = membership?.workspace_id ?? null;
  }

  if (!workspaceId) {
    throw new Error("У пользователя нет рабочего пространства.");
  }

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, name")
    .eq("id", workspaceId)
    .maybeSingle();

  return {
    userId: user.id,
    email: profile.email,
    fullName: profile.full_name ?? profile.email,
    workspaceId,
    workspaceName: workspace?.name ?? "Рабочее пространство",
    isPlatformAdmin: profile.platform_role === "admin",
  };
}

/** Сессия там, где отсутствие входа — не ошибка (лендинг, публичные страницы). */
export async function getOptionalSession(): Promise<SessionContext | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;
  return requireSession();
}
