import { z } from "zod";

import type { Enums } from "@/lib/supabase/database.types";
import { Constants } from "@/lib/supabase/database.types";

export type Role = Enums<"user_role">;
export type ServiceUnit = Enums<"service_unit">;
export type OrderStatus = Enums<"order_status">;
export type OrderSource = Enums<"order_source">;
export type PaymentMethod = Enums<"payment_method">;

export const roleSchema = z.enum(Constants.public.Enums.user_role);

export const profileSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().trim().min(1),
  role: roleSchema,
  is_active: z.literal(true),
  can_manage_cash_session: z.boolean(),
});

export type Profile = z.infer<typeof profileSchema>;

export type CurrentAuthenticationResult =
  | { status: "authenticated"; profile: Profile }
  | { status: "unauthenticated" }
  | { status: "access_not_enabled" };

export type LoginActionState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: {
    email?: string;
    password?: string;
  };
};

export type ActionResult<TFieldErrors extends Record<string, string> = Record<string, string>> =
  | { success: true; message: string; customerId?: string }
  | { success: false; message: string; fieldErrors?: TFieldErrors };
