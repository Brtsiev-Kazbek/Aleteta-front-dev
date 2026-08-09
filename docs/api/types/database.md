[aleteya](../index.md) / types/database

# types/database

## Interfaces

### Database

#### Properties

##### public

```ts
public: {
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
};
```

###### Tables

```ts
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
```

###### Tables.profiles

```ts
profiles: {
  Row: ProfileRow;
  Insert: Omit<ProfileRow, "created_at" | "updated_at" | "platform_role"> & Partial<Pick<ProfileRow, "platform_role">>;
  Update: Partial<Omit<ProfileRow, "id" | "created_at">>;
  Relationships: [];
};
```

###### Tables.profiles.Row

```ts
Row: ProfileRow;
```

###### Tables.profiles.Insert

```ts
Insert: Omit<ProfileRow, "created_at" | "updated_at" | "platform_role"> & Partial<Pick<ProfileRow, "platform_role">>;
```

###### Tables.profiles.Update

```ts
Update: Partial<Omit<ProfileRow, "id" | "created_at">>;
```

###### Tables.profiles.Relationships

```ts
Relationships: [];
```

###### Tables.workspaces

```ts
workspaces: {
  Row: WorkspaceRow;
  Insert: Omit<WorkspaceRow, Generated | "archived_at" | "plan"> & Partial<Pick<WorkspaceRow, "id" | "plan">>;
  Update: Partial<Omit<WorkspaceRow, "id" | "created_at">>;
  Relationships: [];
};
```

###### Tables.workspaces.Row

```ts
Row: WorkspaceRow;
```

###### Tables.workspaces.Insert

```ts
Insert: Omit<WorkspaceRow, Generated | "archived_at" | "plan"> & Partial<Pick<WorkspaceRow, "id" | "plan">>;
```

###### Tables.workspaces.Update

```ts
Update: Partial<Omit<WorkspaceRow, "id" | "created_at">>;
```

###### Tables.workspaces.Relationships

```ts
Relationships: [];
```

###### Tables.workspace\_members

```ts
workspace_members: {
  Row: WorkspaceMemberRow;
  Insert: Omit<WorkspaceMemberRow, "created_at" | "role" | "invited_by"> & Partial<Pick<WorkspaceMemberRow, "role" | "invited_by">>;
  Update: Partial<Pick<WorkspaceMemberRow, "role">>;
  Relationships: [];
};
```

###### Tables.workspace\_members.Row

```ts
Row: WorkspaceMemberRow;
```

###### Tables.workspace\_members.Insert

```ts
Insert: Omit<WorkspaceMemberRow, "created_at" | "role" | "invited_by"> & Partial<Pick<WorkspaceMemberRow, "role" | "invited_by">>;
```

###### Tables.workspace\_members.Update

```ts
Update: Partial<Pick<WorkspaceMemberRow, "role">>;
```

###### Tables.workspace\_members.Relationships

```ts
Relationships: [];
```

###### Tables.workspace\_invites

```ts
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
```

###### Tables.workspace\_invites.Row

```ts
Row: WorkspaceInviteRow;
```

###### Tables.workspace\_invites.Insert

```ts
Insert: Omit<WorkspaceInviteRow, 
  | Generated
  | "role"
  | "token"
  | "expires_at"
  | "accepted_at"
| "accepted_by"> & Partial<Pick<WorkspaceInviteRow, "role" | "expires_at">>;
```

###### Tables.workspace\_invites.Update

```ts
Update: Partial<Pick<WorkspaceInviteRow, "role" | "accepted_at" | "accepted_by">>;
```

###### Tables.workspace\_invites.Relationships

```ts
Relationships: [];
```

###### Tables.entity\_types

```ts
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
```

###### Tables.entity\_types.Row

```ts
Row: EntityTypeRow;
```

###### Tables.entity\_types.Insert

```ts
Insert: Omit<EntityTypeRow, 
  | Generated
  | "archived_at"
  | "is_custom"
  | "hint"
| "templates"> & Partial<Pick<EntityTypeRow, "is_custom" | "hint" | "templates">>;
```

###### Tables.entity\_types.Update

```ts
Update: Partial<Omit<EntityTypeRow, "id" | "created_at" | "workspace_id">>;
```

###### Tables.entity\_types.Relationships

```ts
Relationships: [];
```

###### Tables.cases

```ts
cases: {
  Row: CaseRow;
  Insert: Omit<CaseRow, Generated | "archived_at" | "status" | "tags"> & Partial<Pick<CaseRow, "status" | "tags">>;
  Update: Partial<Omit<CaseRow, "id" | "created_at" | "workspace_id">>;
  Relationships: [];
};
```

###### Tables.cases.Row

```ts
Row: CaseRow;
```

###### Tables.cases.Insert

```ts
Insert: Omit<CaseRow, Generated | "archived_at" | "status" | "tags"> & Partial<Pick<CaseRow, "status" | "tags">>;
```

###### Tables.cases.Update

```ts
Update: Partial<Omit<CaseRow, "id" | "created_at" | "workspace_id">>;
```

###### Tables.cases.Relationships

```ts
Relationships: [];
```

###### Tables.entities

```ts
entities: {
  Row: EntityRow;
  Insert: Omit<EntityRow, Generated | "workspace_id" | "validation_errors" | "uncertain_fields"> & Partial<Pick<EntityRow, "workspace_id" | "uncertain_fields">>;
  Update: Partial<Pick<EntityRow, "data" | "uncertain_fields" | "type_id">>;
  Relationships: [];
};
```

###### Tables.entities.Row

```ts
Row: EntityRow;
```

###### Tables.entities.Insert

```ts
Insert: Omit<EntityRow, Generated | "workspace_id" | "validation_errors" | "uncertain_fields"> & Partial<Pick<EntityRow, "workspace_id" | "uncertain_fields">>;
```

###### Tables.entities.Update

```ts
Update: Partial<Pick<EntityRow, "data" | "uncertain_fields" | "type_id">>;
```

###### Tables.entities.Relationships

```ts
Relationships: [];
```

###### Tables.documents

```ts
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
```

###### Tables.documents.Row

```ts
Row: DocumentRow;
```

###### Tables.documents.Insert

```ts
Insert: Omit<DocumentRow, 
  | Generated
  | "workspace_id"
  | "status"
  | "deleted_at"
  | "source"
| "bucket"> & Partial<Pick<DocumentRow, "workspace_id" | "status" | "source" | "bucket">>;
```

###### Tables.documents.Update

```ts
Update: Partial<Omit<DocumentRow, "id" | "created_at" | "workspace_id">>;
```

###### Tables.documents.Relationships

```ts
Relationships: [];
```

###### Tables.chat\_messages

```ts
chat_messages: {
  Row: ChatMessageRow;
  Insert: Omit<ChatMessageRow, "id" | "created_at" | "workspace_id"> & Partial<Pick<ChatMessageRow, "workspace_id">>;
  Update: never;
  Relationships: [];
};
```

###### Tables.chat\_messages.Row

```ts
Row: ChatMessageRow;
```

###### Tables.chat\_messages.Insert

```ts
Insert: Omit<ChatMessageRow, "id" | "created_at" | "workspace_id"> & Partial<Pick<ChatMessageRow, "workspace_id">>;
```

###### Tables.chat\_messages.Update

```ts
Update: never;
```

###### Tables.chat\_messages.Relationships

```ts
Relationships: [];
```

###### Tables.activity

```ts
activity: {
  Row: ActivityRow;
  Insert: Omit<ActivityRow, "id" | "created_at" | "meta"> & Partial<Pick<ActivityRow, "meta">>;
  Update: never;
  Relationships: [];
};
```

###### Tables.activity.Row

```ts
Row: ActivityRow;
```

###### Tables.activity.Insert

```ts
Insert: Omit<ActivityRow, "id" | "created_at" | "meta"> & Partial<Pick<ActivityRow, "meta">>;
```

###### Tables.activity.Update

```ts
Update: never;
```

###### Tables.activity.Relationships

```ts
Relationships: [];
```

###### Tables.ai\_jobs

```ts
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
```

###### Tables.ai\_jobs.Row

```ts
Row: AiJobRow;
```

###### Tables.ai\_jobs.Insert

```ts
Insert: Omit<AiJobRow, 
  | "id"
  | "created_at"
  | "status"
  | "progress"
  | "started_at"
| "finished_at"> & Partial<Pick<AiJobRow, "status" | "progress">>;
```

###### Tables.ai\_jobs.Update

```ts
Update: Partial<Omit<AiJobRow, "id" | "created_at" | "workspace_id">>;
```

###### Tables.ai\_jobs.Relationships

```ts
Relationships: [];
```

###### Tables.document\_reviews

```ts
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
```

###### Tables.document\_reviews.Row

```ts
Row: DocumentReviewRow;
```

###### Tables.document\_reviews.Insert

```ts
Insert: Omit<DocumentReviewRow, 
  | "id"
  | "created_at"
  | "workspace_id"
  | "status"
| "finished_at"> & Partial<Pick<DocumentReviewRow, "workspace_id" | "status">>;
```

###### Tables.document\_reviews.Update

```ts
Update: Partial<Omit<DocumentReviewRow, "id" | "created_at">>;
```

###### Tables.document\_reviews.Relationships

```ts
Relationships: [];
```

###### Tables.review\_findings

```ts
review_findings: {
  Row: ReviewFindingRow;
  Insert: Omit<ReviewFindingRow, "id" | "created_at" | "workspace_id"> & Partial<Pick<ReviewFindingRow, "workspace_id">>;
  Update: Partial<Omit<ReviewFindingRow, "id" | "created_at">>;
  Relationships: [];
};
```

###### Tables.review\_findings.Row

```ts
Row: ReviewFindingRow;
```

###### Tables.review\_findings.Insert

```ts
Insert: Omit<ReviewFindingRow, "id" | "created_at" | "workspace_id"> & Partial<Pick<ReviewFindingRow, "workspace_id">>;
```

###### Tables.review\_findings.Update

```ts
Update: Partial<Omit<ReviewFindingRow, "id" | "created_at">>;
```

###### Tables.review\_findings.Relationships

```ts
Relationships: [];
```

###### Tables.court\_practice

```ts
court_practice: {
  Row: CourtPracticeRow;
  Insert: Omit<CourtPracticeRow, "id" | "created_at">;
  Update: Partial<Omit<CourtPracticeRow, "id" | "created_at">>;
  Relationships: [];
};
```

###### Tables.court\_practice.Row

```ts
Row: CourtPracticeRow;
```

###### Tables.court\_practice.Insert

```ts
Insert: Omit<CourtPracticeRow, "id" | "created_at">;
```

###### Tables.court\_practice.Update

```ts
Update: Partial<Omit<CourtPracticeRow, "id" | "created_at">>;
```

###### Tables.court\_practice.Relationships

```ts
Relationships: [];
```

###### Tables.finding\_practice

```ts
finding_practice: {
  Row: FindingPracticeRow;
  Insert: FindingPracticeRow;
  Update: Partial<Pick<FindingPracticeRow, "relevance">>;
  Relationships: [];
};
```

###### Tables.finding\_practice.Row

```ts
Row: FindingPracticeRow;
```

###### Tables.finding\_practice.Insert

```ts
Insert: FindingPracticeRow;
```

###### Tables.finding\_practice.Update

```ts
Update: Partial<Pick<FindingPracticeRow, "relevance">>;
```

###### Tables.finding\_practice.Relationships

```ts
Relationships: [];
```

###### Tables.document\_chunks

```ts
document_chunks: {
  Row: DocumentChunkRow;
  Insert: Omit<DocumentChunkRow, "id" | "created_at" | "workspace_id"> & Partial<Pick<DocumentChunkRow, "workspace_id">>;
  Update: Partial<Omit<DocumentChunkRow, "id" | "created_at">>;
  Relationships: [];
};
```

###### Tables.document\_chunks.Row

```ts
Row: DocumentChunkRow;
```

###### Tables.document\_chunks.Insert

```ts
Insert: Omit<DocumentChunkRow, "id" | "created_at" | "workspace_id"> & Partial<Pick<DocumentChunkRow, "workspace_id">>;
```

###### Tables.document\_chunks.Update

```ts
Update: Partial<Omit<DocumentChunkRow, "id" | "created_at">>;
```

###### Tables.document\_chunks.Relationships

```ts
Relationships: [];
```

###### Views

```ts
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
```

###### Views.workspace\_stats

```ts
workspace_stats: {
  Row: WorkspaceStatsRow;
  Relationships: [];
};
```

###### Views.workspace\_stats.Row

```ts
Row: WorkspaceStatsRow;
```

###### Views.workspace\_stats.Relationships

```ts
Relationships: [];
```

###### Views.ai\_usage\_daily

```ts
ai_usage_daily: {
  Row: AiUsageDailyRow;
  Relationships: [];
};
```

###### Views.ai\_usage\_daily.Row

```ts
Row: AiUsageDailyRow;
```

###### Views.ai\_usage\_daily.Relationships

```ts
Relationships: [];
```

###### Functions

```ts
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
```

###### Functions.search\_case\_chunks

```ts
search_case_chunks: {
  Args: {
     target_case: string;
     query_text: string;
     query_embedding: null | string;
     match_count: number;
    };
  Returns: CaseChunkMatch[];
};
```

###### Functions.search\_case\_chunks.Args

```ts
Args: {
  target_case: string;
  query_text: string;
  query_embedding: null | string;
  match_count: number;
};
```

###### Functions.search\_case\_chunks.Args.target\_case

```ts
target_case: string;
```

###### Functions.search\_case\_chunks.Args.query\_text

```ts
query_text: string;
```

###### Functions.search\_case\_chunks.Args.query\_embedding?

```ts
optional query_embedding: null | string;
```

###### Functions.search\_case\_chunks.Args.match\_count?

```ts
optional match_count: number;
```

###### Functions.search\_case\_chunks.Returns

```ts
Returns: CaseChunkMatch[];
```

###### Functions.platform\_overview

```ts
platform_overview: {
  Args: Record<string, never>;
  Returns: PlatformOverviewRow[];
};
```

###### Functions.platform\_overview.Args

```ts
Args: Record<string, never>;
```

###### Functions.platform\_overview.Returns

```ts
Returns: PlatformOverviewRow[];
```

###### Functions.platform\_workspaces

```ts
platform_workspaces: {
  Args: {
     search: null | string;
     limit_count: number;
     offset_count: number;
    };
  Returns: PlatformWorkspaceRow[];
};
```

###### Functions.platform\_workspaces.Args

```ts
Args: {
  search: null | string;
  limit_count: number;
  offset_count: number;
};
```

###### Functions.platform\_workspaces.Args.search?

```ts
optional search: null | string;
```

###### Functions.platform\_workspaces.Args.limit\_count?

```ts
optional limit_count: number;
```

###### Functions.platform\_workspaces.Args.offset\_count?

```ts
optional offset_count: number;
```

###### Functions.platform\_workspaces.Returns

```ts
Returns: PlatformWorkspaceRow[];
```

###### Functions.platform\_signups

```ts
platform_signups: {
  Args: {
     days: number;
    };
  Returns: {
     day: string;
     signups: number;
    }[];
};
```

###### Functions.platform\_signups.Args

```ts
Args: {
  days: number;
};
```

###### Functions.platform\_signups.Args.days?

```ts
optional days: number;
```

###### Functions.platform\_signups.Returns

```ts
Returns: {
  day: string;
  signups: number;
 }[];
```

###### Functions.accept\_pending\_invites

```ts
accept_pending_invites: {
  Args: Record<string, never>;
  Returns: number;
};
```

Принимает приглашения, адресованные почте вошедшего. Возвращает их число.

###### Functions.accept\_pending\_invites.Args

```ts
Args: Record<string, never>;
```

###### Functions.accept\_pending\_invites.Returns

```ts
Returns: number;
```

###### Enums

```ts
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
```

###### Enums.workspace\_role

```ts
workspace_role: WorkspaceRole;
```

###### Enums.platform\_role

```ts
platform_role: PlatformRole;
```

###### Enums.case\_status

```ts
case_status: CaseStatus;
```

###### Enums.document\_status

```ts
document_status: DocumentStatus;
```

###### Enums.document\_source

```ts
document_source: DocumentSource;
```

###### Enums.risk\_level

```ts
risk_level: RiskLevel;
```

###### Enums.chat\_role

```ts
chat_role: ChatRole;
```

###### Enums.activity\_kind

```ts
activity_kind: ActivityKind;
```

###### Enums.ai\_task

```ts
ai_task: AiTask;
```

###### Enums.job\_status

```ts
job_status: JobStatus;
```

###### CompositeTypes

```ts
CompositeTypes: Record<string, never>;
```

###### Defined in

[types/database.ts:365](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/database.ts#L365)

## Type Aliases

### Json

```ts
type Json: 
  | string
  | number
  | boolean
  | null
  | {}
  | Json[];
```

Типы базы данных.

Файл рассчитан на замену генератором: `npm run db:types` перезапишет его по
фактической схеме проекта. До первого запуска генератора он написан вручную
по миграциям — иначе приложение не собралось бы.

Правило: не правьте этот файл руками после того, как генератор заработал.
Источник истины — миграции в supabase/migrations.

#### Defined in

[types/database.ts:12](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/database.ts#L12)

***

### WorkspaceRole

```ts
type WorkspaceRole: "owner" | "admin" | "member" | "viewer";
```

#### Defined in

[types/database.ts:24](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/database.ts#L24)

***

### PlatformRole

```ts
type PlatformRole: "user" | "admin";
```

#### Defined in

[types/database.ts:25](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/database.ts#L25)

***

### CaseStatus

```ts
type CaseStatus: "in_progress" | "collecting" | "active" | "archived";
```

#### Defined in

[types/database.ts:26](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/database.ts#L26)

***

### DocumentStatus

```ts
type DocumentStatus: "draft" | "ready" | "signed" | "generating";
```

#### Defined in

[types/database.ts:27](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/database.ts#L27)

***

### DocumentSource

```ts
type DocumentSource: 
  | "upload"
  | "template"
  | "freeform"
  | "bulk"
  | "review";
```

#### Defined in

[types/database.ts:28](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/database.ts#L28)

***

### RiskLevel

```ts
type RiskLevel: "critical" | "warning" | "info";
```

#### Defined in

[types/database.ts:29](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/database.ts#L29)

***

### ChatRole

```ts
type ChatRole: "user" | "assistant";
```

#### Defined in

[types/database.ts:30](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/database.ts#L30)

***

### ActivityKind

```ts
type ActivityKind: 
  | "upload"
  | "ai"
  | "edit"
  | "create"
  | "generate";
```

#### Defined in

[types/database.ts:31](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/database.ts#L31)

***

### AiTask

```ts
type AiTask: 
  | "ocr"
  | "extract"
  | "review"
  | "assistant"
  | "freeform"
  | "bulk"
  | "package"
  | "embed";
```

#### Defined in

[types/database.ts:32](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/database.ts#L32)

***

### JobStatus

```ts
type JobStatus: 
  | "queued"
  | "running"
  | "done"
  | "failed"
  | "cancelled";
```

#### Defined in

[types/database.ts:41](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/database.ts#L41)

***

### ProfileRow

```ts
type ProfileRow: {
  id: string;
  email: string;
  full_name: string | null;
  job_title: string | null;
  avatar_path: string | null;
  platform_role: PlatformRole;
  last_workspace_id: string | null;
  created_at: string;
  updated_at: string;
};
```

#### Type declaration

##### id

```ts
id: string;
```

##### email

```ts
email: string;
```

##### full\_name

```ts
full_name: string | null;
```

##### job\_title

```ts
job_title: string | null;
```

##### avatar\_path

```ts
avatar_path: string | null;
```

##### platform\_role

```ts
platform_role: PlatformRole;
```

##### last\_workspace\_id

```ts
last_workspace_id: string | null;
```

##### created\_at

```ts
created_at: string;
```

##### updated\_at

```ts
updated_at: string;
```

#### Defined in

[types/database.ts:47](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/database.ts#L47)

***

### WorkspaceRow

```ts
type WorkspaceRow: {
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
};
```

#### Type declaration

##### id

```ts
id: string;
```

##### name

```ts
name: string;
```

##### slug

```ts
slug: string;
```

##### legal\_name

```ts
legal_name: string | null;
```

##### inn

```ts
inn: string | null;
```

##### address

```ts
address: string | null;
```

##### plan

```ts
plan: string;
```

##### created\_by

```ts
created_by: string | null;
```

##### created\_at

```ts
created_at: string;
```

##### updated\_at

```ts
updated_at: string;
```

##### archived\_at

```ts
archived_at: string | null;
```

#### Defined in

[types/database.ts:59](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/database.ts#L59)

***

### WorkspaceMemberRow

```ts
type WorkspaceMemberRow: {
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  invited_by: string | null;
  created_at: string;
};
```

#### Type declaration

##### workspace\_id

```ts
workspace_id: string;
```

##### user\_id

```ts
user_id: string;
```

##### role

```ts
role: WorkspaceRole;
```

##### invited\_by

```ts
invited_by: string | null;
```

##### created\_at

```ts
created_at: string;
```

#### Defined in

[types/database.ts:73](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/database.ts#L73)

***

### WorkspaceInviteRow

```ts
type WorkspaceInviteRow: {
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
};
```

#### Type declaration

##### id

```ts
id: string;
```

##### workspace\_id

```ts
workspace_id: string;
```

##### email

```ts
email: string;
```

##### role

```ts
role: WorkspaceRole;
```

##### token

```ts
token: string;
```

##### invited\_by

```ts
invited_by: string | null;
```

##### expires\_at

```ts
expires_at: string;
```

##### accepted\_at

```ts
accepted_at: string | null;
```

##### accepted\_by

```ts
accepted_by: string | null;
```

##### created\_at

```ts
created_at: string;
```

#### Defined in

[types/database.ts:81](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/database.ts#L81)

***

### EntityFieldDefinition

```ts
type EntityFieldDefinition: {
  key: string;
  label: string;
  required: boolean;
  placeholder: string;
  width: number;
  pattern: string;
  patternError: string;
};
```

Описание одного реквизита внутри `entity_types.fields`.

#### Type declaration

##### key

```ts
key: string;
```

##### label

```ts
label: string;
```

##### required

```ts
required: boolean;
```

##### placeholder?

```ts
optional placeholder: string;
```

##### width?

```ts
optional width: number;
```

##### pattern?

```ts
optional pattern: string;
```

Регулярное выражение в синтаксисе POSIX — его же применяет база.

##### patternError?

```ts
optional patternError: string;
```

#### Defined in

[types/database.ts:95](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/database.ts#L95)

***

### EntityTypeRow

```ts
type EntityTypeRow: {
  id: string;
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
};
```

#### Type declaration

##### id

```ts
id: string;
```

##### workspace\_id

```ts
workspace_id: string | null;
```

NULL — встроенный тип, доступный всем пространствам.

##### key

```ts
key: string;
```

##### label

```ts
label: string;
```

##### hint

```ts
hint: string | null;
```

##### is\_custom

```ts
is_custom: boolean;
```

##### fields

```ts
fields: EntityFieldDefinition[];
```

##### templates

```ts
templates: string[];
```

##### created\_by

```ts
created_by: string | null;
```

##### created\_at

```ts
created_at: string;
```

##### updated\_at

```ts
updated_at: string;
```

##### archived\_at

```ts
archived_at: string | null;
```

#### Defined in

[types/database.ts:106](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/database.ts#L106)

***

### CaseRow

```ts
type CaseRow: {
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
};
```

#### Type declaration

##### id

```ts
id: string;
```

##### workspace\_id

```ts
workspace_id: string;
```

##### title

```ts
title: string;
```

##### status

```ts
status: CaseStatus;
```

##### tags

```ts
tags: string[];
```

##### description

```ts
description: string | null;
```

##### created\_by

```ts
created_by: string | null;
```

##### created\_at

```ts
created_at: string;
```

##### updated\_at

```ts
updated_at: string;
```

##### archived\_at

```ts
archived_at: string | null;
```

#### Defined in

[types/database.ts:122](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/database.ts#L122)

***

### EntityRow

```ts
type EntityRow: {
  id: string;
  workspace_id: string;
  case_id: string;
  type_id: string;
  data: Record<string, string>;
  validation_errors: string[];
  uncertain_fields: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
};
```

#### Type declaration

##### id

```ts
id: string;
```

##### workspace\_id

```ts
workspace_id: string;
```

##### case\_id

```ts
case_id: string;
```

##### type\_id

```ts
type_id: string;
```

##### data

```ts
data: Record<string, string>;
```

##### validation\_errors

```ts
validation_errors: string[];
```

Считается триггером в базе; на запись не принимается.

##### uncertain\_fields

```ts
uncertain_fields: string[];
```

##### created\_by

```ts
created_by: string | null;
```

##### created\_at

```ts
created_at: string;
```

##### updated\_at

```ts
updated_at: string;
```

#### Defined in

[types/database.ts:135](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/database.ts#L135)

***

### DocumentRow

```ts
type DocumentRow: {
  id: string;
  workspace_id: string;
  case_id: string;
  title: string;
  kind: string | null;
  status: DocumentStatus;
  source: DocumentSource;
  bucket: string;
  path: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  sha256: string | null;
  entity_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};
```

#### Type declaration

##### id

```ts
id: string;
```

##### workspace\_id

```ts
workspace_id: string;
```

##### case\_id

```ts
case_id: string;
```

##### title

```ts
title: string;
```

##### kind

```ts
kind: string | null;
```

##### status

```ts
status: DocumentStatus;
```

##### source

```ts
source: DocumentSource;
```

##### bucket

```ts
bucket: string;
```

##### path

```ts
path: string | null;
```

Путь внутри бакета. Ссылка собирается на клиенте.

##### mime\_type

```ts
mime_type: string | null;
```

##### size\_bytes

```ts
size_bytes: number | null;
```

##### sha256

```ts
sha256: string | null;
```

##### entity\_id

```ts
entity_id: string | null;
```

##### created\_by

```ts
created_by: string | null;
```

##### created\_at

```ts
created_at: string;
```

##### updated\_at

```ts
updated_at: string;
```

##### deleted\_at

```ts
deleted_at: string | null;
```

#### Defined in

[types/database.ts:149](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/database.ts#L149)

***

### ChatMessageRow

```ts
type ChatMessageRow: {
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
};
```

#### Type declaration

##### id

```ts
id: string;
```

##### workspace\_id

```ts
workspace_id: string;
```

##### case\_id

```ts
case_id: string;
```

##### role

```ts
role: ChatRole;
```

##### text

```ts
text: string;
```

##### findings

```ts
findings: Json | null;
```

##### citations

```ts
citations: Json | null;
```

##### ai\_job\_id

```ts
ai_job_id: string | null;
```

##### created\_by

```ts
created_by: string | null;
```

##### created\_at

```ts
created_at: string;
```

#### Defined in

[types/database.ts:170](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/database.ts#L170)

***

### ActivityRow

```ts
type ActivityRow: {
  id: string;
  workspace_id: string;
  case_id: string | null;
  kind: ActivityKind;
  text: string;
  actor_id: string | null;
  meta: Json;
  created_at: string;
};
```

#### Type declaration

##### id

```ts
id: string;
```

##### workspace\_id

```ts
workspace_id: string;
```

##### case\_id

```ts
case_id: string | null;
```

##### kind

```ts
kind: ActivityKind;
```

##### text

```ts
text: string;
```

##### actor\_id

```ts
actor_id: string | null;
```

##### meta

```ts
meta: Json;
```

##### created\_at

```ts
created_at: string;
```

#### Defined in

[types/database.ts:183](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/database.ts#L183)

***

### AiJobRow

```ts
type AiJobRow: {
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
};
```

#### Type declaration

##### id

```ts
id: string;
```

##### workspace\_id

```ts
workspace_id: string;
```

##### case\_id

```ts
case_id: string | null;
```

##### document\_id

```ts
document_id: string | null;
```

##### task

```ts
task: AiTask;
```

##### status

```ts
status: JobStatus;
```

##### progress

```ts
progress: number;
```

##### provider

```ts
provider: string | null;
```

##### model

```ts
model: string | null;
```

##### prompt\_version

```ts
prompt_version: string | null;
```

##### input

```ts
input: Json;
```

##### output

```ts
output: Json | null;
```

##### input\_hash

```ts
input_hash: string | null;
```

##### tokens\_in

```ts
tokens_in: number | null;
```

##### tokens\_out

```ts
tokens_out: number | null;
```

##### cost\_usd

```ts
cost_usd: number | null;
```

##### error

```ts
error: string | null;
```

##### correction

```ts
correction: Json | null;
```

##### created\_by

```ts
created_by: string | null;
```

##### created\_at

```ts
created_at: string;
```

##### started\_at

```ts
started_at: string | null;
```

##### finished\_at

```ts
finished_at: string | null;
```

#### Defined in

[types/database.ts:194](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/database.ts#L194)

***

### DocumentReviewRow

```ts
type DocumentReviewRow: {
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
};
```

#### Type declaration

##### id

```ts
id: string;
```

##### workspace\_id

```ts
workspace_id: string;
```

##### case\_id

```ts
case_id: string | null;
```

##### document\_id

```ts
document_id: string;
```

##### ai\_job\_id

```ts
ai_job_id: string | null;
```

##### status

```ts
status: JobStatus;
```

##### paragraphs

```ts
paragraphs: Json;
```

##### critical\_count

```ts
critical_count: number;
```

##### warning\_count

```ts
warning_count: number;
```

##### info\_count

```ts
info_count: number;
```

##### created\_by

```ts
created_by: string | null;
```

##### created\_at

```ts
created_at: string;
```

##### finished\_at

```ts
finished_at: string | null;
```

#### Defined in

[types/database.ts:219](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/database.ts#L219)

***

### ReviewFindingRow

```ts
type ReviewFindingRow: {
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
};
```

#### Type declaration

##### id

```ts
id: string;
```

##### review\_id

```ts
review_id: string;
```

##### workspace\_id

```ts
workspace_id: string;
```

##### level

```ts
level: RiskLevel;
```

##### title

```ts
title: string;
```

##### description

```ts
description: string;
```

##### recommendation

```ts
recommendation: string | null;
```

##### clause

```ts
clause: string | null;
```

##### paragraph\_id

```ts
paragraph_id: string | null;
```

##### sort\_order

```ts
sort_order: number;
```

##### created\_at

```ts
created_at: string;
```

#### Defined in

[types/database.ts:235](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/database.ts#L235)

***

### CourtPracticeRow

```ts
type CourtPracticeRow: {
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
};
```

#### Type declaration

##### id

```ts
id: string;
```

##### source

```ts
source: string;
```

##### external\_id

```ts
external_id: string | null;
```

##### court

```ts
court: string;
```

##### number

```ts
number: string;
```

##### year

```ts
year: string;
```

##### holding

```ts
holding: string | null;
```

##### url

```ts
url: string | null;
```

##### side

```ts
side: "against" | "favor";
```

##### created\_at

```ts
created_at: string;
```

#### Defined in

[types/database.ts:249](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/database.ts#L249)

***

### FindingPracticeRow

```ts
type FindingPracticeRow: {
  finding_id: string;
  practice_id: string;
  relevance: number | null;
};
```

#### Type declaration

##### finding\_id

```ts
finding_id: string;
```

##### practice\_id

```ts
practice_id: string;
```

##### relevance

```ts
relevance: number | null;
```

#### Defined in

[types/database.ts:262](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/database.ts#L262)

***

### DocumentChunkRow

```ts
type DocumentChunkRow: {
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
};
```

#### Type declaration

##### id

```ts
id: string;
```

##### workspace\_id

```ts
workspace_id: string;
```

##### case\_id

```ts
case_id: string;
```

##### document\_id

```ts
document_id: string;
```

##### chunk\_index

```ts
chunk_index: number;
```

##### text

```ts
text: string;
```

##### page

```ts
page: number | null;
```

##### clause

```ts
clause: string | null;
```

##### embedding

```ts
embedding: string | null;
```

##### embedding\_model

```ts
embedding_model: string | null;
```

##### created\_at

```ts
created_at: string;
```

#### Defined in

[types/database.ts:268](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/database.ts#L268)

***

### WorkspaceStatsRow

```ts
type WorkspaceStatsRow: {
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
};
```

#### Type declaration

##### workspace\_id

```ts
workspace_id: string;
```

##### name

```ts
name: string;
```

##### plan

```ts
plan: string;
```

##### members

```ts
members: number;
```

##### cases

```ts
cases: number;
```

##### entities

```ts
entities: number;
```

##### entities\_ready

```ts
entities_ready: number;
```

##### documents

```ts
documents: number;
```

##### storage\_bytes

```ts
storage_bytes: number;
```

##### custom\_types

```ts
custom_types: number;
```

##### ai\_jobs

```ts
ai_jobs: number;
```

##### ai\_cost\_usd\_month

```ts
ai_cost_usd_month: number;
```

##### created\_at

```ts
created_at: string;
```

#### Defined in

[types/database.ts:286](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/database.ts#L286)

***

### AiUsageDailyRow

```ts
type AiUsageDailyRow: {
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
};
```

#### Type declaration

##### workspace\_id

```ts
workspace_id: string;
```

##### day

```ts
day: string;
```

##### task

```ts
task: AiTask;
```

##### provider

```ts
provider: string | null;
```

##### model

```ts
model: string | null;
```

##### runs

```ts
runs: number;
```

##### failed

```ts
failed: number;
```

##### corrected

```ts
corrected: number;
```

##### tokens\_in

```ts
tokens_in: number;
```

##### tokens\_out

```ts
tokens_out: number;
```

##### cost\_usd

```ts
cost_usd: number;
```

##### avg\_seconds

```ts
avg_seconds: number | null;
```

#### Defined in

[types/database.ts:302](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/database.ts#L302)

***

### PlatformOverviewRow

```ts
type PlatformOverviewRow: {
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
};
```

#### Type declaration

##### users

```ts
users: number;
```

##### users\_new\_7d

```ts
users_new_7d: number;
```

##### workspaces

```ts
workspaces: number;
```

##### cases

```ts
cases: number;
```

##### documents

```ts
documents: number;
```

##### entities

```ts
entities: number;
```

##### storage\_bytes

```ts
storage_bytes: number;
```

##### ai\_jobs\_30d

```ts
ai_jobs_30d: number;
```

##### ai\_cost\_usd\_30d

```ts
ai_cost_usd_30d: number;
```

##### ai\_failure\_rate

```ts
ai_failure_rate: number;
```

#### Defined in

[types/database.ts:317](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/database.ts#L317)

***

### PlatformWorkspaceRow

```ts
type PlatformWorkspaceRow: {
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
};
```

#### Type declaration

##### workspace\_id

```ts
workspace_id: string;
```

##### name

```ts
name: string;
```

##### slug

```ts
slug: string;
```

##### plan

```ts
plan: string;
```

##### owner\_email

```ts
owner_email: string | null;
```

##### members

```ts
members: number;
```

##### cases

```ts
cases: number;
```

##### documents

```ts
documents: number;
```

##### ai\_cost\_usd\_30d

```ts
ai_cost_usd_30d: number;
```

##### last\_activity\_at

```ts
last_activity_at: string | null;
```

##### created\_at

```ts
created_at: string;
```

#### Defined in

[types/database.ts:330](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/database.ts#L330)

***

### CaseChunkMatch

```ts
type CaseChunkMatch: {
  id: string;
  document_id: string;
  text: string;
  page: number | null;
  clause: string | null;
  score: number;
};
```

#### Type declaration

##### id

```ts
id: string;
```

##### document\_id

```ts
document_id: string;
```

##### text

```ts
text: string;
```

##### page

```ts
page: number | null;
```

##### clause

```ts
clause: string | null;
```

##### score

```ts
score: number;
```

#### Defined in

[types/database.ts:344](https://github.com/Brtsiev-Kazbek/Aleteta-front-dev/blob/175322bace04e67fdc0a42e3400fb86a183d27c8/types/database.ts#L344)
