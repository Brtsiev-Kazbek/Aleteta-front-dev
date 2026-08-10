import type { Database } from "./database";

/**
 * Удобные имена для строк и перечислений базы.
 *
 * Соседний `database.ts` пишет генератор, и трогать его руками нельзя: правка
 * исчезнет при следующем запуске. Но обращаться в коде к
 * `Database["public"]["Tables"]["documents"]["Row"]` невыносимо, поэтому все
 * короткие имена живут здесь.
 *
 * Выгода не только в чтении. Когда в таблице появляется колонка, генератор
 * переписывает `database.ts`, а этот файл не меняется вовсе — и всё, что
 * ссылается на `DocumentRow`, получает новое поле само.
 */

type Tables = Database["public"]["Tables"];
type Enums = Database["public"]["Enums"];

/* ------------------------------------------------------------------ */
/*  СТРОКИ ТАБЛИЦ                                                      */
/* ------------------------------------------------------------------ */

export type ProfileRow = Tables["profiles"]["Row"];
export type WorkspaceRow = Tables["workspaces"]["Row"];
export type WorkspaceMemberRow = Tables["workspace_members"]["Row"];
export type WorkspaceInviteRow = Tables["workspace_invites"]["Row"];
export type EntityTypeRow = Tables["entity_types"]["Row"];
export type CaseRow = Tables["cases"]["Row"];
export type EntityRow = Tables["entities"]["Row"];
export type DocumentRow = Tables["documents"]["Row"];
export type DocumentPageRow = Tables["document_pages"]["Row"];
export type ChatMessageRow = Tables["chat_messages"]["Row"];
export type ActivityRow = Tables["activity"]["Row"];
export type AiJobRow = Tables["ai_jobs"]["Row"];
export type DocumentReviewRow = Tables["document_reviews"]["Row"];
export type ReviewFindingRow = Tables["review_findings"]["Row"];
export type CourtPracticeRow = Tables["court_practice"]["Row"];
export type DocumentChunkRow = Tables["document_chunks"]["Row"];

/* ------------------------------------------------------------------ */
/*  ПЕРЕЧИСЛЕНИЯ                                                       */
/* ------------------------------------------------------------------ */

export type WorkspaceRole = Enums["workspace_role"];
export type CaseStatus = Enums["case_status"];
export type DocumentStatus = Enums["document_status"];
export type DocumentSource = Enums["document_source"];
export type OcrStatus = Enums["ocr_status"];
export type RiskLevel = Enums["risk_level"];
export type ChatRole = Enums["chat_role"];
export type ActivityKind = Enums["activity_kind"];
export type AiTask = Enums["ai_task"];
export type JobStatus = Enums["job_status"];

/* ------------------------------------------------------------------ */
/*  ОПИСАНИЕ РЕКВИЗИТОВ                                                */
/* ------------------------------------------------------------------ */

/**
 * Одно поле в описании типа объекта.
 *
 * В базе это `jsonb`, и генератор знает о нём только то, что это `Json`.
 * Форму приходится объявлять здесь — она обязана совпадать с
 * `EntityFieldSchema` во фронте, иначе таблица реквизитов не нарисуется.
 */
export interface EntityFieldDefinition {
  key: string;
  label: string;
  required: boolean;
  placeholder?: string;
  width?: number;
  pattern?: string;
  patternError?: string;
}
