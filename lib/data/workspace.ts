import "server-only";

import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/data/session";
import type { WorkspaceRole } from "@/types/rows";

/**
 * Данные страницы настроек.
 *
 * Собираются одним заходом: страница всё равно ждёт самый долгий запрос, а не
 * их сумму, и лишние круги к базе тут ничего не дают.
 */

export interface SettingsMember {
  userId: string;
  fullName: string;
  email: string;
  jobTitle: string | null;
  role: WorkspaceRole;
  /** Это вы: себя нельзя исключить кнопкой «Исключить». */
  isSelf: boolean;
}

export interface SettingsInvite {
  id: string;
  email: string;
  role: WorkspaceRole;
  expiresAt: string;
  createdAt: string;
}

export interface SettingsWorkspace {
  id: string;
  name: string;
  legalName: string;
  inn: string;
  address: string;
  plan: string;
}

export interface SettingsSnapshot {
  profile: {
    id: string;
    email: string;
    fullName: string;
    jobTitle: string;
    avatarPath: string | null;
    isPlatformAdmin: boolean;
  };
  workspace: SettingsWorkspace;
  /** Роль текущего пользователя в этом пространстве. */
  myRole: WorkspaceRole;
  members: SettingsMember[];
  invites: SettingsInvite[];
  /** Все пространства, где человек состоит, — для переключателя. */
  workspaces: { id: string; name: string; role: WorkspaceRole }[];
}

export async function loadSettings(): Promise<SettingsSnapshot> {
  const session = await requireSession();
  const supabase = createClient();

  const [profileResult, workspaceResult, membershipResult, invitesResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, email, full_name, job_title, avatar_path, platform_role")
        .eq("id", session.userId)
        .maybeSingle(),
      supabase
        .from("workspaces")
        .select("id, name, legal_name, inn, address, plan")
        .eq("id", session.workspaceId)
        .maybeSingle(),
      supabase
        .from("workspace_members")
        .select("workspace_id, user_id, role")
        .eq("workspace_id", session.workspaceId),
      supabase
        .from("workspace_invites")
        .select("id, email, role, expires_at, created_at")
        .eq("workspace_id", session.workspaceId)
        .is("accepted_at", null)
        .order("created_at", { ascending: false }),
    ]);

  const memberships = membershipResult.data ?? [];

  /*
   * Профили участников читаем отдельным запросом, а не вложенной выборкой:
   * так типы остаются простыми, а политика на profiles всё равно отдаст только
   * тех, с кем есть общее пространство.
   */
  const { data: profiles } = memberships.length
    ? await supabase
        .from("profiles")
        .select("id, email, full_name, job_title")
        .in(
          "id",
          memberships.map((member) => member.user_id)
        )
    : { data: [] };

  const profileById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile])
  );

  // Владелец наверху, наблюдатель внизу: список читается сверху вниз по правам.
  const ROLE_ORDER: WorkspaceRole[] = ["owner", "admin", "member", "viewer"];

  const members: SettingsMember[] = memberships
    .map((membership) => {
      const profile = profileById.get(membership.user_id);
      return {
        userId: membership.user_id,
        fullName: profile?.full_name ?? profile?.email ?? "Участник",
        email: profile?.email ?? "",
        jobTitle: profile?.job_title ?? null,
        role: membership.role,
        isSelf: membership.user_id === session.userId,
      };
    })
    .sort(
      (a, b) =>
        ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role) ||
        a.fullName.localeCompare(b.fullName, "ru")
    );

  const myRole =
    memberships.find((membership) => membership.user_id === session.userId)
      ?.role ?? "member";

  // Пространства для переключателя: своё плюс те, куда пригласили.
  const { data: myMemberships } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", session.userId);

  const workspaceIds = (myMemberships ?? []).map((row) => row.workspace_id);
  const { data: myWorkspaces } = workspaceIds.length
    ? await supabase.from("workspaces").select("id, name").in("id", workspaceIds)
    : { data: [] };

  const roleByWorkspace = new Map(
    (myMemberships ?? []).map((row) => [row.workspace_id, row.role])
  );

  const profile = profileResult.data;
  const workspace = workspaceResult.data;

  return {
    profile: {
      id: session.userId,
      email: profile?.email ?? session.email,
      fullName: profile?.full_name ?? session.fullName,
      jobTitle: profile?.job_title ?? "",
      avatarPath: profile?.avatar_path ?? null,
      isPlatformAdmin: profile?.platform_role === "admin",
    },
    workspace: {
      id: session.workspaceId,
      name: workspace?.name ?? session.workspaceName,
      legalName: workspace?.legal_name ?? "",
      inn: workspace?.inn ?? "",
      address: workspace?.address ?? "",
      plan: workspace?.plan ?? "free",
    },
    myRole,
    members,
    invites: (invitesResult.data ?? []).map((invite) => ({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expires_at,
      createdAt: invite.created_at,
    })),
    workspaces: (myWorkspaces ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      role: roleByWorkspace.get(row.id) ?? "member",
    })),
  };
}
