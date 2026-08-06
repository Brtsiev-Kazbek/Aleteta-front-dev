"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { toCase } from "@/lib/data/mappers";
import type { Case } from "@/types";

export interface ActionResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

/**
 * Создание дела.
 *
 * workspace_id берём из сессии, а не из аргументов: иначе клиент смог бы
 * подсунуть чужое пространство. Политики доступа это отсекут, но полагаться
 * на последний рубеж вместо первого — плохая привычка.
 */
export async function createCaseAction(
  title: string
): Promise<ActionResult<Case>> {
  const trimmed = title.trim();
  if (!trimmed) return { ok: false, error: "Название дела не может быть пустым." };

  try {
    const session = await requireSession();
    const supabase = createClient();

    const { data, error } = await supabase
      .from("cases")
      .insert({
        workspace_id: session.workspaceId,
        title: trimmed.slice(0, 300),
        description:
          "Новое рабочее пространство. Загрузите документы — Алетейя извлечёт реквизиты.",
        created_by: session.userId,
      })
      .select("*")
      .single();

    if (error) return { ok: false, error: error.message };

    // Лента активности: дело появилось.
    await supabase.from("activity").insert({
      workspace_id: session.workspaceId,
      case_id: data.id,
      kind: "create",
      text: "Дело создано",
      actor_id: session.userId,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/cases");

    return { ok: true, data: toCase(data) };
  } catch (caught) {
    return {
      ok: false,
      error:
        caught instanceof Error ? caught.message : "Не удалось создать дело.",
    };
  }
}

export async function deleteCaseAction(
  caseId: string
): Promise<ActionResult<null>> {
  try {
    await requireSession();
    const supabase = createClient();

    // Мягкое удаление: дело исчезает из списков, но история остаётся.
    const { error } = await supabase
      .from("cases")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", caseId);

    if (error) return { ok: false, error: error.message };

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/cases");
    return { ok: true, data: null };
  } catch (caught) {
    return {
      ok: false,
      error: caught instanceof Error ? caught.message : "Не удалось удалить дело.",
    };
  }
}
