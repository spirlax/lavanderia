import { z } from "zod";

export const roleSchema = z.enum(["admin", "operator"]);

export const profileSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().trim().min(1),
  role: roleSchema,
  is_active: z.literal(true),
});

export type Role = z.infer<typeof roleSchema>;
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
