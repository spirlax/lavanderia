"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function setOperatorPinAction(formData: FormData): Promise<void> {
  const profileId = String(formData.get("profile_id") ?? "");
  const pin = String(formData.get("pin") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(profileId) || !/^\d{6}$/.test(pin)) return;
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_operator_pin", { p_profile_id: profileId, p_pin: pin });
  if (error) return;
  revalidatePath("/admin/pin");
}
