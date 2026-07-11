import type { Role } from "@/lib/auth/types";

export type ServiceUnit = "kg" | "unit" | "pair" | "set" | "other";
export type OrderStatus =
  | "received"
  | "in_process"
  | "ready"
  | "delivered"
  | "cancelled";
export type OrderSource = "platform" | "historical_detailed";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type ProfileRow = {
  id: string;
  full_name: string;
  role: Role;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type CustomerRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
};

type ServiceRow = {
  id: string;
  name: string;
  unit: ServiceUnit;
  /** numeric(12,2) — PostgREST returns numeric as string */
  current_price: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type OrderRow = {
  id: string;
  customer_id: string;
  order_number: string;
  status: OrderStatus;
  source: OrderSource;
  scheduled_for: string | null;
  received_at: string | null;
  ready_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  /** numeric(12,2) — PostgREST returns numeric as string */
  subtotal: string;
  discount: string;
  total: string;
  amount_paid: string;
  balance_due: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  cancel_reason: string | null;
  delivery_with_balance_authorized_by: string | null;
  delivery_with_balance_reason: string | null;
};

type OrderItemRow = {
  id: string;
  order_id: string;
  service_id: string | null;
  service_name_snapshot: string;
  unit_snapshot: ServiceUnit;
  /** numeric(12,3) / numeric(12,2) — PostgREST returns numeric as string */
  quantity: string;
  unit_price: string;
  line_total: string;
  created_at: string;
};

type OrderStatusHistoryRow = {
  id: string;
  order_id: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  changed_by: string;
  actor_role_snapshot: Role;
  changed_at: string;
  reason: string | null;
  operation_id: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: {
          id: string;
          full_name: string;
          role: Role;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          role?: Role;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      customers: {
        Row: CustomerRow;
        Insert: {
          id?: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          notes?: string | null;
          is_active?: boolean;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string | null;
          email?: string | null;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
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
      services: {
        Row: ServiceRow;
        Insert: {
          id?: string;
          name: string;
          unit: ServiceUnit;
          current_price: string | number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          unit?: ServiceUnit;
          current_price?: string | number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: OrderRow;
        Insert: {
          id?: string;
          customer_id: string;
          order_number: string;
          status?: OrderStatus;
          source?: OrderSource;
          scheduled_for?: string | null;
          received_at?: string | null;
          ready_at?: string | null;
          delivered_at?: string | null;
          cancelled_at?: string | null;
          subtotal?: string | number;
          discount?: string | number;
          total?: string | number;
          amount_paid?: string | number;
          balance_due?: string | number;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          cancel_reason?: string | null;
          delivery_with_balance_authorized_by?: string | null;
          delivery_with_balance_reason?: string | null;
        };
        Update: {
          id?: string;
          customer_id?: string;
          order_number?: string;
          status?: OrderStatus;
          source?: OrderSource;
          scheduled_for?: string | null;
          received_at?: string | null;
          ready_at?: string | null;
          delivered_at?: string | null;
          cancelled_at?: string | null;
          subtotal?: string | number;
          discount?: string | number;
          total?: string | number;
          amount_paid?: string | number;
          balance_due?: string | number;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          cancel_reason?: string | null;
          delivery_with_balance_authorized_by?: string | null;
          delivery_with_balance_reason?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
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
      order_items: {
        Row: OrderItemRow;
        Insert: {
          id?: string;
          order_id: string;
          service_id?: string | null;
          service_name_snapshot: string;
          unit_snapshot: ServiceUnit;
          quantity: string | number;
          unit_price: string | number;
          line_total: string | number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          service_id?: string | null;
          service_name_snapshot?: string;
          unit_snapshot?: ServiceUnit;
          quantity?: string | number;
          unit_price?: string | number;
          line_total?: string | number;
          created_at?: string;
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
        Row: OrderStatusHistoryRow;
        Insert: {
          id?: string;
          order_id: string;
          from_status?: OrderStatus | null;
          to_status: OrderStatus;
          changed_by: string;
          actor_role_snapshot: Role;
          changed_at?: string;
          reason?: string | null;
          operation_id?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          from_status?: OrderStatus | null;
          to_status?: OrderStatus;
          changed_by?: string;
          actor_role_snapshot?: Role;
          changed_at?: string;
          reason?: string | null;
          operation_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_status_history_changed_by_fkey";
            columns: ["changed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: {
      create_platform_order: {
        Args: {
          p_customer_id: string;
          p_scheduled_for: string;
          p_items: Json;
          p_operation_id: string;
        };
        Returns: {
          order_id: string;
          order_number: string;
          status: OrderStatus;
          subtotal: string;
          discount: string;
          total: string;
          amount_paid: string;
          balance_due: string;
          reused_existing: boolean;
        }[];
      };
      transition_order_status: {
        Args: {
          p_order_id: string;
          p_to_status: OrderStatus;
          p_operation_id: string;
          p_reason?: string | null;
        };
        Returns: {
          order_id: string;
          order_number: string;
          status: OrderStatus;
          balance_due: string;
          reused_existing: boolean;
        }[];
      };
    };
    Enums: {
      user_role: Role;
      service_unit: ServiceUnit;
      order_status: OrderStatus;
      order_source: OrderSource;
    };
    CompositeTypes: Record<never, never>;
  };
};
