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
      course_certificates: {
        Row: {
          completion_date: string
          course_content: string
          course_id: string
          course_title: string
          created_at: string
          id: string
          issued_by: string
          issued_by_name: string
          method: Database["public"]["Enums"]["course_method"]
          method_details: string | null
          participant_name: string
          participant_user_id: string | null
          pdf_url: string | null
          updated_at: string
        }
        Insert: {
          completion_date: string
          course_content: string
          course_id: string
          course_title: string
          created_at?: string
          id?: string
          issued_by: string
          issued_by_name: string
          method: Database["public"]["Enums"]["course_method"]
          method_details?: string | null
          participant_name: string
          participant_user_id?: string | null
          pdf_url?: string | null
          updated_at?: string
        }
        Update: {
          completion_date?: string
          course_content?: string
          course_id?: string
          course_title?: string
          created_at?: string
          id?: string
          issued_by?: string
          issued_by_name?: string
          method?: Database["public"]["Enums"]["course_method"]
          method_details?: string | null
          participant_name?: string
          participant_user_id?: string | null
          pdf_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          badge_id: string | null
          created_at: string
          created_by: string | null
          default_method: Database["public"]["Enums"]["course_method"]
          id: string
          is_active: boolean
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          badge_id?: string | null
          created_at?: string
          created_by?: string | null
          default_method?: Database["public"]["Enums"]["course_method"]
          id?: string
          is_active?: boolean
          summary: string
          title: string
          updated_at?: string
        }
        Update: {
          badge_id?: string | null
          created_at?: string
          created_by?: string | null
          default_method?: Database["public"]["Enums"]["course_method"]
          id?: string
          is_active?: boolean
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badge_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      event_feedback: {
        Row: {
          comments: string | null
          created_at: string
          email: string
          event_id: string
          id: string
          name: string | null
          overall_rating: number
          program_ratings: Json
        }
        Insert: {
          comments?: string | null
          created_at?: string
          email: string
          event_id: string
          id?: string
          name?: string | null
          overall_rating: number
          program_ratings?: Json
        }
        Update: {
          comments?: string | null
          created_at?: string
          email?: string
          event_id?: string
          id?: string
          name?: string | null
          overall_rating?: number
          program_ratings?: Json
        }
        Relationships: [
          {
            foreignKeyName: "event_feedback_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_presentations: {
        Row: {
          created_at: string
          event_id: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string
          title: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          event_id: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string
          title: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string
          title?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_presentations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
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
      event_signups: {
        Row: {
          company: string
          created_at: string
          email: string
          event_id: string
          full_name: string
          id: string
          phone: string | null
        }
        Insert: {
          company: string
          created_at?: string
          email: string
          event_id: string
          full_name: string
          id?: string
          phone?: string | null
        }
        Update: {
          company?: string
          created_at?: string
          email?: string
          event_id?: string
          full_name?: string
          id?: string
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_signups_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          agenda: string | null
          agenda_fi: string | null
          agenda_sv: string | null
          created_at: string
          created_by: string | null
          description: string | null
          description_fi: string | null
          description_sv: string | null
          ends_at: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          image_url: string | null
          is_online: boolean
          is_published: boolean
          location: string | null
          location_fi: string | null
          location_sv: string | null
          max_attendees: number | null
          online_url: string | null
          requires_signin: boolean
          speakers: Json
          sponsors: Json
          starts_at: string
          title: string
          title_fi: string | null
          title_sv: string | null
          updated_at: string
        }
        Insert: {
          agenda?: string | null
          agenda_fi?: string | null
          agenda_sv?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_fi?: string | null
          description_sv?: string | null
          ends_at?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          image_url?: string | null
          is_online?: boolean
          is_published?: boolean
          location?: string | null
          location_fi?: string | null
          location_sv?: string | null
          max_attendees?: number | null
          online_url?: string | null
          requires_signin?: boolean
          speakers?: Json
          sponsors?: Json
          starts_at: string
          title: string
          title_fi?: string | null
          title_sv?: string | null
          updated_at?: string
        }
        Update: {
          agenda?: string | null
          agenda_fi?: string | null
          agenda_sv?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          description_fi?: string | null
          description_sv?: string | null
          ends_at?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          image_url?: string | null
          is_online?: boolean
          is_published?: boolean
          location?: string | null
          location_fi?: string | null
          location_sv?: string | null
          max_attendees?: number | null
          online_url?: string | null
          requires_signin?: boolean
          speakers?: Json
          sponsors?: Json
          starts_at?: string
          title?: string
          title_fi?: string | null
          title_sv?: string | null
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
          file_name: string | null
          file_url: string | null
          file_urls: Json
          id: string
          image_url: string | null
          image_urls: Json
          key_figures: Json | null
          link_url: string | null
          link_urls: Json
          pricing_info: string | null
          rejection_reason: string | null
          solution: string | null
          status: Database["public"]["Enums"]["approval_status"]
          test_reasons: string[] | null
          test_reasons_other: string | null
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
          file_name?: string | null
          file_url?: string | null
          file_urls?: Json
          id?: string
          image_url?: string | null
          image_urls?: Json
          key_figures?: Json | null
          link_url?: string | null
          link_urls?: Json
          pricing_info?: string | null
          rejection_reason?: string | null
          solution?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          test_reasons?: string[] | null
          test_reasons_other?: string | null
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
          file_name?: string | null
          file_url?: string | null
          file_urls?: Json
          id?: string
          image_url?: string | null
          image_urls?: Json
          key_figures?: Json | null
          link_url?: string | null
          link_urls?: Json
          pricing_info?: string | null
          rejection_reason?: string | null
          solution?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          test_reasons?: string[] | null
          test_reasons_other?: string | null
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
      starter_applications: {
        Row: {
          company_name: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
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
      viber_applications: {
        Row: {
          billing_address: string
          billing_business_id: string | null
          billing_city: string
          billing_country: string
          billing_email: string
          billing_name: string
          billing_postal_code: string
          billing_reference: string | null
          billing_vat_id: string | null
          company_name: string | null
          created_at: string
          einvoice_address: string | null
          einvoice_operator: string | null
          email: string
          full_name: string
          id: string
          is_company: boolean
          notes: string | null
          phone: string | null
          rejection_reason: string | null
          representative_name: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_address: string
          billing_business_id?: string | null
          billing_city: string
          billing_country?: string
          billing_email: string
          billing_name: string
          billing_postal_code: string
          billing_reference?: string | null
          billing_vat_id?: string | null
          company_name?: string | null
          created_at?: string
          einvoice_address?: string | null
          einvoice_operator?: string | null
          email: string
          full_name: string
          id?: string
          is_company?: boolean
          notes?: string | null
          phone?: string | null
          rejection_reason?: string | null
          representative_name?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_address?: string
          billing_business_id?: string | null
          billing_city?: string
          billing_country?: string
          billing_email?: string
          billing_name?: string
          billing_postal_code?: string
          billing_reference?: string | null
          billing_vat_id?: string | null
          company_name?: string | null
          created_at?: string
          einvoice_address?: string | null
          einvoice_operator?: string | null
          email?: string
          full_name?: string
          id?: string
          is_company?: boolean
          notes?: string | null
          phone?: string | null
          rejection_reason?: string | null
          representative_name?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vibetor_applications: {
        Row: {
          billing_address: string | null
          billing_business_id: string | null
          billing_city: string | null
          billing_country: string | null
          billing_email: string | null
          billing_name: string | null
          billing_postal_code: string | null
          billing_reference: string | null
          billing_vat_id: string | null
          company_name: string | null
          created_at: string
          einvoice_address: string | null
          einvoice_operator: string | null
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
          billing_address?: string | null
          billing_business_id?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_email?: string | null
          billing_name?: string | null
          billing_postal_code?: string | null
          billing_reference?: string | null
          billing_vat_id?: string | null
          company_name?: string | null
          created_at?: string
          einvoice_address?: string | null
          einvoice_operator?: string | null
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
          billing_address?: string | null
          billing_business_id?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_email?: string | null
          billing_name?: string | null
          billing_postal_code?: string | null
          billing_reference?: string | null
          billing_vat_id?: string | null
          company_name?: string | null
          created_at?: string
          einvoice_address?: string | null
          einvoice_operator?: string | null
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
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
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
      get_event_online_url: { Args: { _event_id: string }; Returns: string }
      get_event_rsvp_count: { Args: { _event_id: string }; Returns: number }
      get_membership_tier: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["membership_tier"]
      }
      get_public_profile: {
        Args: { _user_id: string }
        Returns: {
          avatar_url: string
          bio: string
          company: string
          company_url: string
          contact_email: string
          contact_phone: string
          created_at: string
          display_name: string
          id: string
          linkedin_url: string
          membership_tier: Database["public"]["Enums"]["membership_tier"]
          profile_visibility: Json
          updated_at: string
          user_id: string
          viber_access_override: boolean
          vibetor_type: Database["public"]["Enums"]["vibetor_type"]
          website_links: Json
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_viber_access: { Args: { _user_id: string }; Returns: boolean }
      list_public_profiles: {
        Args: never
        Returns: {
          avatar_url: string
          bio: string
          company: string
          company_url: string
          contact_email: string
          contact_phone: string
          created_at: string
          display_name: string
          id: string
          linkedin_url: string
          membership_tier: Database["public"]["Enums"]["membership_tier"]
          profile_visibility: Json
          updated_at: string
          user_id: string
          viber_access_override: boolean
          vibetor_type: Database["public"]["Enums"]["vibetor_type"]
          website_links: Json
        }[]
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      verify_certificate: {
        Args: { _id: string }
        Returns: {
          completion_date: string
          course_content: string
          course_id: string
          course_title: string
          created_at: string
          id: string
          issued_by_name: string
          method: Database["public"]["Enums"]["course_method"]
          method_details: string
          participant_name: string
          participant_user_id: string
          pdf_url: string
        }[]
      }
    }
    Enums: {
      app_role: "superadmin" | "admin" | "moderator" | "user"
      approval_status: "pending" | "approved" | "rejected"
      badge_claim_status:
        | "pending_peer"
        | "pending_review"
        | "approved"
        | "rejected"
      course_method:
        | "face_to_face"
        | "seminar"
        | "webinar"
        | "customized"
        | "other"
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
        | "tool_to_test"
      vibetor_type: "investor" | "innovator" | "partner" | "founder"
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
      course_method: [
        "face_to_face",
        "seminar",
        "webinar",
        "customized",
        "other",
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
        "tool_to_test",
      ],
      vibetor_type: ["investor", "innovator", "partner", "founder"],
    },
  },
} as const
