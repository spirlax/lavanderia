import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";
import { redirect } from "next/navigation";

import { profileSchema, type CurrentAuthenticationResult } from "@/lib/auth/types";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export async function getProfileForUser(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<CurrentAuthenticationResult> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_active, can_manage_cash_session")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return { status: "access_not_enabled" };
  }

  const parsedProfile = profileSchema.safeParse(data);

  if (!parsedProfile.success) {
    return { status: "access_not_enabled" };
  }

  return { status: "authenticated", profile: parsedProfile.data };
}

export const getCurrentProfile = cache(
  async (): Promise<CurrentAuthenticationResult> => {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return { status: "unauthenticated" };
    }

    return getProfileForUser(supabase, user.id);
  },
);

export async function requireCurrentProfile() {
  const result = await getCurrentProfile();

  if (result.status === "unauthenticated") {
    redirect("/login");
  }

  if (result.status === "access_not_enabled") {
    redirect("/auth/signout-invalid");
  }

  return result.profile;
}
