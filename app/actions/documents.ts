"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import {
  actionError,
  actionFail,
  actionOk,
  type ActionResult,
} from "@/lib/actions/result";
import { requireSession } from "@/lib/data/session";
import { createClient } from "@/lib/supabase/server";
import { toDocument } from "@/lib/data/mappers";
import { createLogger, shortId } from "@/lib/logger";
import type { Document } from "@/types";

/**
 * Документы дела.
 *
 * Сам файл в действие не передаётся: браузер кладёт его в хранилище напрямую,
 * а сюда приходит уже путь. Причина простая — предел на тело серверного
 * действия измеряется мегабайтами, а скан договора легко весит десятки.
 * Поэтому порядок такой:
 *
 *   1. `prepareDocumentUploadAction` — сервер выдаёт путь внутри бакета;
 *   2. браузер загружает файл по этому пути (политики хранилища проверяют
 *      членство в пространстве);
 *   3. `registerDocumentAction` — появляется строка в таблице документов.
 *
 * Путь считает сервер, а не клиент: первый сегмент пути — идентификатор
 * пространства, и именно по нему хранилище решает, кому файл доступен.
 */

const log = createLogger("document");

const BUCKET = "case-documents";

/**
 * Кириллица латиницей.
 *
 * Хранилище не принимает ключи с буквами вне латиницы: «скан.pdf» отвергается
 * с «Invalid key», а вместе с ним и вся загрузка. Просто выбросить такие буквы
 * нельзя — от «скан договора» не осталось бы ничего, и в бакете лежали бы
 * файлы с именами вида `-.pdf`, неразличимые между собой.
 *
 * Таблица нарочно простая, без ГОСТов и стандартов транслитерации: имя в
 * хранилище человек читает разве что при разборе неполадок, а настоящее
 * название файла хранится в базе целиком и в интерфейсе показывается оно.
 */
const CYRILLIC: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

function transliterate(value: string): string {
  let result = "";

  for (const char of value.toLowerCase()) {
    result += CYRILLIC[char] ?? char;
  }

  return result;
}

/**
 * Имя файла для пути в бакете: латиница, цифры, дефис — и ничего больше.
 *
 * Ограничение не наше, а хранилища: всё, что вне латиницы, оно отвергает.
 * Раньше здесь стояло `\p{L}`, которое считает буквой и «с», и «к», — отсюда и
 * бралась ошибка на первом же русском названии.
 */
function slugifyFileName(name: string): string {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const extension = dot > 0 ? name.slice(dot + 1).toLowerCase() : "";

  const safeBase =
    transliterate(base)
      /*
       * Разложение по NFKD отделяет диакритику от буквы: «é» превращается в
       * «e» и отдельный значок. Значок выбрасываем сразу — иначе он попал бы
       * под общее правило и стал бы дефисом посреди слова: «re-sume».
       */
      .normalize("NFKD")
      .replace(/\p{M}+/gu, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "file";

  const safeExtension = transliterate(extension)
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 8);

  return safeExtension ? `${safeBase}.${safeExtension}` : safeBase;
}

export interface UploadTarget {
  bucket: string;
  path: string;
}

/**
 * Путь для файла, загруженного вне дела.
 *
 * Такой сценарий у распознавания законный и частый: человеку надо прочитать
 * один скан, не заводя папки и не убирая потом за собой. Дела в пути нет,
 * поэтому вместо него стоит `loose` — но первым сегментом, как и везде,
 * остаётся пространство: именно по нему хранилище решает, кому файл доступен.
 */
export async function prepareLooseUploadAction(
  fileName: string
): Promise<ActionResult<UploadTarget>> {
  try {
    const session = await requireSession();

    const path = `${session.workspaceId}/loose/${randomUUID()}-${slugifyFileName(fileName)}`;

    return actionOk({ bucket: BUCKET, path });
  } catch (caught) {
    return actionError(caught, "Не удалось подготовить загрузку.");
  }
}

export async function prepareDocumentUploadAction(
  caseId: string,
  fileName: string
): Promise<ActionResult<UploadTarget>> {
  try {
    const session = await requireSession();
    const supabase = createClient();

    // Дело читаем под правами пользователя: чужое просто не найдётся.
    const { data: caseRow, error } = await supabase
      .from("cases")
      .select("id, workspace_id")
      .eq("id", caseId)
      .maybeSingle();

    if (error) return actionFail(error.message);
    if (!caseRow) return actionFail("Дело не найдено или недоступно.");
    if (caseRow.workspace_id !== session.workspaceId) {
      return actionFail("Дело принадлежит другому пространству.");
    }

    // Идентификатор в имени: два файла с одинаковым названием не затрут друг друга.
    const path = `${caseRow.workspace_id}/${caseId}/${randomUUID()}-${slugifyFileName(fileName)}`;

    return actionOk({ bucket: BUCKET, path });
  } catch (caught) {
    return actionError(caught, "Не удалось подготовить загрузку.");
  }
}

export interface RegisterDocumentInput {
  /** Пусто — файл живёт сам по себе: его загрузили ради распознавания. */
  caseId: string | null;
  title: string;
  /** Человеческое описание вида: «Выписка ЕГРН», «Скан». */
  kind?: string;
  /** Путь, выданный `prepareDocumentUploadAction`. */
  path: string;
  mimeType?: string;
  sizeBytes?: number;
}

export async function registerDocumentAction(
  input: RegisterDocumentInput
): Promise<ActionResult<Document>> {
  const title = input.title.trim();
  if (!title) return actionFail("У документа нет названия.");
  if (!input.path) return actionFail("Файл не загружен.");

  try {
    const session = await requireSession();
    const supabase = createClient();

    /*
     * Путь проверяем ещё раз: между выдачей и регистрацией прошёл отдельный
     * запрос, и в нём мог прийти чужой путь. Хранилище такую подмену не
     * заметит — оно проверяет право на запись, а не на то, что записал именно
     * этот человек.
     */
    const expectedPrefix = `${session.workspaceId}/${input.caseId ?? "loose"}/`;

    if (!input.path.startsWith(expectedPrefix)) {
      return actionFail("Путь файла не соответствует делу.");
    }

    const { data, error } = await supabase
      .from("documents")
      .insert({
        workspace_id: session.workspaceId,
        case_id: input.caseId,
        title: title.slice(0, 300),
        kind: input.kind?.trim() || null,
        status: "ready",
        source: "upload",
        bucket: BUCKET,
        path: input.path,
        mime_type: input.mimeType ?? null,
        size_bytes: input.sizeBytes ?? null,
        sha256: null,
        entity_id: null,
        created_by: session.userId,
      })
      .select("*")
      .single();

    if (error) return actionFail(error.message);

    log.info("register", {
      документ: shortId(data.id),
      файл: title,
      дело: input.caseId ? shortId(input.caseId) : "без дела",
      байт: input.sizeBytes ?? 0,
    });

    await supabase.from("activity").insert({
      workspace_id: session.workspaceId,
      case_id: input.caseId,
      kind: "upload",
      text: `Загружен файл «${title}»`,
      actor_id: session.userId,
    });

    revalidatePath(input.caseId ? `/cases/${input.caseId}` : "/dashboard/recognize");
    return actionOk(toDocument(data));
  } catch (caught) {
    return actionError(caught, "Не удалось сохранить документ.");
  }
}

/**
 * Удаление документа: строка помечается удалённой, файл убирается из бакета.
 *
 * Строку оставляем ради истории и статистики, файл — нет: он занимает место и
 * содержит персональные данные, которых после удаления храниться не должно.
 */
export async function deleteDocumentAction(
  documentId: string
): Promise<ActionResult<null>> {
  try {
    await requireSession();
    const supabase = createClient();

    const { data: document, error: readError } = await supabase
      .from("documents")
      .select("id, case_id, bucket, path")
      .eq("id", documentId)
      .maybeSingle();

    if (readError) return actionFail(readError.message);
    if (!document) return actionFail("Документ не найден.");

    const { error } = await supabase
      .from("documents")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", documentId);

    if (error) return actionFail(error.message);

    if (document.path) {
      // Ошибку удаления файла не поднимаем: строка уже помечена удалённой,
      // и возвращать отказ значит показать документ, которого в списке нет.
      await supabase.storage
        .from(document.bucket ?? BUCKET)
        .remove([document.path]);
    }

    revalidatePath(`/cases/${document.case_id}`);
    return actionOk(null);
  } catch (caught) {
    return actionError(caught, "Не удалось удалить документ.");
  }
}

/**
 * Ссылка на скачивание.
 *
 * Бакет закрытый, постоянного адреса у файла нет — выдаём временную ссылку.
 * Час: этого хватает открыть файл и переслать коллеге, но недостаточно, чтобы
 * ссылка жила в переписке месяцами.
 */
export async function createDocumentUrlAction(
  documentId: string
): Promise<ActionResult<string>> {
  try {
    await requireSession();
    const supabase = createClient();

    const { data: document, error: readError } = await supabase
      .from("documents")
      .select("bucket, path")
      .eq("id", documentId)
      .maybeSingle();

    if (readError) return actionFail(readError.message);
    if (!document?.path) {
      return actionFail("У документа нет файла — он ещё не сгенерирован.");
    }

    const { data, error } = await supabase.storage
      .from(document.bucket ?? BUCKET)
      .createSignedUrl(document.path, 60 * 60);

    if (error) return actionFail(error.message);
    return actionOk(data.signedUrl);
  } catch (caught) {
    return actionError(caught, "Не удалось получить ссылку на файл.");
  }
}
