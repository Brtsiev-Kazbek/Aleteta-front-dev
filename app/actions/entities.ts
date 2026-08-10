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
import { toEntity, toEntitySchema } from "@/lib/data/mappers";
import { readEntityData, readFieldDefinitions } from "@/lib/data/json";
import type { Entity, EntitySchema } from "@/types";

/**
 * Работа с объектами дела.
 *
 * validation_errors на запись не передаём никогда: их считает триггер в базе.
 * Иначе клиент смог бы объявить объект валидным и обойти проверку реквизитов —
 * ту самую, ради которой продукт и существует.
 */

/**
 * Один объект по идентификатору.
 *
 * Нужен там, где карточку создало не приложение, а исполнитель: разобрав файл,
 * он кладёт реквизиты в новый объект и возвращает только его идентификатор.
 * Перечитывать ради этого всё дело незачем — как незачем и собирать карточку в
 * браузере из ответа модели: показывать надо то, что действительно легло в
 * базу, вместе с пересчитанными там ошибками и пометками неуверенности.
 *
 * Чужой объект просто не найдётся: читаем под правами вошедшего.
 */
export async function getEntityAction(
  entityId: string
): Promise<ActionResult<Entity | null>> {
  try {
    await requireSession();
    const supabase = createClient();

    const { data, error } = await supabase
      .from("entities")
      .select("*")
      .eq("id", entityId)
      .maybeSingle();

    if (error) return actionFail(error.message);

    return actionOk(data ? toEntity(data) : null);
  } catch (caught) {
    return actionError(caught, "Не удалось прочитать объект.");
  }
}

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

    if (error) return actionFail(error.message);

    revalidatePath(`/cases/${caseId}`);
    return actionOk(toEntity(data));
  } catch (caught) {
    return actionError(caught, "Не удалось добавить объект.");
  }
}

/**
 * Правка нескольких реквизитов разом.
 *
 * Нужна там, где значения приходят пачкой: перенос распознанного из файла,
 * заполнение пустых полей моделью. Поштучные запросы в этом случае не просто
 * медленнее — между ними объект успевает побывать в наполовину заполненном
 * состоянии, и лента активности пишет по строке на каждое поле.
 */
export async function updateEntityDataAction(
  entityId: string,
  patch: Record<string, string>
): Promise<ActionResult<Entity>> {
  if (Object.keys(patch).length === 0) {
    return actionFail("Нечего сохранять.");
  }

  try {
    await requireSession();
    const supabase = createClient();

    const { data: current, error: readError } = await supabase
      .from("entities")
      .select("case_id, data")
      .eq("id", entityId)
      .maybeSingle();

    if (readError) return actionFail(readError.message);
    if (!current) return actionFail("Объект не найден.");

    const { data, error } = await supabase
      .from("entities")
      .update({ data: { ...readEntityData(current.data), ...patch } })
      .eq("id", entityId)
      .select("*")
      .single();

    if (error) return actionFail(error.message);

    revalidatePath(`/cases/${current.case_id}`);
    return actionOk(toEntity(data));
  } catch (caught) {
    return actionError(caught, "Не удалось сохранить реквизиты.");
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

    if (readError) return actionFail(readError.message);
    if (!current) return actionFail("Объект не найден.");

    const { data, error } = await supabase
      .from("entities")
      .update({ data: { ...readEntityData(current.data), [field]: value } })
      .eq("id", entityId)
      .select("*")
      .single();

    if (error) return actionFail(error.message);

    revalidatePath(`/cases/${current.case_id}`);
    return actionOk(toEntity(data));
  } catch (caught) {
    return actionError(caught, "Не удалось сохранить значение.");
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
    if (error) return actionFail(error.message);

    if (current) revalidatePath(`/cases/${current.case_id}`);
    return actionOk(null);
  } catch (caught) {
    return actionError(caught, "Не удалось удалить объект.");
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

    if (readError) return actionFail(readError.message);
    if (!source) return actionFail("Объект не найден.");

    // Имя берём из первого поля схемы: у своих типов ключа `name` нет.
    const { data: type } = await supabase
      .from("entity_types")
      .select("fields")
      .eq("id", source.type_id)
      .maybeSingle();

    const nameKey = readFieldDefinitions(type?.fields ?? null)[0]?.key;
    const copied = readEntityData(source.data);
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

    if (error) return actionFail(error.message);

    revalidatePath(`/cases/${source.case_id}`);
    return actionOk(toEntity(data));
  } catch (caught) {
    return actionError(caught, "Не удалось скопировать объект.");
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

    if (error) return actionFail(error.message);

    revalidatePath("/dashboard");
    return actionOk(toEntitySchema(data));
  } catch (caught) {
    return actionError(caught, "Не удалось создать тип.");
  }
}

/**
 * Удаление пользовательского типа.
 *
 * Тип не стирается из базы, а помечается архивным. Причин две. Первая: на него
 * ссылаются объекты, и внешний ключ стоит с `on delete restrict` — стереть
 * строку всё равно не выйдет, пока жив хоть один объект. Вторая: удаление типа
 * с уже заполненными объектами — не то действие, которое стоит делать
 * необратимым по одному нажатию.
 *
 * Объекты этого типа удаляются: держать их без описания реквизитов негде,
 * в интерфейсе они превращаются в строки без колонок.
 */
export async function archiveEntitySchemaAction(
  schemaId: string
): Promise<ActionResult<null>> {
  try {
    const session = await requireSession();
    const supabase = createClient();

    const { data: type, error: readError } = await supabase
      .from("entity_types")
      .select("id, workspace_id, is_custom")
      .eq("id", schemaId)
      .maybeSingle();

    if (readError) return actionFail(readError.message);
    if (!type) return actionFail("Тип не найден.");

    // Встроенные типы приходят миграцией и общие для всех пространств.
    if (!type.is_custom || type.workspace_id === null) {
      return actionFail("Встроенный тип удалить нельзя.");
    }
    if (type.workspace_id !== session.workspaceId) {
      return actionFail("Тип принадлежит другому пространству.");
    }

    const { error: entitiesError } = await supabase
      .from("entities")
      .delete()
      .eq("type_id", schemaId);

    if (entitiesError) return actionFail(entitiesError.message);

    const { error } = await supabase
      .from("entity_types")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", schemaId);

    if (error) return actionFail(error.message);

    revalidatePath("/dashboard");
    return actionOk(null);
  } catch (caught) {
    return actionError(caught, "Не удалось удалить тип.");
  }
}
