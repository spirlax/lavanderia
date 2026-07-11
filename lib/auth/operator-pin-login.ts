"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type OperatorPinState = { status: "idle" | "error"; message?: string };

export async function operatorPinLoginAction(profileId: string, _previous: OperatorPinState, formData: FormData): Promise<OperatorPinState> {
  const pin = String(formData.get("pin") ?? "");
  if (!/^\d{6}$/.test(pin)) return { status: "error", message: "Ingresa los seis dígitos." };
  const supabase = await createClient();
  const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/operator-pin-login`, { method: "POST", headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "", "content-type": "application/json" }, body: JSON.stringify({ profile_id: profileId, pin }), cache: "no-store" });
  const result = await response.json() as { status?: string; session?: { access_token: string; refresh_token: string } };
  if (result.status === "not_configured") return { status: "error", message: "La administradora aún no configuró tu PIN." };
  if (result.status === "locked") return { status: "error", message: "Tu PIN está bloqueado temporalmente." };
  if (result.status === "inactive") return { status: "error", message: "La operadora está inactiva." };
  if (result.status !== "success" || !result.session) return { status: "error", message: result.status === "session_error" ? "No se pudo crear la sesión." : "PIN incorrecto." };
  const session = await supabase.auth.setSession(result.session);
  if (session.error) return { status: "error", message: "No se pudo crear la sesión." };
  redirect("/");
}
