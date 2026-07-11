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
      profiles: {
        Row: {
          created_at: string;
          full_name: string;
          id: string;
          is_active: boolean;
          role: Database["public"]["Enums"]["user_role"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          full_name: string;
          id: string;
          is_active?: boolean;
          role: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Update: {
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
      create_platform_order: {
        Args: {
          p_customer_id: string;
          p_items: Json;
          p_operation_id: string;
          p_scheduled_for: string;
        };
        Returns: {
          amount_paid: number;
          balance_due: number;
          discount: number;
          order_id: string;
          order_number: string;
          reused_existing: boolean;
          status: Database["public"]["Enums"]["order_status"];
          subtotal: number;
          total: number;
        }[];
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
    };
    Enums: {
      order_source: "platform" | "historical_detailed";
      order_status:
        | "received"
        | "in_process"
        | "ready"
        | "delivered"
        | "cancelled";
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
      order_source: ["platform", "historical_detailed"],
      order_status: [
        "received",
        "in_process",
        "ready",
        "delivered",
        "cancelled",
      ],
      service_unit: ["kg", "unit", "pair", "set", "other"],
      user_role: ["admin", "operator"],
    },
  },
} as const;
