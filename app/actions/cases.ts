"use server";

import { revalidatePath } from "next/cache";

import {
  actionError,
  actionFail,
  actionOk,
  type ActionResult,
} from "@/lib/actions/result";
import { requireSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { toCase } from "@/lib/data/mappers";
import type { Case, CaseStatus } from "@/types";

/*
 * Тип ответа переехал в lib/actions/result — им пользуются и действия, не
 * связанные с делами. Реэкспорт оставлен, чтобы не править импорты по всему
 * дереву: типы стираются при сборке, файлу с «use server» это не мешает.
 */
export type { ActionResult };

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
  if (!trimmed) return actionFail("Название дела не может быть пустым.");

  try {
    const session = await requireSession();
    const supabase = createClient();

    const { data, error } = await supabase
      .from("cases")
      .insert({
        workspace_id: session.workspaceId,
        title: trimmed.slice(0, 300),
        description:
          "Новое рабочее пространство. Загрузите документы и заведите объекты дела.",
        created_by: session.userId,
      })
      .select("*")
      .single();

    if (error) return actionFail(error.message);

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

    return actionOk(toCase(data));
  } catch (caught) {
    return actionError(caught, "Не удалось создать дело.");
  }
}

export interface CasePatch {
  title?: string;
  description?: string;
  status?: CaseStatus;
  tags?: string[];
}

/** Правка карточки дела: название, описание, статус, метки. */
export async function updateCaseAction(
  caseId: string,
  patch: CasePatch
): Promise<ActionResult<Case>> {
  const update: {
    title?: string;
    description?: string;
    status?: CaseStatus;
    tags?: string[];
  } = {};

  if (patch.title !== undefined) {
    const title = patch.title.trim();
    if (!title) return actionFail("Название дела не может быть пустым.");
    update.title = title.slice(0, 300);
  }

  if (patch.description !== undefined) {
    update.description = patch.description.trim().slice(0, 4000);
  }

  if (patch.status !== undefined) update.status = patch.status;

  if (patch.tags !== undefined) {
    // Пустые и повторяющиеся метки в базе только мешают фильтрам.
    update.tags = Array.from(
      new Set(patch.tags.map((tag) => tag.trim()).filter(Boolean))
    ).slice(0, 12);
  }

  if (Object.keys(update).length === 0) {
    return actionFail("Нечего сохранять.");
  }

  try {
    await requireSession();
    const supabase = createClient();

    const { data, error } = await supabase
      .from("cases")
      .update(update)
      .eq("id", caseId)
      .select("*")
      .maybeSingle();

    if (error) return actionFail(error.message);
    if (!data) return actionFail("Дело не найдено или недоступно.");

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/cases");
    revalidatePath(`/cases/${caseId}`);

    return actionOk(toCase(data));
  } catch (caught) {
    return actionError(caught, "Не удалось сохранить дело.");
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

    if (error) return actionFail(error.message);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/cases");
    return actionOk(null);
  } catch (caught) {
    return actionError(caught, "Не удалось удалить дело.");
  }
}
