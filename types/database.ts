/**
 * Типы базы данных.
 *
 * Файл рассчитан на замену генератором: `npm run db:types` перезапишет его по
 * фактической схеме проекта. До первого запуска генератора он написан вручную
 * по миграциям — иначе приложение не собралось бы.
 *
 * Правило: не правьте этот файл руками после того, как генератор заработал.
 * Источник истины — миграции в supabase/migrations.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/* ------------------------------------------------------------------ */
/*  ПЕРЕЧИСЛЕНИЯ                                                       */
/* ------------------------------------------------------------------ */

export type WorkspaceRole = "owner" | "admin" | "member" | "viewer";
export type PlatformRole = "user" | "admin";
export type CaseStatus = "in_progress" | "collecting" | "active" | "archived";
export type DocumentStatus = "draft" | "ready" | "signed" | "generating";
export type DocumentSource = "upload" | "template" | "freeform" | "bulk" | "review";
export type RiskLevel = "critical" | "warning" | "info";
export type ChatRole = "user" | "assistant";
export type ActivityKind = "upload" | "ai" | "edit" | "create" | "generate";
export type AiTask =
  | "ocr"
  | "extract"
  | "review"
  | "assistant"
  | "freeform"
  | "bulk"
  | "package"
  | "embed";
export type JobStatus = "queued" | "running" | "done" | "failed" | "cancelled";

/* ------------------------------------------------------------------ */
/*  СТРОКИ ТАБЛИЦ                                                      */
/* ------------------------------------------------------------------ */

export interface ProfileRow {
  id: string;
  email: string;
  full_name: string | null;
  job_title: string | null;
  avatar_path: string | null;
  platform_role: PlatformRole;
  last_workspace_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceRow {
  id: string;
  name: string;
  slug: string;
  legal_name: string | null;
  inn: string | null;
  address: string | null;
  plan: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface WorkspaceMemberRow {
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  invited_by: string | null;
  created_at: string;
}

export interface WorkspaceInviteRow {
  id: string;
  workspace_id: string;
  email: string;
  role: WorkspaceRole;
  token: string;
  invited_by: string | null;
  expires_at: string;
  accepted_at: string | null;
  accepted_by: string | null;
  created_at: string;
}

/** Описание одного реквизита внутри `entity_types.fields`. */
export interface EntityFieldDefinition {
  key: string;
  label: string;
  required: boolean;
  placeholder?: string;
  width?: number;
  /** Регулярное выражение в синтаксисе POSIX — его же применяет база. */
  pattern?: string;
  patternError?: string;
}

export interface EntityTypeRow {
  id: string;
  /** NULL — встроенный тип, доступный всем пространствам. */
  workspace_id: string | null;
  key: string;
  label: string;
  hint: string | null;
  is_custom: boolean;
  fields: EntityFieldDefinition[];
  templates: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface CaseRow {
  id: string;
  workspace_id: string;
  title: string;
  status: CaseStatus;
  tags: string[];
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

export interface EntityRow {
  id: string;
  workspace_id: string;
  case_id: string;
  type_id: string;
  data: Record<string, string>;
  /** Считается триггером в базе; на запись не принимается. */
  validation_errors: string[];
  uncertain_fields: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentRow {
  id: string;
  workspace_id: string;
  case_id: string;
  title: string;
  kind: string | null;
  status: DocumentStatus;
  source: DocumentSource;
  bucket: string;
  /** Путь внутри бакета. Ссылка собирается на клиенте. */
  path: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  sha256: string | null;
  entity_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ChatMessageRow {
  id: string;
  workspace_id: string;
  case_id: string;
  role: ChatRole;
  text: string;
  findings: Json | null;
  citations: Json | null;
  ai_job_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface ActivityRow {
  id: string;
  workspace_id: string;
  case_id: string | null;
  kind: ActivityKind;
  text: string;
  actor_id: string | null;
  meta: Json;
  created_at: string;
}

export interface AiJobRow {
  id: string;
  workspace_id: string;
  case_id: string | null;
  document_id: string | null;
  task: AiTask;
  status: JobStatus;
  progress: number;
  provider: string | null;
  model: string | null;
  prompt_version: string | null;
  input: Json;
  output: Json | null;
  input_hash: string | null;
  tokens_in: number | null;
  tokens_out: number | null;
  cost_usd: number | null;
  error: string | null;
  correction: Json | null;
  created_by: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

export interface DocumentReviewRow {
  id: string;
  workspace_id: string;
  case_id: string | null;
  document_id: string;
  ai_job_id: string | null;
  status: JobStatus;
  paragraphs: Json;
  critical_count: number;
  warning_count: number;
  info_count: number;
  created_by: string | null;
  created_at: string;
  finished_at: string | null;
}

export interface ReviewFindingRow {
  id: string;
  review_id: string;
  workspace_id: string;
  level: RiskLevel;
  title: string;
  description: string;
  recommendation: string | null;
  clause: string | null;
  paragraph_id: string | null;
  sort_order: number;
  created_at: string;
}

export interface CourtPracticeRow {
  id: string;
  source: string;
  external_id: string | null;
  court: string;
  number: string;
  year: string;
  holding: string | null;
  url: string | null;
  side: "against" | "favor";
  created_at: string;
}

export interface FindingPracticeRow {
  finding_id: string;
  practice_id: string;
  relevance: number | null;
}

export interface DocumentChunkRow {
  id: string;
  workspace_id: string;
  case_id: string;
  document_id: string;
  chunk_index: number;
  text: string;
  page: number | null;
  clause: string | null;
  embedding: string | null;
  embedding_model: string | null;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/*  ПРЕДСТАВЛЕНИЯ И ФУНКЦИИ                                            */
/* ------------------------------------------------------------------ */

export interface WorkspaceStatsRow {
  workspace_id: string;
  name: string;
  plan: string;
  members: number;
  cases: number;
  entities: number;
  entities_ready: number;
  documents: number;
  storage_bytes: number;
  custom_types: number;
  ai_jobs: number;
  ai_cost_usd_month: number;
  created_at: string;
}

export interface AiUsageDailyRow {
  workspace_id: string;
  day: string;
  task: AiTask;
  provider: string | null;
  model: string | null;
  runs: number;
  failed: number;
  corrected: number;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
  avg_seconds: number | null;
}

export interface PlatformOverviewRow {
  users: number;
  users_new_7d: number;
  workspaces: number;
  cases: number;
  documents: number;
  entities: number;
  storage_bytes: number;
  ai_jobs_30d: number;
  ai_cost_usd_30d: number;
  ai_failure_rate: number;
}

export interface PlatformWorkspaceRow {
  workspace_id: string;
  name: string;
  slug: string;
  plan: string;
  owner_email: string | null;
  members: number;
  cases: number;
  documents: number;
  ai_cost_usd_30d: number;
  last_activity_at: string | null;
  created_at: string;
}

export interface CaseChunkMatch {
  id: string;
  document_id: string;
  text: string;
  page: number | null;
  clause: string | null;
  score: number;
}

/* ------------------------------------------------------------------ */
/*  СХЕМА ДЛЯ КЛИЕНТА SUPABASE                                         */
/* ------------------------------------------------------------------ */

/**
 * `Insert` опускает то, что проставляет база: идентификаторы, отметки времени,
 * а также поля, вычисляемые триггерами. Из-за этого клиент физически не может
 * записать, например, свой список ошибок валидации.
 */
type Generated = "id" | "created_at" | "updated_at";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Omit<ProfileRow, "created_at" | "updated_at" | "platform_role"> &
          Partial<Pick<ProfileRow, "platform_role">>;
        Update: Partial<Omit<ProfileRow, "id" | "created_at">>;
      };
      workspaces: {
        Row: WorkspaceRow;
        Insert: Omit<WorkspaceRow, Generated | "archived_at" | "plan"> &
          Partial<Pick<WorkspaceRow, "id" | "plan">>;
        Update: Partial<Omit<WorkspaceRow, "id" | "created_at">>;
      };
      workspace_members: {
        Row: WorkspaceMemberRow;
        Insert: Omit<WorkspaceMemberRow, "created_at" | "role" | "invited_by"> &
          Partial<Pick<WorkspaceMemberRow, "role" | "invited_by">>;
        Update: Partial<Pick<WorkspaceMemberRow, "role">>;
      };
      workspace_invites: {
        Row: WorkspaceInviteRow;
        Insert: Omit<
          WorkspaceInviteRow,
          Generated | "token" | "expires_at" | "accepted_at" | "accepted_by" | "role"
        > &
          Partial<Pick<WorkspaceInviteRow, "role" | "expires_at">>;
        Update: Partial<Pick<WorkspaceInviteRow, "role" | "accepted_at" | "accepted_by">>;
      };
      entity_types: {
        Row: EntityTypeRow;
        Insert: Omit<
          EntityTypeRow,
          Generated | "archived_at" | "is_custom" | "hint" | "templates"
        > &
          Partial<Pick<EntityTypeRow, "is_custom" | "hint" | "templates">>;
        Update: Partial<Omit<EntityTypeRow, "id" | "created_at" | "workspace_id">>;
      };
      cases: {
        Row: CaseRow;
        Insert: Omit<CaseRow, Generated | "archived_at" | "status" | "tags"> &
          Partial<Pick<CaseRow, "status" | "tags">>;
        Update: Partial<Omit<CaseRow, "id" | "created_at" | "workspace_id">>;
      };
      entities: {
        Row: EntityRow;
        Insert: Omit<
          EntityRow,
          Generated | "validation_errors" | "uncertain_fields" | "workspace_id"
        > &
          Partial<Pick<EntityRow, "workspace_id" | "uncertain_fields">>;
        Update: Partial<Pick<EntityRow, "data" | "uncertain_fields" | "type_id">>;
      };
      documents: {
        Row: DocumentRow;
        Insert: Omit<
          DocumentRow,
          Generated | "deleted_at" | "workspace_id" | "status" | "source" | "bucket"
        > &
          Partial<Pick<DocumentRow, "workspace_id" | "status" | "source" | "bucket">>;
        Update: Partial<Omit<DocumentRow, "id" | "created_at" | "workspace_id">>;
      };
      chat_messages: {
        Row: ChatMessageRow;
        Insert: Omit<ChatMessageRow, "id" | "created_at" | "workspace_id"> &
          Partial<Pick<ChatMessageRow, "workspace_id">>;
        Update: never;
      };
      activity: {
        Row: ActivityRow;
        Insert: Omit<ActivityRow, "id" | "created_at" | "meta"> &
          Partial<Pick<ActivityRow, "meta">>;
        Update: never;
      };
      ai_jobs: {
        Row: AiJobRow;
        Insert: Omit<
          AiJobRow,
          "id" | "created_at" | "status" | "progress" | "started_at" | "finished_at"
        > &
          Partial<Pick<AiJobRow, "status" | "progress">>;
        Update: Partial<Omit<AiJobRow, "id" | "created_at" | "workspace_id">>;
      };
      document_reviews: {
        Row: DocumentReviewRow;
        Insert: Omit<
          DocumentReviewRow,
          "id" | "created_at" | "finished_at" | "workspace_id" | "status"
        > &
          Partial<Pick<DocumentReviewRow, "workspace_id" | "status">>;
        Update: Partial<Omit<DocumentReviewRow, "id" | "created_at">>;
      };
      review_findings: {
        Row: ReviewFindingRow;
        Insert: Omit<ReviewFindingRow, "id" | "created_at" | "workspace_id"> &
          Partial<Pick<ReviewFindingRow, "workspace_id">>;
        Update: Partial<Omit<ReviewFindingRow, "id" | "created_at">>;
      };
      court_practice: {
        Row: CourtPracticeRow;
        Insert: Omit<CourtPracticeRow, "id" | "created_at">;
        Update: Partial<Omit<CourtPracticeRow, "id" | "created_at">>;
      };
      finding_practice: {
        Row: FindingPracticeRow;
        Insert: FindingPracticeRow;
        Update: Partial<Pick<FindingPracticeRow, "relevance">>;
      };
      document_chunks: {
        Row: DocumentChunkRow;
        Insert: Omit<DocumentChunkRow, "id" | "created_at" | "workspace_id"> &
          Partial<Pick<DocumentChunkRow, "workspace_id">>;
        Update: Partial<Omit<DocumentChunkRow, "id" | "created_at">>;
      };
    };
    Views: {
      workspace_stats: { Row: WorkspaceStatsRow };
      ai_usage_daily: { Row: AiUsageDailyRow };
    };
    Functions: {
      search_case_chunks: {
        Args: {
          target_case: string;
          query_text: string;
          query_embedding?: string | null;
          match_count?: number;
        };
        Returns: CaseChunkMatch[];
      };
      platform_overview: {
        Args: Record<string, never>;
        Returns: PlatformOverviewRow[];
      };
      platform_workspaces: {
        Args: { search?: string | null; limit_count?: number; offset_count?: number };
        Returns: PlatformWorkspaceRow[];
      };
      platform_signups: {
        Args: { days?: number };
        Returns: { day: string; signups: number }[];
      };
    };
    Enums: {
      workspace_role: WorkspaceRole;
      platform_role: PlatformRole;
      case_status: CaseStatus;
      document_status: DocumentStatus;
      document_source: DocumentSource;
      risk_level: RiskLevel;
      chat_role: ChatRole;
      activity_kind: ActivityKind;
      ai_task: AiTask;
      job_status: JobStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
