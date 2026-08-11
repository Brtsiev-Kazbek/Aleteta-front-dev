/**
 * Типы базы данных: сгенерированы по фактической схеме проекта.
 *
 * Обновляются командой `npm run db:types`. Руками этот файл не правят —
 * источник истины лежит в supabase/migrations, и любая правка здесь исчезнет
 * при следующей генерации.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      activity: {
        Row: {
          actor_id: string | null
          case_id: string | null
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["activity_kind"]
          meta: Json
          text: string
          workspace_id: string
        }
        Insert: {
          actor_id?: string | null
          case_id?: string | null
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["activity_kind"]
          meta?: Json
          text: string
          workspace_id: string
        }
        Update: {
          actor_id?: string | null
          case_id?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["activity_kind"]
          meta?: Json
          text?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace_stats"
            referencedColumns: ["workspace_id"]
          },
          {
            foreignKeyName: "activity_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_jobs: {
        Row: {
          attempts: number
          case_id: string | null
          correction: Json | null
          cost: number | null
          created_at: string
          created_by: string | null
          document_id: string | null
          error: string | null
          finished_at: string | null
          id: string
          input: Json
          input_hash: string | null
          locked_at: string | null
          locked_by: string | null
          model: string | null
          next_retry_at: string | null
          output: Json | null
          progress: number
          prompt_version: string | null
          provider: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"]
          task: Database["public"]["Enums"]["ai_task"]
          tokens_in: number | null
          tokens_out: number | null
          workspace_id: string
        }
        Insert: {
          attempts?: number
          case_id?: string | null
          correction?: Json | null
          cost?: number | null
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          error?: string | null
          finished_at?: string | null
          id?: string
          input?: Json
          input_hash?: string | null
          locked_at?: string | null
          locked_by?: string | null
          model?: string | null
          next_retry_at?: string | null
          output?: Json | null
          progress?: number
          prompt_version?: string | null
          provider?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          task: Database["public"]["Enums"]["ai_task"]
          tokens_in?: number | null
          tokens_out?: number | null
          workspace_id: string
        }
        Update: {
          attempts?: number
          case_id?: string | null
          correction?: Json | null
          cost?: number | null
          created_at?: string
          created_by?: string | null
          document_id?: string | null
          error?: string | null
          finished_at?: string | null
          id?: string
          input?: Json
          input_hash?: string | null
          locked_at?: string | null
          locked_by?: string | null
          model?: string | null
          next_retry_at?: string | null
          output?: Json | null
          progress?: number
          prompt_version?: string | null
          provider?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          task?: Database["public"]["Enums"]["ai_task"]
          tokens_in?: number | null
          tokens_out?: number | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_jobs_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_jobs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_jobs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace_stats"
            referencedColumns: ["workspace_id"]
          },
          {
            foreignKeyName: "ai_jobs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          status: Database["public"]["Enums"]["case_status"]
          tags: string[]
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          status?: Database["public"]["Enums"]["case_status"]
          tags?: string[]
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          status?: Database["public"]["Enums"]["case_status"]
          tags?: string[]
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace_stats"
            referencedColumns: ["workspace_id"]
          },
          {
            foreignKeyName: "cases_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          ai_job_id: string | null
          case_id: string
          citations: Json | null
          created_at: string
          created_by: string | null
          findings: Json | null
          id: string
          role: Database["public"]["Enums"]["chat_role"]
          text: string
          workspace_id: string
        }
        Insert: {
          ai_job_id?: string | null
          case_id: string
          citations?: Json | null
          created_at?: string
          created_by?: string | null
          findings?: Json | null
          id?: string
          role: Database["public"]["Enums"]["chat_role"]
          text: string
          workspace_id: string
        }
        Update: {
          ai_job_id?: string | null
          case_id?: string
          citations?: Json | null
          created_at?: string
          created_by?: string | null
          findings?: Json | null
          id?: string
          role?: Database["public"]["Enums"]["chat_role"]
          text?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_ai_job_fkey"
            columns: ["ai_job_id"]
            isOneToOne: false
            referencedRelation: "ai_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace_stats"
            referencedColumns: ["workspace_id"]
          },
          {
            foreignKeyName: "chat_messages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      court_practice: {
        Row: {
          court: string
          created_at: string
          external_id: string | null
          holding: string | null
          id: string
          number: string
          side: string
          source: string
          url: string | null
          year: string
        }
        Insert: {
          court: string
          created_at?: string
          external_id?: string | null
          holding?: string | null
          id?: string
          number: string
          side: string
          source?: string
          url?: string | null
          year: string
        }
        Update: {
          court?: string
          created_at?: string
          external_id?: string | null
          holding?: string | null
          id?: string
          number?: string
          side?: string
          source?: string
          url?: string | null
          year?: string
        }
        Relationships: []
      }
      document_chunks: {
        Row: {
          case_id: string
          chunk_index: number
          clause: string | null
          created_at: string
          document_id: string
          embedding: string | null
          embedding_model: string | null
          id: string
          page: number | null
          text: string
          tsv: unknown
          workspace_id: string
        }
        Insert: {
          case_id: string
          chunk_index: number
          clause?: string | null
          created_at?: string
          document_id: string
          embedding?: string | null
          embedding_model?: string | null
          id?: string
          page?: number | null
          text: string
          tsv?: unknown
          workspace_id: string
        }
        Update: {
          case_id?: string
          chunk_index?: number
          clause?: string | null
          created_at?: string
          document_id?: string
          embedding?: string | null
          embedding_model?: string | null
          id?: string
          page?: number | null
          text?: string
          tsv?: unknown
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_chunks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace_stats"
            referencedColumns: ["workspace_id"]
          },
          {
            foreignKeyName: "document_chunks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      document_pages: {
        Row: {
          confidence: number | null
          created_at: string
          document_id: string
          id: string
          model: string | null
          page: number
          search: unknown
          source: string | null
          text: string
          workspace_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          document_id: string
          id?: string
          model?: string | null
          page: number
          search?: unknown
          source?: string | null
          text: string
          workspace_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          document_id?: string
          id?: string
          model?: string | null
          page?: number
          search?: unknown
          source?: string | null
          text?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_pages_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_pages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace_stats"
            referencedColumns: ["workspace_id"]
          },
          {
            foreignKeyName: "document_pages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      document_reviews: {
        Row: {
          ai_job_id: string | null
          case_id: string | null
          created_at: string
          created_by: string | null
          critical_count: number
          document_id: string
          finished_at: string | null
          id: string
          info_count: number
          paragraphs: Json
          status: Database["public"]["Enums"]["job_status"]
          warning_count: number
          workspace_id: string
        }
        Insert: {
          ai_job_id?: string | null
          case_id?: string | null
          created_at?: string
          created_by?: string | null
          critical_count?: number
          document_id: string
          finished_at?: string | null
          id?: string
          info_count?: number
          paragraphs?: Json
          status?: Database["public"]["Enums"]["job_status"]
          warning_count?: number
          workspace_id: string
        }
        Update: {
          ai_job_id?: string | null
          case_id?: string | null
          created_at?: string
          created_by?: string | null
          critical_count?: number
          document_id?: string
          finished_at?: string | null
          id?: string
          info_count?: number
          paragraphs?: Json
          status?: Database["public"]["Enums"]["job_status"]
          warning_count?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_reviews_ai_job_id_fkey"
            columns: ["ai_job_id"]
            isOneToOne: false
            referencedRelation: "ai_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_reviews_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_reviews_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_reviews_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_reviews_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace_stats"
            referencedColumns: ["workspace_id"]
          },
          {
            foreignKeyName: "document_reviews_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          bucket: string
          case_id: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          entity_id: string | null
          id: string
          kind: string | null
          mime_type: string | null
          ocr_status: Database["public"]["Enums"]["ocr_status"]
          page_count: number | null
          pages_done: number
          path: string | null
          sha256: string | null
          size_bytes: number | null
          source: Database["public"]["Enums"]["document_source"]
          status: Database["public"]["Enums"]["document_status"]
          text_source: string | null
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          bucket?: string
          case_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          entity_id?: string | null
          id?: string
          kind?: string | null
          mime_type?: string | null
          ocr_status?: Database["public"]["Enums"]["ocr_status"]
          page_count?: number | null
          pages_done?: number
          path?: string | null
          sha256?: string | null
          size_bytes?: number | null
          source?: Database["public"]["Enums"]["document_source"]
          status?: Database["public"]["Enums"]["document_status"]
          text_source?: string | null
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          bucket?: string
          case_id?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          entity_id?: string | null
          id?: string
          kind?: string | null
          mime_type?: string | null
          ocr_status?: Database["public"]["Enums"]["ocr_status"]
          page_count?: number | null
          pages_done?: number
          path?: string | null
          sha256?: string | null
          size_bytes?: number | null
          source?: Database["public"]["Enums"]["document_source"]
          status?: Database["public"]["Enums"]["document_status"]
          text_source?: string | null
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace_stats"
            referencedColumns: ["workspace_id"]
          },
          {
            foreignKeyName: "documents_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      entities: {
        Row: {
          case_id: string
          created_at: string
          created_by: string | null
          data: Json
          id: string
          type_id: string
          uncertain_fields: string[]
          updated_at: string
          validation_errors: string[]
          workspace_id: string
        }
        Insert: {
          case_id: string
          created_at?: string
          created_by?: string | null
          data?: Json
          id?: string
          type_id: string
          uncertain_fields?: string[]
          updated_at?: string
          validation_errors?: string[]
          workspace_id: string
        }
        Update: {
          case_id?: string
          created_at?: string
          created_by?: string | null
          data?: Json
          id?: string
          type_id?: string
          uncertain_fields?: string[]
          updated_at?: string
          validation_errors?: string[]
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entities_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entities_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "entity_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entities_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace_stats"
            referencedColumns: ["workspace_id"]
          },
          {
            foreignKeyName: "entities_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_types: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          fields: Json
          hint: string | null
          id: string
          is_custom: boolean
          key: string
          label: string
          templates: string[]
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          fields?: Json
          hint?: string | null
          id?: string
          is_custom?: boolean
          key: string
          label: string
          templates?: string[]
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          fields?: Json
          hint?: string | null
          id?: string
          is_custom?: boolean
          key?: string
          label?: string
          templates?: string[]
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entity_types_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_types_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace_stats"
            referencedColumns: ["workspace_id"]
          },
          {
            foreignKeyName: "entity_types_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      finding_practice: {
        Row: {
          finding_id: string
          practice_id: string
          relevance: number | null
        }
        Insert: {
          finding_id: string
          practice_id: string
          relevance?: number | null
        }
        Update: {
          finding_id?: string
          practice_id?: string
          relevance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "finding_practice_finding_id_fkey"
            columns: ["finding_id"]
            isOneToOne: false
            referencedRelation: "review_findings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finding_practice_practice_id_fkey"
            columns: ["practice_id"]
            isOneToOne: false
            referencedRelation: "court_practice"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          job_title: string | null
          last_workspace_id: string | null
          platform_role: Database["public"]["Enums"]["platform_role"]
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          job_title?: string | null
          last_workspace_id?: string | null
          platform_role?: Database["public"]["Enums"]["platform_role"]
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          job_title?: string | null
          last_workspace_id?: string | null
          platform_role?: Database["public"]["Enums"]["platform_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_last_workspace_fkey"
            columns: ["last_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace_stats"
            referencedColumns: ["workspace_id"]
          },
          {
            foreignKeyName: "profiles_last_workspace_fkey"
            columns: ["last_workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      review_findings: {
        Row: {
          clause: string | null
          created_at: string
          description: string
          id: string
          level: Database["public"]["Enums"]["risk_level"]
          paragraph_id: string | null
          recommendation: string | null
          review_id: string
          sort_order: number
          title: string
          workspace_id: string
        }
        Insert: {
          clause?: string | null
          created_at?: string
          description: string
          id?: string
          level: Database["public"]["Enums"]["risk_level"]
          paragraph_id?: string | null
          recommendation?: string | null
          review_id: string
          sort_order?: number
          title: string
          workspace_id: string
        }
        Update: {
          clause?: string | null
          created_at?: string
          description?: string
          id?: string
          level?: Database["public"]["Enums"]["risk_level"]
          paragraph_id?: string | null
          recommendation?: string | null
          review_id?: string
          sort_order?: number
          title?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_findings_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "document_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_findings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace_stats"
            referencedColumns: ["workspace_id"]
          },
          {
            foreignKeyName: "review_findings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_invites: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["workspace_role"]
          token: string
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["workspace_role"]
          token?: string
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["workspace_role"]
          token?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invites_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_invites_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace_stats"
            referencedColumns: ["workspace_id"]
          },
          {
            foreignKeyName: "workspace_invites_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          invited_by: string | null
          role: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace_stats"
            referencedColumns: ["workspace_id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          address: string | null
          archived_at: string | null
          created_at: string
          created_by: string | null
          id: string
          inn: string | null
          legal_name: string | null
          name: string
          plan: string
          slug: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          inn?: string | null
          legal_name?: string | null
          name: string
          plan?: string
          slug: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          inn?: string | null
          legal_name?: string | null
          name?: string
          plan?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      ai_usage_daily: {
        Row: {
          avg_seconds: number | null
          corrected: number | null
          cost_usd: number | null
          day: string | null
          failed: number | null
          model: string | null
          provider: string | null
          runs: number | null
          task: Database["public"]["Enums"]["ai_task"] | null
          tokens_in: number | null
          tokens_out: number | null
          workspace_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_jobs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace_stats"
            referencedColumns: ["workspace_id"]
          },
          {
            foreignKeyName: "ai_jobs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_stats: {
        Row: {
          ai_cost_usd_month: number | null
          ai_jobs: number | null
          cases: number | null
          created_at: string | null
          custom_types: number | null
          documents: number | null
          entities: number | null
          entities_ready: number | null
          members: number | null
          name: string | null
          plan: string | null
          storage_bytes: number | null
          workspace_id: string | null
        }
        Insert: {
          ai_cost_usd_month?: never
          ai_jobs?: never
          cases?: never
          created_at?: string | null
          custom_types?: never
          documents?: never
          entities?: never
          entities_ready?: never
          members?: never
          name?: string | null
          plan?: string | null
          storage_bytes?: never
          workspace_id?: string | null
        }
        Update: {
          ai_cost_usd_month?: never
          ai_jobs?: never
          cases?: never
          created_at?: string | null
          custom_types?: never
          documents?: never
          entities?: never
          entities_ready?: never
          members?: never
          name?: string | null
          plan?: string | null
          storage_bytes?: never
          workspace_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_pending_invites: { Args: never; Returns: number }
      ai_usage_by_case: {
        Args: { from_date?: string; to_date?: string }
        Returns: {
          case_id: string
          cost: number
          documents: number
          failed: number
          requests: number
          title: string
          tokens_in: number
          tokens_out: number
        }[]
      }
      ai_usage_by_member: {
        Args: { from_date?: string; to_date?: string }
        Returns: {
          cost: number
          email: string
          failed: number
          full_name: string
          member_id: string
          requests: number
          tokens_in: number
          tokens_out: number
        }[]
      }
      claim_job: {
        Args: { worker: string }
        Returns: {
          attempts: number
          case_id: string | null
          correction: Json | null
          cost: number | null
          created_at: string
          created_by: string | null
          document_id: string | null
          error: string | null
          finished_at: string | null
          id: string
          input: Json
          input_hash: string | null
          locked_at: string | null
          locked_by: string | null
          model: string | null
          next_retry_at: string | null
          output: Json | null
          progress: number
          prompt_version: string | null
          provider: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"]
          task: Database["public"]["Enums"]["ai_task"]
          tokens_in: number | null
          tokens_out: number | null
          workspace_id: string
        }
        SetofOptions: {
          from: "*"
          to: "ai_jobs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      configure_worker_key: { Args: { new_key: string }; Returns: string }
      document_text: {
        Args: { from_page?: number; target_document: string; to_page?: number }
        Returns: string
      }
      fail_job: {
        Args: { job_id: string; max_attempts?: number; reason: string }
        Returns: undefined
      }
      finish_job: {
        Args: {
          cost?: number
          job_id: string
          result: Json
          tokens_in?: number
          tokens_out?: number
        }
        Returns: undefined
      }
      platform_cancel_job: { Args: { target_job: string }; Returns: undefined }
      platform_jobs: {
        Args: {
          limit_count?: number
          offset_count?: number
          status_filter?: Database["public"]["Enums"]["job_status"]
          task_filter?: Database["public"]["Enums"]["ai_task"]
        }
        Returns: {
          actor_email: string
          attempts: number
          cost: number
          created_at: string
          error: string
          finished_at: string
          job_id: string
          model: string
          progress: number
          started_at: string
          status: Database["public"]["Enums"]["job_status"]
          task: Database["public"]["Enums"]["ai_task"]
          tokens_in: number
          tokens_out: number
          workspace_id: string
          workspace_name: string
        }[]
      }
      platform_overview: {
        Args: never
        Returns: {
          cases: number
          cost_30d: number
          documents: number
          entities: number
          failure_rate: number
          jobs_30d: number
          pages: number
          storage_bytes: number
          tokens_in_30d: number
          tokens_out_30d: number
          users: number
          users_new_7d: number
          workspaces: number
          workspaces_archived: number
        }[]
      }
      platform_queue: {
        Args: never
        Returns: {
          jobs: number
          oldest: string
          status: Database["public"]["Enums"]["job_status"]
        }[]
      }
      platform_requeue_failed: {
        Args: { task_filter?: Database["public"]["Enums"]["ai_task"] }
        Returns: number
      }
      platform_requeue_job: { Args: { target_job: string }; Returns: undefined }
      platform_set_plan: {
        Args: { new_plan: string; target_workspace: string }
        Returns: undefined
      }
      platform_set_role: {
        Args: {
          new_role: Database["public"]["Enums"]["platform_role"]
          target_user: string
        }
        Returns: undefined
      }
      platform_set_workspace_archived: {
        Args: { archived: boolean; target_workspace: string }
        Returns: undefined
      }
      platform_spend_daily: {
        Args: { days?: number }
        Returns: {
          cost: number
          day: string
          failed: number
          jobs: number
          tokens_in: number
          tokens_out: number
        }[]
      }
      platform_users: {
        Args: { limit_count?: number; offset_count?: number; search?: string }
        Returns: {
          created_at: string
          email: string
          full_name: string
          job_title: string
          last_activity_at: string
          owns: number
          platform_role: Database["public"]["Enums"]["platform_role"]
          user_id: string
          workspaces: number
        }[]
      }
      platform_workspaces: {
        Args: { limit_count?: number; offset_count?: number; search?: string }
        Returns: {
          archived_at: string
          cases: number
          cost_30d: number
          created_at: string
          documents: number
          last_activity_at: string
          members: number
          name: string
          owner_email: string
          plan: string
          slug: string
          storage_bytes: number
          workspace_id: string
        }[]
      }
      record_job_spend: {
        Args: {
          cost?: number
          job_id: string
          tokens_in?: number
          tokens_out?: number
        }
        Returns: undefined
      }
      release_stale_jobs: { Args: { older_than?: string }; Returns: number }
      requeue_job: {
        Args: { job_id: string; progress_value?: number }
        Returns: undefined
      }
      reuse_document_text: {
        Args: { target_document: string }
        Returns: number
      }
      save_document_page: {
        Args: {
          page_confidence?: number
          page_number: number
          page_source?: string
          page_text: string
          target_document: string
          used_model?: string
        }
        Returns: undefined
      }
      search_case_chunks: {
        Args: {
          match_count?: number
          query_embedding?: string
          query_text: string
          target_case: string
        }
        Returns: {
          clause: string
          document_id: string
          id: string
          page: number
          score: number
          text: string
        }[]
      }
      search_document_text: {
        Args: { limit_count?: number; query: string; target_document?: string }
        Returns: {
          document_id: string
          document_title: string
          fragment: string
          page: number
          rank: number
        }[]
      }
    }
    Enums: {
      activity_kind: "upload" | "ai" | "edit" | "create" | "generate"
      ai_task:
        | "ocr"
        | "extract"
        | "review"
        | "assistant"
        | "freeform"
        | "bulk"
        | "package"
        | "embed"
      case_status: "in_progress" | "collecting" | "active" | "archived"
      chat_role: "user" | "assistant"
      document_source: "upload" | "template" | "freeform" | "bulk" | "review"
      document_status: "draft" | "ready" | "signed" | "generating"
      job_status: "queued" | "running" | "done" | "failed" | "cancelled"
      ocr_status: "pending" | "running" | "done" | "failed" | "skipped"
      platform_role: "user" | "admin"
      risk_level: "critical" | "warning" | "info"
      workspace_role: "owner" | "admin" | "member" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      activity_kind: ["upload", "ai", "edit", "create", "generate"],
      ai_task: [
        "ocr",
        "extract",
        "review",
        "assistant",
        "freeform",
        "bulk",
        "package",
        "embed",
      ],
      case_status: ["in_progress", "collecting", "active", "archived"],
      chat_role: ["user", "assistant"],
      document_source: ["upload", "template", "freeform", "bulk", "review"],
      document_status: ["draft", "ready", "signed", "generating"],
      job_status: ["queued", "running", "done", "failed", "cancelled"],
      ocr_status: ["pending", "running", "done", "failed", "skipped"],
      platform_role: ["user", "admin"],
      risk_level: ["critical", "warning", "info"],
      workspace_role: ["owner", "admin", "member", "viewer"],
    },
  },
} as const
