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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      app_updates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          id: string
          is_published: boolean
          release_date: string
          title: string
          version: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          is_published?: boolean
          release_date?: string
          title: string
          version: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          is_published?: boolean
          release_date?: string
          title?: string
          version?: string
        }
        Relationships: []
      }
      artists: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_uid: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_uid: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_uid?: string
        }
        Relationships: [
          {
            foreignKeyName: "artists_owner_uid_fkey"
            columns: ["owner_uid"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      locomotion_expenses: {
        Row: {
          cost: number
          created_at: string
          distance_km: number | null
          id: string
          price_per_liter: number | null
          show_id: string | null
          type: Database["public"]["Enums"]["expense_type"]
          uid: string
          vehicle_consumption: number | null
        }
        Insert: {
          cost?: number
          created_at?: string
          distance_km?: number | null
          id?: string
          price_per_liter?: number | null
          show_id?: string | null
          type: Database["public"]["Enums"]["expense_type"]
          uid: string
          vehicle_consumption?: number | null
        }
        Update: {
          cost?: number
          created_at?: string
          distance_km?: number | null
          id?: string
          price_per_liter?: number | null
          show_id?: string | null
          type?: Database["public"]["Enums"]["expense_type"]
          uid?: string
          vehicle_consumption?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "locomotion_expenses_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "locomotion_expenses_uid_fkey"
            columns: ["uid"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      musician_instruments: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_uid: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_uid: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_uid?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_musician_instruments_owner"
            columns: ["owner_uid"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      musician_venues: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          owner_uid: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          owner_uid: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          owner_uid?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_musician_venues_owner"
            columns: ["owner_uid"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      musicians: {
        Row: {
          created_at: string
          default_fee: number
          id: string
          instrument: string
          name: string
          owner_uid: string
        }
        Insert: {
          created_at?: string
          default_fee?: number
          id?: string
          instrument: string
          name: string
          owner_uid: string
        }
        Update: {
          created_at?: string
          default_fee?: number
          id?: string
          instrument?: string
          name?: string
          owner_uid?: string
        }
        Relationships: [
          {
            foreignKeyName: "musicians_owner_uid_fkey"
            columns: ["owner_uid"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_hidden: {
        Row: {
          hidden_at: string
          id: string
          notification_id: string
          user_id: string
        }
        Insert: {
          hidden_at?: string
          id?: string
          notification_id: string
          user_id: string
        }
        Update: {
          hidden_at?: string
          id?: string
          notification_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_hidden_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_reads: {
        Row: {
          id: string
          notification_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          notification_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          notification_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          link: string | null
          message: string
          target_role: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          link?: string | null
          message: string
          target_role?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          link?: string | null
          message?: string
          target_role?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      otp_codes: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          used: boolean
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          used?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          used?: boolean
        }
        Relationships: []
      }
      payment_history: {
        Row: {
          amount: number
          asaas_payment_id: string | null
          created_at: string
          due_date: string
          id: string
          payment_date: string
          payment_method: string | null
          status: string
          subscription_id: string
          user_id: string
        }
        Insert: {
          amount: number
          asaas_payment_id?: string | null
          created_at?: string
          due_date: string
          id?: string
          payment_date: string
          payment_method?: string | null
          status: string
          subscription_id: string
          user_id: string
        }
        Update: {
          amount?: number
          asaas_payment_id?: string | null
          created_at?: string
          due_date?: string
          id?: string
          payment_date?: string
          payment_method?: string | null
          status?: string
          subscription_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_history_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          birth_date: string | null
          cpf: string | null
          created_at: string
          email: string
          fcm_token: string | null
          id: string
          is_verified: boolean | null
          last_seen_at: string | null
          name: string
          phone: string | null
          photo_url: string | null
          plan_purchased_at: string | null
          plan_type: string | null
          status_plano: string | null
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          email: string
          fcm_token?: string | null
          id: string
          is_verified?: boolean | null
          last_seen_at?: string | null
          name: string
          phone?: string | null
          photo_url?: string | null
          plan_purchased_at?: string | null
          plan_type?: string | null
          status_plano?: string | null
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          cpf?: string | null
          created_at?: string
          email?: string
          fcm_token?: string | null
          id?: string
          is_verified?: boolean | null
          last_seen_at?: string | null
          name?: string
          phone?: string | null
          photo_url?: string | null
          plan_purchased_at?: string | null
          plan_type?: string | null
          status_plano?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      show_notification_logs: {
        Row: {
          id: string
          notification_type: string
          sent_at: string
          show_id: string
          user_id: string
        }
        Insert: {
          id?: string
          notification_type: string
          sent_at?: string
          show_id: string
          user_id: string
        }
        Update: {
          id?: string
          notification_type?: string
          sent_at?: string
          show_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "show_notification_logs_show_id_fkey"
            columns: ["show_id"]
            isOneToOne: false
            referencedRelation: "shows"
            referencedColumns: ["id"]
          },
        ]
      }
      shows: {
        Row: {
          created_at: string
          date_local: string
          duration_hours: number | null
          expenses_other: Json | null
          expenses_team: Json | null
          fee: number
          id: string
          is_private_event: boolean | null
          team_musician_ids: string[] | null
          time_local: string
          uid: string
          updated_at: string
          venue_name: string
        }
        Insert: {
          created_at?: string
          date_local: string
          duration_hours?: number | null
          expenses_other?: Json | null
          expenses_team?: Json | null
          fee?: number
          id?: string
          is_private_event?: boolean | null
          team_musician_ids?: string[] | null
          time_local: string
          uid: string
          updated_at?: string
          venue_name: string
        }
        Update: {
          created_at?: string
          date_local?: string
          duration_hours?: number | null
          expenses_other?: Json | null
          expenses_team?: Json | null
          fee?: number
          id?: string
          is_private_event?: boolean | null
          team_musician_ids?: string[] | null
          time_local?: string
          uid?: string
          updated_at?: string
          venue_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "shows_uid_fkey"
            columns: ["uid"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number
          asaas_customer_id: string | null
          asaas_subscription_id: string | null
          created_at: string
          id: string
          next_due_date: string | null
          payment_method: string | null
          plan_type: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          created_at?: string
          id?: string
          next_due_date?: string | null
          payment_method?: string | null
          plan_type: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          asaas_customer_id?: string | null
          asaas_subscription_id?: string | null
          created_at?: string
          id?: string
          next_due_date?: string | null
          payment_method?: string | null
          plan_type?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_responses: {
        Row: {
          created_at: string
          id: string
          is_admin: boolean
          message: string
          ticket_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_admin?: boolean
          message: string
          ticket_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_admin?: boolean
          message?: string
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_responses_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          attachment_url: string | null
          created_at: string
          id: string
          message: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string
          id?: string
          message: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attachment_url?: string | null
          created_at?: string
          id?: string
          message?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          created_at: string
          id: string
          message: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_feedback_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      venues: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
          owner_uid: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
          owner_uid: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          owner_uid?: string
        }
        Relationships: [
          {
            foreignKeyName: "venues_owner_uid_fkey"
            columns: ["owner_uid"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_and_notify_payments: { Args: never; Returns: undefined }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_support: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "artist" | "musician" | "support"
      expense_type: "uber" | "km" | "van" | "onibus" | "aviao"
      user_role: "artist" | "musician"
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
      app_role: ["artist", "musician", "support"],
      expense_type: ["uber", "km", "van", "onibus", "aviao"],
      user_role: ["artist", "musician"],
    },
  },
} as const
