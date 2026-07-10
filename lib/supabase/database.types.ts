import type { Role } from "@/lib/auth/types";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          created_at: string;
          full_name: string;
          id: string;
          is_active: boolean;
          role: Role;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          full_name: string;
          id: string;
          is_active?: boolean;
          role: Role;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          full_name?: string;
          id?: string;
          is_active?: boolean;
          role?: Role;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      user_role: Role;
    };
    CompositeTypes: Record<never, never>;
  };
};
