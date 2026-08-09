[aleteya](../../index.md) / lib/supabase/server

# lib/supabase/server

## Functions

### createClient()

```ts
function createClient(): SupabaseClient<Database, "public", "public", {
  Tables: {
     profiles: {
        Row: ProfileRow;
        Insert: Omit<ProfileRow, "created_at" | "updated_at" | "platform_role"> & Partial<Pick<ProfileRow, "platform_role">>;
        Update: Partial<Omit<ProfileRow, "id" | "created_at">>;
        Relationships: [];
       };
     workspaces: {
        Row: WorkspaceRow;
        Insert: Omit<WorkspaceRow, Generated | "archived_at" | "plan"> & Partial<Pick<WorkspaceRow, "id" | "plan">>;
        Update: Partial<Omit<WorkspaceRow, "id" | "created_at">>;
        Relationships: [];
       };
     workspace_members: {
        Row: WorkspaceMemberRow;
        Insert: Omit<WorkspaceMemberRow, "created_at" | "role" | "invited_by"> & Partial<Pick<WorkspaceMemberRow, "role" | "invited_by">>;
        Update: Partial<Pick<WorkspaceMemberRow, "role">>;
        Relationships: [];
       };
     workspace_invites: {
        Row: WorkspaceInviteRow;
        Insert: Omit<WorkspaceInviteRow, 
           | Generated
           | "role"
           | "token"
           | "expires_at"
           | "accepted_at"
           | "accepted_by"> & Partial<Pick<WorkspaceInviteRow, "role" | "expires_at">>;
        Update: Partial<Pick<WorkspaceInviteRow, "role" | "accepted_at" | "accepted_by">>;
        Relationships: [];
       };
     entity_types: {
        Row: EntityTypeRow;
        Insert: Omit<EntityTypeRow, 
           | Generated
           | "archived_at"
           | "is_custom"
           | "hint"
           | "templates"> & Partial<Pick<EntityTypeRow, "is_custom" | "hint" | "templates">>;
        Update: Partial<Omit<EntityTypeRow, "id" | "created_at" | "workspace_id">>;
        Relationships: [];
       };
     cases: {
        Row: CaseRow;
        Insert: Omit<CaseRow, Generated | "archived_at" | "status" | "tags"> & Partial<Pick<CaseRow, "status" | "tags">>;
        Update: Partial<Omit<CaseRow, "id" | "created_at" | "workspace_id">>;
        Relationships: [];
       };
     entities: {
        Row: EntityRow;
        Insert: Omit<EntityRow, Generated | "workspace_id" | "validation_errors" | "uncertain_fields"> & Partial<Pick<EntityRow, "workspace_id" | "uncertain_fields">>;
        Update: Partial<Pick<EntityRow, "data" | "uncertain_fields" | "type_id">>;
        Relationships: [];
       };
     documents: {
        Row: DocumentRow;
        Insert: Omit<DocumentRow, 
           | Generated
           | "workspace_id"
           | "status"
           | "deleted_at"
           | "source"
           | "bucket"> & Partial<Pick<DocumentRow, "workspace_id" | "status" | "source" | "bucket">>;
        Update: Partial<Omit<DocumentRow, "id" | "created_at" | "workspace_id">>;
        Relationships: [];
       };
     chat_messages: {
        Row: ChatMessageRow;
        Insert: Omit<ChatMessageRow, "id" | "created_at" | "workspace_id"> & Partial<Pick<ChatMessageRow, "workspace_id">>;
        Update: never;
        Relationships: [];
       };
     activity: {
        Row: ActivityRow;
        Insert: Omit<ActivityRow, "id" | "created_at" | "meta"> & Partial<Pick<ActivityRow, "meta">>;
        Update: never;
        Relationships: [];
       };
     ai_jobs: {
        Row: AiJobRow;
        Insert: Omit<AiJobRow, 
           | "id"
           | "created_at"
           | "status"
           | "progress"
           | "started_at"
           | "finished_at"> & Partial<Pick<AiJobRow, "status" | "progress">>;
        Update: Partial<Omit<AiJobRow, "id" | "created_at" | "workspace_id">>;
        Relationships: [];
       };
     document_reviews: {
        Row: DocumentReviewRow;
        Insert: Omit<DocumentReviewRow, 
           | "id"
           | "created_at"
           | "workspace_id"
           | "status"
           | "finished_at"> & Partial<Pick<DocumentReviewRow, "workspace_id" | "status">>;
        Update: Partial<Omit<DocumentReviewRow, "id" | "created_at">>;
        Relationships: [];
       };
     review_findings: {
        Row: ReviewFindingRow;
        Insert: Omit<ReviewFindingRow, "id" | "created_at" | "workspace_id"> & Partial<Pick<ReviewFindingRow, "workspace_id">>;
        Update: Partial<Omit<ReviewFindingRow, "id" | "created_at">>;
        Relationships: [];
       };
     court_practice: {
        Row: CourtPracticeRow;
        Insert: Omit<CourtPracticeRow, "id" | "created_at">;
        Update: Partial<Omit<CourtPracticeRow, "id" | "created_at">>;
        Relationships: [];
       };
     finding_practice: {
        Row: FindingPracticeRow;
        Insert: FindingPracticeRow;
        Update: Partial<Pick<FindingPracticeRow, "relevance">>;
        Relationships: [];
       };
     document_chunks: {
        Row: DocumentChunkRow;
        Insert: Omit<DocumentChunkRow, "id" | "created_at" | "workspace_id"> & Partial<Pick<DocumentChunkRow, "workspace_id">>;
        Update: Partial<Omit<DocumentChunkRow, "id" | "created_at">>;
        Relationships: [];
       };
    };
  Views: {
     workspace_stats: {
        Row: WorkspaceStatsRow;
        Relationships: [];
       };
     ai_usage_daily: {
        Row: AiUsageDailyRow;
        Relationships: [];
       };
    };
  Functions: {
     search_case_chunks: {
        Args: {
           target_case: string;
           query_text: string;
           query_embedding: null | string;
           match_count: number;
          };
        Returns: CaseChunkMatch[];
       };
     platform_overview: {
        Args: Record<string, never>;
        Returns: PlatformOverviewRow[];
       };
     platform_workspaces: {
        Args: {
           search: null | string;
           limit_count: number;
           offset_count: number;
          };
        Returns: PlatformWorkspaceRow[];
       };
     platform_signups: {
        Args: {
           days: number;
          };
        Returns: {
           day: string;
           signups: number;
          }[];
       };
     accept_pending_invites: {
        Args: Record<string, never>;
        Returns: number;
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
 }, {
  PostgrestVersion: "12";
}>
```

Клиент для серверных компонентов и обработчиков маршрутов.

Работает от имени вошедшего пользователя: сессия читается из cookie, и все
политики доступа применяются так же, как в браузере. Для фоновых заданий,
которым политики мешают, есть отдельный клиент — см. `admin.ts`.

#### Returns

`SupabaseClient`\<[`Database`](../../types/database.md#database), `"public"`, `"public"`, \{
  `Tables`: \{
     `profiles`: \{
        `Row`: [`ProfileRow`](../../types/database.md#profilerow);
        `Insert`: `Omit`\<[`ProfileRow`](../../types/database.md#profilerow), `"created_at"` \| `"updated_at"` \| `"platform_role"`\> & `Partial`\<`Pick`\<[`ProfileRow`](../../types/database.md#profilerow), `"platform_role"`\>\>;
        `Update`: `Partial`\<`Omit`\<[`ProfileRow`](../../types/database.md#profilerow), `"id"` \| `"created_at"`\>\>;
        `Relationships`: [];
       \};
     `workspaces`: \{
        `Row`: [`WorkspaceRow`](../../types/database.md#workspacerow);
        `Insert`: `Omit`\<[`WorkspaceRow`](../../types/database.md#workspacerow), `Generated` \| `"archived_at"` \| `"plan"`\> & `Partial`\<`Pick`\<[`WorkspaceRow`](../../types/database.md#workspacerow), `"id"` \| `"plan"`\>\>;
        `Update`: `Partial`\<`Omit`\<[`WorkspaceRow`](../../types/database.md#workspacerow), `"id"` \| `"created_at"`\>\>;
        `Relationships`: [];
       \};
     `workspace_members`: \{
        `Row`: [`WorkspaceMemberRow`](../../types/database.md#workspacememberrow);
        `Insert`: `Omit`\<[`WorkspaceMemberRow`](../../types/database.md#workspacememberrow), `"created_at"` \| `"role"` \| `"invited_by"`\> & `Partial`\<`Pick`\<[`WorkspaceMemberRow`](../../types/database.md#workspacememberrow), `"role"` \| `"invited_by"`\>\>;
        `Update`: `Partial`\<`Pick`\<[`WorkspaceMemberRow`](../../types/database.md#workspacememberrow), `"role"`\>\>;
        `Relationships`: [];
       \};
     `workspace_invites`: \{
        `Row`: [`WorkspaceInviteRow`](../../types/database.md#workspaceinviterow);
        `Insert`: `Omit`\<[`WorkspaceInviteRow`](../../types/database.md#workspaceinviterow), 
           \| `Generated`
           \| `"role"`
           \| `"token"`
           \| `"expires_at"`
           \| `"accepted_at"`
           \| `"accepted_by"`\> & `Partial`\<`Pick`\<[`WorkspaceInviteRow`](../../types/database.md#workspaceinviterow), `"role"` \| `"expires_at"`\>\>;
        `Update`: `Partial`\<`Pick`\<[`WorkspaceInviteRow`](../../types/database.md#workspaceinviterow), `"role"` \| `"accepted_at"` \| `"accepted_by"`\>\>;
        `Relationships`: [];
       \};
     `entity_types`: \{
        `Row`: [`EntityTypeRow`](../../types/database.md#entitytyperow);
        `Insert`: `Omit`\<[`EntityTypeRow`](../../types/database.md#entitytyperow), 
           \| `Generated`
           \| `"archived_at"`
           \| `"is_custom"`
           \| `"hint"`
           \| `"templates"`\> & `Partial`\<`Pick`\<[`EntityTypeRow`](../../types/database.md#entitytyperow), `"is_custom"` \| `"hint"` \| `"templates"`\>\>;
        `Update`: `Partial`\<`Omit`\<[`EntityTypeRow`](../../types/database.md#entitytyperow), `"id"` \| `"created_at"` \| `"workspace_id"`\>\>;
        `Relationships`: [];
       \};
     `cases`: \{
        `Row`: [`CaseRow`](../../types/database.md#caserow);
        `Insert`: `Omit`\<[`CaseRow`](../../types/database.md#caserow), `Generated` \| `"archived_at"` \| `"status"` \| `"tags"`\> & `Partial`\<`Pick`\<[`CaseRow`](../../types/database.md#caserow), `"status"` \| `"tags"`\>\>;
        `Update`: `Partial`\<`Omit`\<[`CaseRow`](../../types/database.md#caserow), `"id"` \| `"created_at"` \| `"workspace_id"`\>\>;
        `Relationships`: [];
       \};
     `entities`: \{
        `Row`: [`EntityRow`](../../types/database.md#entityrow);
        `Insert`: `Omit`\<[`EntityRow`](../../types/database.md#entityrow), `Generated` \| `"workspace_id"` \| `"validation_errors"` \| `"uncertain_fields"`\> & `Partial`\<`Pick`\<[`EntityRow`](../../types/database.md#entityrow), `"workspace_id"` \| `"uncertain_fields"`\>\>;
        `Update`: `Partial`\<`Pick`\<[`EntityRow`](../../types/database.md#entityrow), `"data"` \| `"uncertain_fields"` \| `"type_id"`\>\>;
        `Relationships`: [];
       \};
     `documents`: \{
        `Row`: [`DocumentRow`](../../types/database.md#documentrow);
        `Insert`: `Omit`\<[`DocumentRow`](../../types/database.md#documentrow), 
           \| `Generated`
           \| `"workspace_id"`
           \| `"status"`
           \| `"deleted_at"`
           \| `"source"`
           \| `"bucket"`\> & `Partial`\<`Pick`\<[`DocumentRow`](../../types/database.md#documentrow), `"workspace_id"` \| `"status"` \| `"source"` \| `"bucket"`\>\>;
        `Update`: `Partial`\<`Omit`\<[`DocumentRow`](../../types/database.md#documentrow), `"id"` \| `"created_at"` \| `"workspace_id"`\>\>;
        `Relationships`: [];
       \};
     `chat_messages`: \{
        `Row`: [`ChatMessageRow`](../../types/database.md#chatmessagerow);
        `Insert`: `Omit`\<[`ChatMessageRow`](../../types/database.md#chatmessagerow), `"id"` \| `"created_at"` \| `"workspace_id"`\> & `Partial`\<`Pick`\<[`ChatMessageRow`](../../types/database.md#chatmessagerow), `"workspace_id"`\>\>;
        `Update`: `never`;
        `Relationships`: [];
       \};
     `activity`: \{
        `Row`: [`ActivityRow`](../../types/database.md#activityrow);
        `Insert`: `Omit`\<[`ActivityRow`](../../types/database.md#activityrow), `"id"` \| `"created_at"` \| `"meta"`\> & `Partial`\<`Pick`\<[`ActivityRow`](../../types/database.md#activityrow), `"meta"`\>\>;
        `Update`: `never`;
        `Relationships`: [];
       \};
     `ai_jobs`: \{
        `Row`: [`AiJobRow`](../../types/database.md#aijobrow);
        `Insert`: `Omit`\<[`AiJobRow`](../../types/database.md#aijobrow), 
           \| `"id"`
           \| `"created_at"`
           \| `"status"`
           \| `"progress"`
           \| `"started_at"`
           \| `"finished_at"`\> & `Partial`\<`Pick`\<[`AiJobRow`](../../types/database.md#aijobrow), `"status"` \| `"progress"`\>\>;
        `Update`: `Partial`\<`Omit`\<[`AiJobRow`](../../types/database.md#aijobrow), `"id"` \| `"created_at"` \| `"workspace_id"`\>\>;
        `Relationships`: [];
       \};
     `document_reviews`: \{
        `Row`: [`DocumentReviewRow`](../../types/database.md#documentreviewrow);
        `Insert`: `Omit`\<[`DocumentReviewRow`](../../types/database.md#documentreviewrow), 
           \| `"id"`
           \| `"created_at"`
           \| `"workspace_id"`
           \| `"status"`
           \| `"finished_at"`\> & `Partial`\<`Pick`\<[`DocumentReviewRow`](../../types/database.md#documentreviewrow), `"workspace_id"` \| `"status"`\>\>;
        `Update`: `Partial`\<`Omit`\<[`DocumentReviewRow`](../../types/database.md#documentreviewrow), `"id"` \| `"created_at"`\>\>;
        `Relationships`: [];
       \};
     `review_findings`: \{
        `Row`: [`ReviewFindingRow`](../../types/database.md#reviewfindingrow);
        `Insert`: `Omit`\<[`ReviewFindingRow`](../../types/database.md#reviewfindingrow), `"id"` \| `"created_at"` \| `"workspace_id"`\> & `Partial`\<`Pick`\<[`ReviewFindingRow`](../../types/database.md#reviewfindingrow), `"workspace_id"`\>\>;
        `Update`: `Partial`\<`Omit`\<[`ReviewFindingRow`](../../types/database.md#reviewfindingrow), `"id"` \| `"created_at"`\>\>;
        `Relationships`: [];
       \};
     `court_practice`: \{
        `Row`: [`CourtPracticeRow`](../../types/database.md#courtpracticerow);
        `Insert`: `Omit`\<[`CourtPracticeRow`](../../types/database.md#courtpracticerow), `"id"` \| `"created_at"`\>;
        `Update`: `Partial`\<`Omit`\<[`CourtPracticeRow`](../../types/database.md#courtpracticerow), `"id"` \| `"created_at"`\>\>;
        `Relationships`: [];
       \};
     `finding_practice`: \{
        `Row`: [`FindingPracticeRow`](../../types/database.md#findingpracticerow);
        `Insert`: [`FindingPracticeRow`](../../types/database.md#findingpracticerow);
        `Update`: `Partial`\<`Pick`\<[`FindingPracticeRow`](../../types/database.md#findingpracticerow), `"relevance"`\>\>;
        `Relationships`: [];
       \};
     `document_chunks`: \{
        `Row`: [`DocumentChunkRow`](../../types/database.md#documentchunkrow);
        `Insert`: `Omit`\<[`DocumentChunkRow`](../../types/database.md#documentchunkrow), `"id"` \| `"created_at"` \| `"workspace_id"`\> & `Partial`\<`Pick`\<[`DocumentChunkRow`](../../types/database.md#documentchunkrow), `"workspace_id"`\>\>;
        `Update`: `Partial`\<`Omit`\<[`DocumentChunkRow`](../../types/database.md#documentchunkrow), `"id"` \| `"created_at"`\>\>;
        `Relationships`: [];
       \};
    \};
  `Views`: \{
     `workspace_stats`: \{
        `Row`: [`WorkspaceStatsRow`](../../types/database.md#workspacestatsrow);
        `Relationships`: [];
       \};
     `ai_usage_daily`: \{
        `Row`: [`AiUsageDailyRow`](../../types/database.md#aiusagedailyrow);
        `Relationships`: [];
       \};
    \};
  `Functions`: \{
     `search_case_chunks`: \{
        `Args`: \{
           `target_case`: `string`;
           `query_text`: `string`;
           `query_embedding`: `null` \| `string`;
           `match_count`: `number`;
          \};
        `Returns`: [`CaseChunkMatch`](../../types/database.md#casechunkmatch)[];
       \};
     `platform_overview`: \{
        `Args`: `Record`\<`string`, `never`\>;
        `Returns`: [`PlatformOverviewRow`](../../types/database.md#platformoverviewrow)[];
       \};
     `platform_workspaces`: \{
        `Args`: \{
           `search`: `null` \| `string`;
           `limit_count`: `number`;
           `offset_count`: `number`;
          \};
        `Returns`: [`PlatformWorkspaceRow`](../../types/database.md#platformworkspacerow)[];
       \};
     `platform_signups`: \{
        `Args`: \{
           `days`: `number`;
          \};
        `Returns`: \{
           `day`: `string`;
           `signups`: `number`;
          \}[];
       \};
     `accept_pending_invites`: \{
        `Args`: `Record`\<`string`, `never`\>;
        `Returns`: `number`;
       \};
    \};
  `Enums`: \{
     `workspace_role`: [`WorkspaceRole`](../../types/database.md#workspacerole);
     `platform_role`: [`PlatformRole`](../../types/database.md#platformrole);
     `case_status`: [`CaseStatus`](../../types/database.md#casestatus);
     `document_status`: [`DocumentStatus`](../../types/database.md#documentstatus);
     `document_source`: [`DocumentSource`](../../types/database.md#documentsource);
     `risk_level`: [`RiskLevel`](../../types/database.md#risklevel);
     `chat_role`: [`ChatRole`](../../types/database.md#chatrole);
     `activity_kind`: [`ActivityKind`](../../types/database.md#activitykind);
     `ai_task`: [`AiTask`](../../types/database.md#aitask);
     `job_status`: [`JobStatus`](../../types/database.md#jobstatus);
    \};
  `CompositeTypes`: `Record`\<`string`, `never`\>;
 \}, \{
  `PostgrestVersion`: `"12"`;
 \}\>

#### Defined in

[lib/supabase/server.ts:13](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/lib/supabase/server.ts#L13)
