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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cases: {
        Row: {
          category: string
          created_at: string
          creator_id: string | null
          data: Json
          description: string
          difficulty: string
          difficulty_score: number
          factors: Json
          id: string
          incident: string
          is_demo: boolean
          official_decision: string
          options: Json
          recommended_decision: string | null
          scenario_status: string
          slug: string
          sport: string
          status: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          category: string
          created_at?: string
          creator_id?: string | null
          data: Json
          description: string
          difficulty: string
          difficulty_score: number
          factors: Json
          id: string
          incident: string
          is_demo?: boolean
          official_decision: string
          options: Json
          recommended_decision?: string | null
          scenario_status: string
          slug: string
          sport: string
          status?: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          creator_id?: string | null
          data?: Json
          description?: string
          difficulty?: string
          difficulty_score?: number
          factors?: Json
          id?: string
          incident?: string
          is_demo?: boolean
          official_decision?: string
          options?: Json
          recommended_decision?: string | null
          scenario_status?: string
          slug?: string
          sport?: string
          status?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cases_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_helpful_votes: {
        Row: {
          comment_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_helpful_votes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "discussion_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      comparisons: {
        Row: {
          case_a: string
          case_b: string
          created_at: string
          differences: Json
          id: string
          similarity_score: number
        }
        Insert: {
          case_a: string
          case_b: string
          created_at?: string
          differences?: Json
          id?: string
          similarity_score: number
        }
        Update: {
          case_a?: string
          case_b?: string
          created_at?: string
          differences?: Json
          id?: string
          similarity_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "comparisons_case_a_fkey"
            columns: ["case_a"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comparisons_case_b_fkey"
            columns: ["case_b"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      discussion_responses: {
        Row: {
          body: string
          case_id: string
          confidence: number | null
          created_at: string
          factor_reactions: Json
          helpful_count: number
          id: string
          is_pinned: boolean
          is_verified_explanation: boolean
          rule_citation: string | null
          selected_factor_keys: string[]
          selected_option_id: string
          user_id: string
        }
        Insert: {
          body: string
          case_id: string
          confidence?: number | null
          created_at?: string
          factor_reactions?: Json
          helpful_count?: number
          id?: string
          is_pinned?: boolean
          is_verified_explanation?: boolean
          rule_citation?: string | null
          selected_factor_keys?: string[]
          selected_option_id: string
          user_id: string
        }
        Update: {
          body?: string
          case_id?: string
          confidence?: number | null
          created_at?: string
          factor_reactions?: Json
          helpful_count?: number
          id?: string
          is_pinned?: boolean
          is_verified_explanation?: boolean
          rule_citation?: string | null
          selected_factor_keys?: string[]
          selected_option_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussion_responses_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          accuracy_score: number
          avatar_initials: string
          citation_count: number
          created_at: string
          current_streak: number
          display_name: string
          helpful_answers: number
          id: string
          is_verified: boolean
          onboarding_complete: boolean
          reputation_score: number
          role: string
          specialties: string[]
        }
        Insert: {
          accuracy_score?: number
          avatar_initials?: string
          citation_count?: number
          created_at?: string
          current_streak?: number
          display_name?: string
          helpful_answers?: number
          id: string
          is_verified?: boolean
          onboarding_complete?: boolean
          reputation_score?: number
          role?: string
          specialties?: string[]
        }
        Update: {
          accuracy_score?: number
          avatar_initials?: string
          citation_count?: number
          created_at?: string
          current_streak?: number
          display_name?: string
          helpful_answers?: number
          id?: string
          is_verified?: boolean
          onboarding_complete?: boolean
          reputation_score?: number
          role?: string
          specialties?: string[]
        }
        Relationships: []
      }
      published_drafts: {
        Row: {
          created_at: string
          data: Json
          id: string
          media_path: string | null
          review_status: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data: Json
          id?: string
          media_path?: string | null
          review_status?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          media_path?: string | null
          review_status?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_cases: {
        Row: {
          case_id: string
          saved_at: string
          user_id: string
        }
        Insert: {
          case_id: string
          saved_at?: string
          user_id: string
        }
        Update: {
          case_id?: string
          saved_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_cases_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      user_answers: {
        Row: {
          answered_at: string
          case_id: string
          confidence: number
          id: string
          selected_factor_keys: string[]
          selected_option_id: string
          user_id: string
        }
        Insert: {
          answered_at?: string
          case_id: string
          confidence: number
          id?: string
          selected_factor_keys?: string[]
          selected_option_id: string
          user_id: string
        }
        Update: {
          answered_at?: string
          case_id?: string
          confidence?: number
          id?: string
          selected_factor_keys?: string[]
          selected_option_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_answers_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_case_vote_distribution: {
        Args: { p_case_id: string }
        Returns: {
          role: string
          selected_option_id: string
          vote_count: number
        }[]
      }
      recompute_reputation: { Args: Record<PropertyKey, never>; Returns: undefined }
      recompute_user_reputation: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      toggle_helpful_vote: {
        Args: { p_comment_id: string }
        Returns: {
          helpful_count: number
          is_active: boolean
        }[]
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
