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
      admin_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          sender_email: string | null
          sender_name: string | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          sender_email?: string | null
          sender_name?: string | null
          title: string
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          sender_email?: string | null
          sender_name?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          new_value: string | null
          old_value: string | null
          performed_by: string
          target_user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          performed_by: string
          target_user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          performed_by?: string
          target_user_id?: string
        }
        Relationships: []
      }
      badge_catalog: {
        Row: {
          bonus_points: number
          category: string
          code: string
          color: string
          created_at: string
          description: string
          evidence_hint: string | null
          icon: string
          id: string
          is_active: boolean
          is_diamond: boolean
          name: string
          requires_founder: boolean
          requires_peer: boolean
          sort_order: number
          subcategory: string | null
          tier: number | null
        }
        Insert: {
          bonus_points?: number
          category: string
          code: string
          color?: string
          created_at?: string
          description: string
          evidence_hint?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          is_diamond?: boolean
          name: string
          requires_founder?: boolean
          requires_peer?: boolean
          sort_order?: number
          subcategory?: string | null
          tier?: number | null
        }
        Update: {
          bonus_points?: number
          category?: string
          code?: string
          color?: string
          created_at?: string
          description?: string
          evidence_hint?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          is_diamond?: boolean
          name?: string
          requires_founder?: boolean
          requires_peer?: boolean
          sort_order?: number
          subcategory?: string | null
          tier?: number | null
        }
        Relationships: []
      }
      badge_claims: {
        Row: {
          badge_id: string
          created_at: string
          evidence: string
          id: string
          peer_confirmed: boolean | null
          peer_confirmed_at: string | null
          peer_user_id: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["badge_claim_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          badge_id: string
          created_at?: string
          evidence: string
          id?: string
          peer_confirmed?: boolean | null
          peer_confirmed_at?: string | null
          peer_user_id?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["badge_claim_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          created_at?: string
          evidence?: string
          id?: string
          peer_confirmed?: boolean | null
          peer_confirmed_at?: string | null
          peer_user_id?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["badge_claim_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "badge_claims_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badge_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_requests: {
        Row: {
          created_at: string
          from_user_id: string
          id: string
          is_read: boolean
          message: string
          to_user_id: string
        }
        Insert: {
          created_at?: string
          from_user_id: string
          id?: string
          is_read?: boolean
          message: string
          to_user_id: string
        }
        Update: {
          created_at?: string
          from_user_id?: string
          id?: string
          is_read?: boolean
          message?: string
          to_user_id?: string
        }
        Relationships: []
      }
      event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          id: string
          status: Database["public"]["Enums"]["rsvp_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          status?: Database["public"]["Enums"]["rsvp_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          status?: Database["public"]["Enums"]["rsvp_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          image_url: string | null
          is_online: boolean
          is_published: boolean
          location: string | null
          max_attendees: number | null
          online_url: string | null
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          image_url?: string | null
          is_online?: boolean
          is_published?: boolean
          location?: string | null
          max_attendees?: number | null
          online_url?: string | null
          starts_at: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          image_url?: string | null
          is_online?: boolean
          is_published?: boolean
          location?: string | null
          max_attendees?: number | null
          online_url?: string | null
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      forum_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          min_tier: Database["public"]["Enums"]["membership_tier"]
          name: string
          requires_approval: boolean
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          min_tier?: Database["public"]["Enums"]["membership_tier"]
          name: string
          requires_approval?: boolean
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          min_tier?: Database["public"]["Enums"]["membership_tier"]
          name?: string
          requires_approval?: boolean
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      forum_replies: {
        Row: {
          content: string
          created_at: string
          id: string
          topic_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          topic_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          topic_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "forum_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_topics: {
        Row: {
          category_id: string
          content: string
          created_at: string
          id: string
          is_approved: boolean
          is_locked: boolean
          is_pinned: boolean
          last_reply_at: string | null
          reply_count: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id: string
          content: string
          created_at?: string
          id?: string
          is_approved?: boolean
          is_locked?: boolean
          is_pinned?: boolean
          last_reply_at?: string | null
          reply_count?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string
          content?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          is_locked?: boolean
          is_pinned?: boolean
          last_reply_at?: string | null
          reply_count?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_topics_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "forum_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      member_badges: {
        Row: {
          awarded_at: string
          awarded_by: string | null
          badge_id: string
          claim_id: string | null
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          awarded_at?: string
          awarded_by?: string | null
          badge_id: string
          claim_id?: string | null
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          awarded_at?: string
          awarded_by?: string | null
          badge_id?: string
          claim_id?: string | null
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badge_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_badges_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "badge_claims"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          subscribed_at: string
        }
        Insert: {
          email: string
          id?: string
          subscribed_at?: string
        }
        Update: {
          email?: string
          id?: string
          subscribed_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company: string | null
          company_url: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          display_name: string | null
          id: string
          linkedin_url: string | null
          membership_tier: Database["public"]["Enums"]["membership_tier"]
          profile_visibility: Json
          updated_at: string
          user_id: string
          viber_access_override: boolean
          vibetor_type: Database["public"]["Enums"]["vibetor_type"] | null
          website_links: Json | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          company_url?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          linkedin_url?: string | null
          membership_tier?: Database["public"]["Enums"]["membership_tier"]
          profile_visibility?: Json
          updated_at?: string
          user_id: string
          viber_access_override?: boolean
          vibetor_type?: Database["public"]["Enums"]["vibetor_type"] | null
          website_links?: Json | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          company_url?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          linkedin_url?: string | null
          membership_tier?: Database["public"]["Enums"]["membership_tier"]
          profile_visibility?: Json
          updated_at?: string
          user_id?: string
          viber_access_override?: boolean
          vibetor_type?: Database["public"]["Enums"]["vibetor_type"] | null
          website_links?: Json | null
        }
        Relationships: []
      }
      showcase_items: {
        Row: {
          benefits: string[] | null
          category_tags: string[] | null
          challenge: string | null
          content: string | null
          created_at: string
          description: string
          id: string
          image_url: string | null
          key_figures: Json | null
          link_url: string | null
          pricing_info: string | null
          rejection_reason: string | null
          solution: string | null
          status: Database["public"]["Enums"]["approval_status"]
          title: string
          type: Database["public"]["Enums"]["showcase_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          benefits?: string[] | null
          category_tags?: string[] | null
          challenge?: string | null
          content?: string | null
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          key_figures?: Json | null
          link_url?: string | null
          pricing_info?: string | null
          rejection_reason?: string | null
          solution?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          title: string
          type: Database["public"]["Enums"]["showcase_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          benefits?: string[] | null
          category_tags?: string[] | null
          challenge?: string | null
          content?: string | null
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          key_figures?: Json | null
          link_url?: string | null
          pricing_info?: string | null
          rejection_reason?: string | null
          solution?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          title?: string
          type?: Database["public"]["Enums"]["showcase_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      showcase_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          showcase_item_id: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          showcase_item_id: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          showcase_item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "showcase_reviews_showcase_item_id_fkey"
            columns: ["showcase_item_id"]
            isOneToOne: false
            referencedRelation: "showcase_items"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vibetor_applications: {
        Row: {
          company_name: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_company: boolean
          linkedin_url: string | null
          motivation: string
          rejection_reason: string | null
          representative_name: string | null
          status: string
          updated_at: string
          user_id: string | null
          vibetor_type: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_company?: boolean
          linkedin_url?: string | null
          motivation: string
          rejection_reason?: string | null
          representative_name?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          vibetor_type: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_company?: boolean
          linkedin_url?: string | null
          motivation?: string
          rejection_reason?: string | null
          representative_name?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          vibetor_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_badge_leaderboard: {
        Args: never
        Returns: {
          avatar_url: string
          badge_count: number
          display_name: string
          is_founder: boolean
          membership_tier: Database["public"]["Enums"]["membership_tier"]
          total_points: number
          user_id: string
        }[]
      }
      get_event_rsvp_count: { Args: { _event_id: string }; Returns: number }
      get_membership_tier: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["membership_tier"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_viber_access: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "superadmin" | "admin" | "moderator" | "user"
      approval_status: "pending" | "approved" | "rejected"
      badge_claim_status:
        | "pending_peer"
        | "pending_review"
        | "approved"
        | "rejected"
      event_type: "meetup" | "webinar" | "workshop" | "hackathon"
      membership_tier: "starter" | "viber" | "vibetor"
      rsvp_status: "going" | "maybe" | "cancelled"
      showcase_type:
        | "case_study"
        | "testimonial"
        | "tool"
        | "guidebook"
        | "sample_code"
        | "infographic"
      vibetor_type: "investor" | "innovator" | "partner"
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
      app_role: ["superadmin", "admin", "moderator", "user"],
      approval_status: ["pending", "approved", "rejected"],
      badge_claim_status: [
        "pending_peer",
        "pending_review",
        "approved",
        "rejected",
      ],
      event_type: ["meetup", "webinar", "workshop", "hackathon"],
      membership_tier: ["starter", "viber", "vibetor"],
      rsvp_status: ["going", "maybe", "cancelled"],
      showcase_type: [
        "case_study",
        "testimonial",
        "tool",
        "guidebook",
        "sample_code",
        "infographic",
      ],
      vibetor_type: ["investor", "innovator", "partner"],
    },
  },
} as const
