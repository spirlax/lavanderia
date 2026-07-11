export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      cash_movements: {
        Row: {
          amount: number;
          cash_session_id: string;
          created_by: string;
          id: string;
          movement_type: Database["public"]["Enums"]["cash_movement_type"];
          occurred_at: string;
          operation_id: string;
          payment_id: string;
          reason: string | null;
        };
        Insert: {
          amount: number;
          cash_session_id: string;
          created_by: string;
          id?: string;
          movement_type: Database["public"]["Enums"]["cash_movement_type"];
          occurred_at?: string;
          operation_id: string;
          payment_id: string;
          reason?: string | null;
        };
        Update: {
          amount?: number;
          cash_session_id?: string;
          created_by?: string;
          id?: string;
          movement_type?: Database["public"]["Enums"]["cash_movement_type"];
          occurred_at?: string;
          operation_id?: string;
          payment_id?: string;
          reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "cash_movements_cash_session_id_fkey";
            columns: ["cash_session_id"];
            isOneToOne: false;
            referencedRelation: "cash_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cash_movements_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cash_movements_payment_id_fkey";
            columns: ["payment_id"];
            isOneToOne: false;
            referencedRelation: "payments";
            referencedColumns: ["id"];
          },
        ];
      };
      cash_sessions: {
        Row: {
          business_date: string;
          close_operation_id: string | null;
          closed_at: string | null;
          closed_by: string | null;
          closing_notes: string | null;
          counted_cash: number | null;
          difference: number | null;
          expected_cash: number;
          id: string;
          open_operation_id: string;
          opened_at: string;
          opened_by: string;
          opening_cash: number;
          responsible_operator_id: string;
          status: Database["public"]["Enums"]["cash_session_status"];
        };
        Insert: {
          business_date: string;
          close_operation_id?: string | null;
          closed_at?: string | null;
          closed_by?: string | null;
          closing_notes?: string | null;
          counted_cash?: number | null;
          difference?: number | null;
          expected_cash: number;
          id?: string;
          open_operation_id: string;
          opened_at?: string;
          opened_by: string;
          opening_cash: number;
          responsible_operator_id: string;
          status?: Database["public"]["Enums"]["cash_session_status"];
        };
        Update: {
          business_date?: string;
          close_operation_id?: string | null;
          closed_at?: string | null;
          closed_by?: string | null;
          closing_notes?: string | null;
          counted_cash?: number | null;
          difference?: number | null;
          expected_cash?: number;
          id?: string;
          open_operation_id?: string;
          opened_at?: string;
          opened_by?: string;
          opening_cash?: number;
          responsible_operator_id?: string;
          status?: Database["public"]["Enums"]["cash_session_status"];
        };
        Relationships: [
          {
            foreignKeyName: "cash_sessions_closed_by_fkey";
            columns: ["closed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cash_sessions_opened_by_fkey";
            columns: ["opened_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "cash_sessions_responsible_operator_id_fkey";
            columns: ["responsible_operator_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      customers: {
        Row: {
          created_at: string;
          created_by: string;
          email: string | null;
          id: string;
          is_active: boolean;
          name: string;
          notes: string | null;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          email?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          notes?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          email?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          notes?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customers_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          created_at: string;
          id: string;
          line_total: number;
          order_id: string;
          quantity: number;
          service_id: string | null;
          service_name_snapshot: string;
          unit_price: number;
          unit_snapshot: Database["public"]["Enums"]["service_unit"];
        };
        Insert: {
          created_at?: string;
          id?: string;
          line_total: number;
          order_id: string;
          quantity: number;
          service_id?: string | null;
          service_name_snapshot: string;
          unit_price: number;
          unit_snapshot: Database["public"]["Enums"]["service_unit"];
        };
        Update: {
          created_at?: string;
          id?: string;
          line_total?: number;
          order_id?: string;
          quantity?: number;
          service_id?: string | null;
          service_name_snapshot?: string;
          unit_price?: number;
          unit_snapshot?: Database["public"]["Enums"]["service_unit"];
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      order_status_history: {
        Row: {
          actor_role_snapshot: Database["public"]["Enums"]["user_role"];
          changed_at: string;
          changed_by: string;
          from_status: Database["public"]["Enums"]["order_status"] | null;
          id: string;
          operation_id: string;
          order_id: string;
          reason: string | null;
          to_status: Database["public"]["Enums"]["order_status"];
        };
        Insert: {
          actor_role_snapshot: Database["public"]["Enums"]["user_role"];
          changed_at?: string;
          changed_by: string;
          from_status?: Database["public"]["Enums"]["order_status"] | null;
          id?: string;
          operation_id?: string;
          order_id: string;
          reason?: string | null;
          to_status: Database["public"]["Enums"]["order_status"];
        };
        Update: {
          actor_role_snapshot?: Database["public"]["Enums"]["user_role"];
          changed_at?: string;
          changed_by?: string;
          from_status?: Database["public"]["Enums"]["order_status"] | null;
          id?: string;
          operation_id?: string;
          order_id?: string;
          reason?: string | null;
          to_status?: Database["public"]["Enums"]["order_status"];
        };
        Relationships: [
          {
            foreignKeyName: "order_status_history_changed_by_fkey";
            columns: ["changed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_status_history_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          amount_paid: number;
          balance_due: number;
          cancel_reason: string | null;
          cancelled_at: string | null;
          created_at: string;
          created_by: string;
          customer_id: string;
          delivered_at: string | null;
          delivery_with_balance_authorized_by: string | null;
          delivery_with_balance_reason: string | null;
          discount: number;
          id: string;
          order_number: string;
          ready_at: string | null;
          received_at: string | null;
          scheduled_for: string | null;
          source: Database["public"]["Enums"]["order_source"];
          status: Database["public"]["Enums"]["order_status"];
          subtotal: number;
          total: number;
          updated_at: string;
        };
        Insert: {
          amount_paid?: number;
          balance_due?: number;
          cancel_reason?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          created_by: string;
          customer_id: string;
          delivered_at?: string | null;
          delivery_with_balance_authorized_by?: string | null;
          delivery_with_balance_reason?: string | null;
          discount?: number;
          id?: string;
          order_number: string;
          ready_at?: string | null;
          received_at?: string | null;
          scheduled_for?: string | null;
          source?: Database["public"]["Enums"]["order_source"];
          status?: Database["public"]["Enums"]["order_status"];
          subtotal?: number;
          total?: number;
          updated_at?: string;
        };
        Update: {
          amount_paid?: number;
          balance_due?: number;
          cancel_reason?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          created_by?: string;
          customer_id?: string;
          delivered_at?: string | null;
          delivery_with_balance_authorized_by?: string | null;
          delivery_with_balance_reason?: string | null;
          discount?: number;
          id?: string;
          order_number?: string;
          ready_at?: string | null;
          received_at?: string | null;
          scheduled_for?: string | null;
          source?: Database["public"]["Enums"]["order_source"];
          status?: Database["public"]["Enums"]["order_status"];
          subtotal?: number;
          total?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_delivery_with_balance_authorized_by_fkey";
            columns: ["delivery_with_balance_authorized_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          amount: number;
          cash_received: number | null;
          cash_session_id: string;
          change_given: number | null;
          created_by: string;
          id: string;
          method: Database["public"]["Enums"]["payment_method"];
          operation_id: string;
          order_id: string;
          paid_at: string;
          reference: string | null;
          status: Database["public"]["Enums"]["payment_status"];
          void_cash_session_id: string | null;
          void_operation_id: string | null;
          void_reason: string | null;
          voided_at: string | null;
          voided_by: string | null;
        };
        Insert: {
          amount: number;
          cash_received?: number | null;
          cash_session_id: string;
          change_given?: number | null;
          created_by: string;
          id?: string;
          method: Database["public"]["Enums"]["payment_method"];
          operation_id: string;
          order_id: string;
          paid_at?: string;
          reference?: string | null;
          status?: Database["public"]["Enums"]["payment_status"];
          void_cash_session_id?: string | null;
          void_operation_id?: string | null;
          void_reason?: string | null;
          voided_at?: string | null;
          voided_by?: string | null;
        };
        Update: {
          amount?: number;
          cash_received?: number | null;
          cash_session_id?: string;
          change_given?: number | null;
          created_by?: string;
          id?: string;
          method?: Database["public"]["Enums"]["payment_method"];
          operation_id?: string;
          order_id?: string;
          paid_at?: string;
          reference?: string | null;
          status?: Database["public"]["Enums"]["payment_status"];
          void_cash_session_id?: string | null;
          void_operation_id?: string | null;
          void_reason?: string | null;
          voided_at?: string | null;
          voided_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "payments_cash_session_id_fkey";
            columns: ["cash_session_id"];
            isOneToOne: false;
            referencedRelation: "cash_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_void_cash_session_id_fkey";
            columns: ["void_cash_session_id"];
            isOneToOne: false;
            referencedRelation: "cash_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      report_runs: {
        Row: { id: string; requested_by: string; started_at: string; completed_at: string | null; duration_ms: number | null; date_from: string; date_to: string; status: string; result: Json; created_at: string };
        Insert: { id?: string; requested_by: string; started_at?: string; completed_at?: string | null; duration_ms?: number | null; date_from: string; date_to: string; status?: string; result?: Json; created_at?: string };
        Update: { id?: string; requested_by?: string; started_at?: string; completed_at?: string | null; duration_ms?: number | null; date_from?: string; date_to?: string; status?: string; result?: Json; created_at?: string };
        Relationships: [];
      };
      import_batches: {
        Row: { id: string; file_name: string; file_hash: string; imported_by: string; imported_at: string; row_count: number; status: string; error_count: number };
        Insert: { id?: string; file_name: string; file_hash: string; imported_by: string; imported_at?: string; row_count: number; status?: string; error_count?: number };
        Update: { id?: string; file_name?: string; file_hash?: string; imported_by?: string; imported_at?: string; row_count?: number; status?: string; error_count?: number };
        Relationships: [];
      };
      historical_summaries: {
        Row: { id: string; import_batch_id: string; business_date: string; orders_received: number; orders_delivered: number; orders_uncollected: number; revenue: number; report_time_minutes: number };
        Insert: { id?: string; import_batch_id: string; business_date: string; orders_received: number; orders_delivered: number; orders_uncollected: number; revenue: number; report_time_minutes: number };
        Update: { id?: string; import_batch_id?: string; business_date?: string; orders_received?: number; orders_delivered?: number; orders_uncollected?: number; revenue?: number; report_time_minutes?: number };
        Relationships: [];
      };
      profiles: {
        Row: {
          can_manage_cash_session: boolean;
          created_at: string;
          full_name: string;
          id: string;
          is_active: boolean;
          role: Database["public"]["Enums"]["user_role"];
          updated_at: string;
        };
        Insert: {
          can_manage_cash_session?: boolean;
          created_at?: string;
          full_name: string;
          id: string;
          is_active?: boolean;
          role: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Update: {
          can_manage_cash_session?: boolean;
          created_at?: string;
          full_name?: string;
          id?: string;
          is_active?: boolean;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          created_at: string;
          current_price: number;
          id: string;
          is_active: boolean;
          name: string;
          unit: Database["public"]["Enums"]["service_unit"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          current_price: number;
          id?: string;
          is_active?: boolean;
          name: string;
          unit: Database["public"]["Enums"]["service_unit"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          current_price?: number;
          id?: string;
          is_active?: boolean;
          name?: string;
          unit?: Database["public"]["Enums"]["service_unit"];
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      close_cash_session: {
        Args: {
          p_cash_session_id: string;
          p_closing_notes: string;
          p_counted_cash: number;
          p_operation_id: string;
        };
        Returns: Database["public"]["Tables"]["cash_sessions"]["Row"];
      };
      create_platform_order: {
        Args: {
          p_cash_received: number | null;
          p_customer_id: string;
          p_items: Json;
          p_operation_id: string;
          p_payment_method: Database["public"]["Enums"]["payment_method"];
          p_payment_reference: string | null;
          p_scheduled_for: string;
        };
        Returns: {
          amount_paid: number;
          balance_due: number;
          discount: number;
          order_id: string;
          order_number: string;
          payment_id: string;
          reused_existing: boolean;
          status: Database["public"]["Enums"]["order_status"];
          subtotal: number;
          total: number;
          change_given: number | null;
        }[];
      };
      open_cash_session: {
        Args: {
          p_opening_cash: number;
          p_operation_id: string;
          p_responsible_operator_id: string;
        };
        Returns: Database["public"]["Tables"]["cash_sessions"]["Row"];
      };
      pay_order_balance: {
        Args: {
          p_cash_received: number | null;
          p_method: Database["public"]["Enums"]["payment_method"];
          p_operation_id: string;
          p_order_id: string;
          p_reference: string | null;
        };
        Returns: Database["public"]["Tables"]["payments"]["Row"];
      };
      set_cash_manager_permission: {
        Args: { p_can_manage: boolean; p_profile_id: string };
        Returns: Database["public"]["Tables"]["profiles"]["Row"];
      };
      set_customer_active: {
        Args: { p_customer_id: string; p_is_active: boolean };
        Returns: Database["public"]["Tables"]["customers"]["Row"];
      };
      set_operator_pin: {
        Args: { p_profile_id: string; p_pin: string };
        Returns: boolean;
      };
      list_active_operator_directory: {
        Args: Record<PropertyKey, never>;
        Returns: { id: string; full_name: string }[];
      };
      list_operator_pin_status: {
        Args: Record<PropertyKey, never>;
        Returns: { profile_id: string; full_name: string; is_active: boolean; pin_configured: boolean }[];
      };
      operator_pin_login: {
        Args: { p_profile_id: string; p_pin: string };
        Returns: Json;
      };
      verify_operator_pin: {
        Args: { p_pin: string };
        Returns: boolean;
      };
      transition_order_status: {
        Args: {
          p_operation_id: string;
          p_order_id: string;
          p_reason?: string;
          p_to_status: Database["public"]["Enums"]["order_status"];
        };
        Returns: {
          balance_due: number;
          order_id: string;
          order_number: string;
          reused_existing: boolean;
          status: Database["public"]["Enums"]["order_status"];
        }[];
      };
      void_payment: {
        Args: {
          p_operation_id: string;
          p_payment_id: string;
          p_reason: string;
        };
        Returns: Database["public"]["Tables"]["payments"]["Row"];
      };
    };
    Enums: {
      cash_movement_type: "payment_in" | "payment_void_out";
      cash_session_status: "open" | "closed";
      order_source: "platform" | "historical_detailed";
      order_status:
        | "received"
        | "in_process"
        | "ready"
        | "delivered"
        | "cancelled";
      payment_method: "cash" | "yape" | "plin";
      payment_status: "posted" | "voided";
      service_unit: "kg" | "unit" | "pair" | "set" | "other";
      user_role: "admin" | "operator";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      cash_movement_type: ["payment_in", "payment_void_out"],
      cash_session_status: ["open", "closed"],
      order_source: ["platform", "historical_detailed"],
      order_status: [
        "received",
        "in_process",
        "ready",
        "delivered",
        "cancelled",
      ],
      payment_method: ["cash", "yape", "plin"],
      payment_status: ["posted", "voided"],
      service_unit: ["kg", "unit", "pair", "set", "other"],
      user_role: ["admin", "operator"],
    },
  },
} as const;
