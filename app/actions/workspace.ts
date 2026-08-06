"use server";

import { revalidatePath } from "next/cache";

import {
  actionError,
  actionFail,
  actionOk,
  type ActionResult,
} from "@/lib/actions/result";
import { describeAuthError } from "@/lib/auth/messages";
import { getSiteUrl } from "@/lib/auth/site-url";
import { validateEmail, validateFullName } from "@/lib/auth/validation";
import { requireSession } from "@/lib/data/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { validateInn } from "@/lib/validation";
import type { WorkspaceRole } from "@/types/database";

/**
 * Профиль, реквизиты организации и состав участников.
 *
 * Всё, что здесь пишется, ограничено политиками в базе: роль участника меняет
 * владелец или админ, реквизиты — они же, свой профиль — сам человек. Проверки
 * в этом файле не заменяют политики, а дают внятный отказ вместо сухого
 * «нарушение политики доступа» от драйвера.
 */

/* ------------------------------------------------------------------ */
/*  ПРОФИЛЬ                                                            */
/* ------------------------------------------------------------------ */

export interface ProfilePatch {
  fullName: string;
  jobTitle?: string;
}

export async function updateProfileAction(
  patch: ProfilePatch
): Promise<ActionResult<null>> {
  const nameError = validateFullName(patch.fullName);
  if (nameError) return actionFail(nameError);

  try {
    const session = await requireSession();
    const supabase = createClient();

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: patch.fullName.trim(),
        job_title: patch.jobTitle?.trim() || null,
      })
      .eq("id", session.userId);

    if (error) return actionFail(error.message);

    revalidatePath("/dashboard/settings");
    revalidatePath("/", "layout");
    return actionOk(null);
  } catch (caught) {
    return actionError(caught, "Не удалось сохранить профиль.");
  }
}

/** Переключение текущего пространства — для тех, кого позвали в чужое. */
export async function switchWorkspaceAction(
  workspaceId: string
): Promise<ActionResult<null>> {
  try {
    const session = await requireSession();
    const supabase = createClient();

    const { error } = await supabase
      .from("profiles")
      .update({ last_workspace_id: workspaceId })
      .eq("id", session.userId);

    // Членство проверяет триггер в базе — здесь остаётся показать его отказ.
    if (error) return actionFail(error.message);

    revalidatePath("/", "layout");
    return actionOk(null);
  } catch (caught) {
    return actionError(caught, "Не удалось сменить пространство.");
  }
}

/* ------------------------------------------------------------------ */
/*  РЕКВИЗИТЫ ОРГАНИЗАЦИИ                                              */
/* ------------------------------------------------------------------ */

export interface WorkspacePatch {
  name: string;
  legalName?: string;
  inn?: string;
  address?: string;
}

export async function updateWorkspaceAction(
  patch: WorkspacePatch
): Promise<ActionResult<null>> {
  const name = patch.name.trim();
  if (!name) return actionFail("У пространства должно быть название.");
  if (name.length > 120) return actionFail("Название длиннее 120 знаков.");

  const inn = patch.inn?.trim() ?? "";
  const innError = validateInn(inn);
  if (innError) return actionFail(innError);

  try {
    const session = await requireSession();
    const supabase = createClient();

    const { error } = await supabase
      .from("workspaces")
      .update({
        name,
        legal_name: patch.legalName?.trim() || null,
        inn: inn || null,
        address: patch.address?.trim() || null,
      })
      .eq("id", session.workspaceId);

    if (error) {
      // Политика пускает только владельца и админа — говорим об этом прямо.
      return actionFail(
        /violates row-level security|permission denied/i.test(error.message)
          ? "Реквизиты меняет владелец или администратор пространства."
          : error.message
      );
    }

    revalidatePath("/dashboard/settings");
    revalidatePath("/", "layout");
    return actionOk(null);
  } catch (caught) {
    return actionError(caught, "Не удалось сохранить реквизиты.");
  }
}

/* ------------------------------------------------------------------ */
/*  УЧАСТНИКИ И ПРИГЛАШЕНИЯ                                            */
/* ------------------------------------------------------------------ */

const ASSIGNABLE_ROLES: WorkspaceRole[] = ["admin", "member", "viewer"];

export interface InviteResult {
  email: string;
  /** Письмо ушло. Без служебного ключа приглашение всё равно создаётся. */
  emailSent: boolean;
}

/**
 * Приглашение в пространство.
 *
 * Строка приглашения — источник истины: по ней членство выдаётся и при
 * регистрации нового человека, и при первом входе уже зарегистрированного.
 * Письмо — только уведомление, поэтому его неудача не отменяет приглашение.
 */
export async function inviteMemberAction(
  email: string,
  role: WorkspaceRole = "member"
): Promise<ActionResult<InviteResult>> {
  const address = email.trim().toLowerCase();

  const emailError = validateEmail(address);
  if (emailError) return actionFail(emailError);

  if (!ASSIGNABLE_ROLES.includes(role)) {
    return actionFail("Такую роль назначить нельзя.");
  }

  try {
    const session = await requireSession();
    const supabase = createClient();

    if (address === session.email.toLowerCase()) {
      return actionFail("Это ваш собственный адрес.");
    }

    // Уже в пространстве? Проверяем по профилям — почта участника видна
    // коллегам по политике на profiles.
    const { data: members } = await supabase
      .from("workspace_members")
      .select("user_id")
      .eq("workspace_id", session.workspaceId);

    if (members && members.length > 0) {
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .in(
          "id",
          members.map((member) => member.user_id)
        )
        .ilike("email", address)
        .maybeSingle();

      if (existing) return actionFail("Этот человек уже в пространстве.");
    }

    const { error } = await supabase.from("workspace_invites").insert({
      workspace_id: session.workspaceId,
      email: address,
      role,
      invited_by: session.userId,
    });

    if (error) {
      if (/duplicate key|unique/i.test(error.message)) {
        return actionFail("Приглашение на этот адрес уже отправлено.");
      }
      if (/violates row-level security|permission denied/i.test(error.message)) {
        return actionFail("Приглашать может владелец или администратор.");
      }
      return actionFail(error.message);
    }

    const emailSent = await sendInviteEmail(address, session.workspaceName);

    revalidatePath("/dashboard/settings");
    return actionOk({ email: address, emailSent });
  } catch (caught) {
    return actionError(caught, "Не удалось отправить приглашение.");
  }
}

/**
 * Письмо-приглашение отправляем служебным ключом: обычному клиенту служба
 * аутентификации такого не позволяет. Ключа может не быть — стенд разработчика
 * запускают и без него, поэтому неудача здесь не ошибка, а отсутствие письма.
 */
async function sendInviteEmail(
  email: string,
  workspaceName: string
): Promise<boolean> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return false;

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { workspace_name: workspaceName },
      redirectTo: `${getSiteUrl()}/auth/callback?next=%2Fdashboard`,
    });

    /*
     * Уже зарегистрированному письмо-приглашение не уходит — служба отвечает
     * отказом. Это не проблема: приглашение он получит при следующем входе,
     * функция accept_pending_invites его подхватит.
     */
    return !error;
  } catch {
    return false;
  }
}

export async function cancelInviteAction(
  inviteId: string
): Promise<ActionResult<null>> {
  try {
    await requireSession();
    const supabase = createClient();

    const { error } = await supabase
      .from("workspace_invites")
      .delete()
      .eq("id", inviteId);

    if (error) return actionFail(error.message);

    revalidatePath("/dashboard/settings");
    return actionOk(null);
  } catch (caught) {
    return actionError(caught, "Не удалось отозвать приглашение.");
  }
}

export async function updateMemberRoleAction(
  userId: string,
  role: WorkspaceRole
): Promise<ActionResult<null>> {
  if (!ASSIGNABLE_ROLES.includes(role) && role !== "owner") {
    return actionFail("Неизвестная роль.");
  }

  try {
    const session = await requireSession();
    const supabase = createClient();

    const { error } = await supabase
      .from("workspace_members")
      .update({ role })
      .eq("workspace_id", session.workspaceId)
      .eq("user_id", userId);

    if (error) {
      // Триггер в базе не даёт снять роль с последнего владельца.
      if (/последнего владельца/i.test(error.message)) {
        return actionFail(error.message);
      }
      if (/violates row-level security|permission denied/i.test(error.message)) {
        return actionFail("Роли меняет владелец или администратор.");
      }
      return actionFail(error.message);
    }

    revalidatePath("/dashboard/settings");
    return actionOk(null);
  } catch (caught) {
    return actionError(caught, "Не удалось изменить роль.");
  }
}

export async function removeMemberAction(
  userId: string
): Promise<ActionResult<null>> {
  try {
    const session = await requireSession();
    const supabase = createClient();

    const { error } = await supabase
      .from("workspace_members")
      .delete()
      .eq("workspace_id", session.workspaceId)
      .eq("user_id", userId);

    if (error) {
      if (/последнего владельца/i.test(error.message)) {
        return actionFail(error.message);
      }
      if (/violates row-level security|permission denied/i.test(error.message)) {
        return actionFail("Исключать участников может владелец или администратор.");
      }
      return actionFail(error.message);
    }

    revalidatePath("/dashboard/settings");
    return actionOk(null);
  } catch (caught) {
    return actionError(caught, "Не удалось исключить участника.");
  }
}

/* ------------------------------------------------------------------ */
/*  АВАТАР                                                             */
/* ------------------------------------------------------------------ */

/**
 * Путь для аватара. Как и с документами, файл кладёт браузер, а путь считает
 * сервер: первый сегмент — идентификатор пользователя, по нему хранилище и
 * решает, кому разрешена запись.
 */
export async function prepareAvatarUploadAction(
  fileName: string
): Promise<ActionResult<{ bucket: string; path: string }>> {
  try {
    const session = await requireSession();

    const extension = (fileName.split(".").pop() ?? "").toLowerCase();
    const safeExtension = /^(jpg|jpeg|png|webp)$/.test(extension)
      ? extension
      : "png";

    return actionOk({
      bucket: "avatars",
      // Имя фиксированное: старый аватар перезаписывается, а не копится в бакете.
      path: `${session.userId}/avatar.${safeExtension}`,
    });
  } catch (caught) {
    return actionError(caught, "Не удалось подготовить загрузку.");
  }
}

export async function saveAvatarPathAction(
  path: string
): Promise<ActionResult<null>> {
  try {
    const session = await requireSession();
    if (!path.startsWith(`${session.userId}/`)) {
      return actionFail("Чужой путь для аватара.");
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_path: path })
      .eq("id", session.userId);

    if (error) return actionFail(error.message);

    revalidatePath("/dashboard/settings");
    revalidatePath("/", "layout");
    return actionOk(null);
  } catch (caught) {
    return actionError(caught, "Не удалось сохранить аватар.");
  }
}

/* ------------------------------------------------------------------ */
/*  ВЫХОД ИЗ ПРОСТРАНСТВА                                              */
/* ------------------------------------------------------------------ */

export async function leaveWorkspaceAction(): Promise<ActionResult<null>> {
  try {
    const session = await requireSession();
    const supabase = createClient();

    const { error } = await supabase
      .from("workspace_members")
      .delete()
      .eq("workspace_id", session.workspaceId)
      .eq("user_id", session.userId);

    if (error) {
      if (/последнего владельца/i.test(error.message)) {
        return actionFail(
          "Вы единственный владелец. Передайте роль другому участнику."
        );
      }
      return actionFail(describeAuthError(error.message));
    }

    // Следующее пространство выберется при первом же чтении сессии.
    await supabase
      .from("profiles")
      .update({ last_workspace_id: null })
      .eq("id", session.userId);

    revalidatePath("/", "layout");
    return actionOk(null);
  } catch (caught) {
    return actionError(caught, "Не удалось покинуть пространство.");
  }
}
