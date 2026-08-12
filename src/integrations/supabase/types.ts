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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      aimusic_generations: {
        Row: {
          audio_url: string | null
          color: string
          cover_url: string | null
          created_at: string
          error_message: string | null
          id: string
          lyrics: string | null
          lyrics_mode: string | null
          mood: string
          scene: string
          status: string
          tags_description: string | null
          task_id: string | null
          title: string | null
          updated_at: string
          wine: string
        }
        Insert: {
          audio_url?: string | null
          color: string
          cover_url?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          lyrics?: string | null
          lyrics_mode?: string | null
          mood: string
          scene: string
          status?: string
          tags_description?: string | null
          task_id?: string | null
          title?: string | null
          updated_at?: string
          wine: string
        }
        Update: {
          audio_url?: string | null
          color?: string
          cover_url?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          lyrics?: string | null
          lyrics_mode?: string | null
          mood?: string
          scene?: string
          status?: string
          tags_description?: string | null
          task_id?: string | null
          title?: string | null
          updated_at?: string
          wine?: string
        }
        Relationships: []
      }
      email_history: {
        Row: {
          created_at: string | null
          id: string
          original_content: string
          polished_content: string | null
          sent_at: string | null
          status: string
          subject: string
          to_email: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          original_content: string
          polished_content?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          to_email: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          original_content?: string
          polished_content?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          to_email?: string
          user_id?: string | null
        }
        Relationships: []
      }
      gmail_configs: {
        Row: {
          created_at: string | null
          email_address: string | null
          id: string
          refresh_token: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email_address?: string | null
          id?: string
          refresh_token: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email_address?: string | null
          id?: string
          refresh_token?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      group_members: {
        Row: {
          group_id: string
          joined_at: string | null
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          joined_at?: string | null
          role?: string
          user_id: string
        }
        Update: {
          group_id?: string
          joined_at?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          invite_code: string | null
          name: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          invite_code?: string | null
          name: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          invite_code?: string | null
          name?: string
        }
        Relationships: []
      }
      job_categories: {
        Row: {
          created_at: string
          display_order: number
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          name: string
          user_id?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          category_id: string | null
          company: string
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          is_shared: boolean
          location: string | null
          published_at: string
          referral_code: string | null
          requirements: string | null
          scraped_at: string
          shared_to_group_id: string | null
          source_url: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          category_id?: string | null
          company: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_shared?: boolean
          location?: string | null
          published_at?: string
          referral_code?: string | null
          requirements?: string | null
          scraped_at?: string
          shared_to_group_id?: string | null
          source_url?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          category_id?: string | null
          company?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_shared?: boolean
          location?: string | null
          published_at?: string
          referral_code?: string | null
          requirements?: string | null
          scraped_at?: string
          shared_to_group_id?: string | null
          source_url?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "job_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_shared_to_group_id_fkey"
            columns: ["shared_to_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      mock_interview_sessions: {
        Row: {
          conversation_history: Json | null
          created_at: string | null
          feedback_summary: string | null
          id: string
          job_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          conversation_history?: Json | null
          created_at?: string | null
          feedback_summary?: string | null
          id?: string
          job_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          conversation_history?: Json | null
          created_at?: string | null
          feedback_summary?: string | null
          id?: string
          job_id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      pua_conversations: {
        Row: {
          created_at: string
          id: string
          session_id: string
          title: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          session_id: string
          title?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string
          title?: string | null
        }
        Relationships: []
      }
      pua_messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string
          id: string
          role: string
          session_id: string
          thinking: string | null
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          role: string
          session_id: string
          thinking?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          role?: string
          session_id?: string
          thinking?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pua_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "pua_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_job_status: {
        Row: {
          created_at: string
          id: string
          is_bookmarked: boolean
          job_id: string
          notes: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_bookmarked?: boolean
          job_id: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_bookmarked?: boolean
          job_id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_job_status_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_group_member: { Args: { group_uuid: string }; Returns: boolean }
      is_same_group_member: {
        Args: { target_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
