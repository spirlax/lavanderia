"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const credentialsSchema = z.object({ email: z.string().trim().email(), password: z.string().min(1).max(256) });

export type AdminLoginState = { message?: string };

export async function adminLoginAction(_previous: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
  const parsed = credentialsSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { message: "Ingresa un correo y contraseña válidos." };
  const supabase = await createClient();
  const result = await supabase.auth.signInWithPassword(parsed.data);
  if (result.error || !result.data.user) return { message: "Correo o contraseña incorrectos." };
  const profile = await supabase.from("profiles").select("role,is_active").eq("id", result.data.user.id).maybeSingle();
  if (profile.error || !profile.data?.is_active || profile.data.role !== "admin") {
    await supabase.auth.signOut();
    return { message: "Esta cuenta no tiene acceso administrativo." };
  }
  redirect("/admin");
}
