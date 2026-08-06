import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  toCase,
  toDocument,
  toEntity,
  toEntitySchema,
} from "@/lib/data/mappers";
import type { Case, Document, Entity, EntitySchema } from "@/types";

/**
 * Чтение предметных данных.
 *
 * Все запросы идут под правами вошедшего: политики доступа сами отсекают чужие
 * пространства, поэтому фильтр по workspace_id здесь — не защита, а способ
 * не тянуть лишнее, когда пространств у человека несколько.
 */

export async function listCases(workspaceId: string): Promise<Case[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .eq("workspace_id", workspaceId)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Не удалось загрузить дела: ${error.message}`);
  return (data ?? []).map(toCase);
}

export async function getCase(caseId: string): Promise<Case | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .eq("id", caseId)
    .maybeSingle();

  if (error) throw new Error(`Не удалось загрузить дело: ${error.message}`);
  return data ? toCase(data) : null;
}

/**
 * Типы объектов: встроенные (workspace_id IS NULL) плюс созданные в этом
 * пространстве. Встроенные видны всем — поэтому условие через `or`.
 */
export async function listEntitySchemas(
  workspaceId: string
): Promise<EntitySchema[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("entity_types")
    .select("*")
    .or(`workspace_id.is.null,workspace_id.eq.${workspaceId}`)
    .is("archived_at", null)
    .order("is_custom", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Не удалось загрузить типы: ${error.message}`);
  return (data ?? []).map(toEntitySchema);
}

export async function listEntities(workspaceId: string): Promise<Entity[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("entities")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Не удалось загрузить объекты: ${error.message}`);
  return (data ?? []).map(toEntity);
}

export async function listCaseEntities(caseId: string): Promise<Entity[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("entities")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Не удалось загрузить объекты: ${error.message}`);
  return (data ?? []).map(toEntity);
}

export async function listDocuments(workspaceId: string): Promise<Document[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Не удалось загрузить документы: ${error.message}`);
  return (data ?? []).map(toDocument);
}
