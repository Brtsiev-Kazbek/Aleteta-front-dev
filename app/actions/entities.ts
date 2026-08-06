"use server";

import { revalidatePath } from "next/cache";

import { requireSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { toEntity, toEntitySchema } from "@/lib/data/mappers";
import type { ActionResult } from "@/app/actions/cases";
import type { Entity, EntitySchema } from "@/types";

/**
 * Работа с объектами дела.
 *
 * validation_errors на запись не передаём никогда: их считает триггер в базе.
 * Иначе клиент смог бы объявить объект валидным и обойти проверку реквизитов —
 * ту самую, ради которой продукт и существует.
 */

export async function addEntityAction(
  caseId: string,
  typeId: string
): Promise<ActionResult<Entity>> {
  try {
    const session = await requireSession();
    const supabase = createClient();

    const { data, error } = await supabase
      .from("entities")
      .insert({
        workspace_id: session.workspaceId,
        case_id: caseId,
        type_id: typeId,
        data: {},
        created_by: session.userId,
      })
      .select("*")
      .single();

    if (error) return { ok: false, error: error.message };

    revalidatePath(`/cases/${caseId}`);
    return { ok: true, data: toEntity(data) };
  } catch (caught) {
    return {
      ok: false,
      error:
        caught instanceof Error ? caught.message : "Не удалось добавить объект.",
    };
  }
}

/** Правка одной ячейки. Возвращает объект с пересчитанной валидацией. */
export async function updateEntityFieldAction(
  entityId: string,
  field: string,
  value: string
): Promise<ActionResult<Entity>> {
  try {
    await requireSession();
    const supabase = createClient();

    const { data: current, error: readError } = await supabase
      .from("entities")
      .select("case_id, data")
      .eq("id", entityId)
      .maybeSingle();

    if (readError) return { ok: false, error: readError.message };
    if (!current) return { ok: false, error: "Объект не найден." };

    const { data, error } = await supabase
      .from("entities")
      .update({ data: { ...current.data, [field]: value } })
      .eq("id", entityId)
      .select("*")
      .single();

    if (error) return { ok: false, error: error.message };

    revalidatePath(`/cases/${current.case_id}`);
    return { ok: true, data: toEntity(data) };
  } catch (caught) {
    return {
      ok: false,
      error:
        caught instanceof Error ? caught.message : "Не удалось сохранить значение.",
    };
  }
}

export async function deleteEntityAction(
  entityId: string
): Promise<ActionResult<null>> {
  try {
    await requireSession();
    const supabase = createClient();

    const { data: current } = await supabase
      .from("entities")
      .select("case_id")
      .eq("id", entityId)
      .maybeSingle();

    const { error } = await supabase.from("entities").delete().eq("id", entityId);
    if (error) return { ok: false, error: error.message };

    if (current) revalidatePath(`/cases/${current.case_id}`);
    return { ok: true, data: null };
  } catch (caught) {
    return {
      ok: false,
      error:
        caught instanceof Error ? caught.message : "Не удалось удалить объект.",
    };
  }
}

export async function duplicateEntityAction(
  entityId: string
): Promise<ActionResult<Entity>> {
  try {
    const session = await requireSession();
    const supabase = createClient();

    const { data: source, error: readError } = await supabase
      .from("entities")
      .select("case_id, type_id, data")
      .eq("id", entityId)
      .maybeSingle();

    if (readError) return { ok: false, error: readError.message };
    if (!source) return { ok: false, error: "Объект не найден." };

    // Имя берём из первого поля схемы: у своих типов ключа `name` нет.
    const { data: type } = await supabase
      .from("entity_types")
      .select("fields")
      .eq("id", source.type_id)
      .maybeSingle();

    const nameKey = type?.fields?.[0]?.key;
    const copied = { ...source.data };
    if (nameKey && copied[nameKey]) {
      copied[nameKey] = `${copied[nameKey]} (копия)`;
    }

    const { data, error } = await supabase
      .from("entities")
      .insert({
        workspace_id: session.workspaceId,
        case_id: source.case_id,
        type_id: source.type_id,
        data: copied,
        created_by: session.userId,
      })
      .select("*")
      .single();

    if (error) return { ok: false, error: error.message };

    revalidatePath(`/cases/${source.case_id}`);
    return { ok: true, data: toEntity(data) };
  } catch (caught) {
    return {
      ok: false,
      error:
        caught instanceof Error ? caught.message : "Не удалось скопировать объект.",
    };
  }
}

/** Создание пользовательского типа объекта. Тип общий для пространства. */
export async function createEntitySchemaAction(
  label: string,
  fields: { label: string; required: boolean }[]
): Promise<ActionResult<EntitySchema>> {
  const trimmedLabel = label.trim() || "Свой тип";

  const prepared = fields
    .filter((field) => field.label.trim())
    .map((field, index) => ({
      key: `field_${index + 1}`,
      label: field.label.trim(),
      required: field.required,
      placeholder: `Значение поля «${field.label.trim()}»`,
      width: 240,
    }));

  const safeFields =
    prepared.length > 0
      ? prepared
      : [
          {
            key: "field_1",
            label: "Наименование",
            required: true,
            placeholder: "Наименование",
            width: 280,
          },
        ];

  try {
    const session = await requireSession();
    const supabase = createClient();

    // Ключ уникален внутри пространства — добавляем хвост от времени.
    const key = `custom_${Date.now().toString(36)}`;

    const { data, error } = await supabase
      .from("entity_types")
      .insert({
        workspace_id: session.workspaceId,
        key,
        label: trimmedLabel,
        hint: `Свой тип: ${safeFields.length} полей`,
        is_custom: true,
        fields: safeFields,
        templates: [`Документ по сущности «${trimmedLabel}»`],
        created_by: session.userId,
      })
      .select("*")
      .single();

    if (error) return { ok: false, error: error.message };

    revalidatePath("/dashboard");
    return { ok: true, data: toEntitySchema(data) };
  } catch (caught) {
    return {
      ok: false,
      error:
        caught instanceof Error ? caught.message : "Не удалось создать тип.",
    };
  }
}
