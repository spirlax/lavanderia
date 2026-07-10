"use server";

import { redirect } from "next/navigation";

import { getHomePathForRole } from "@/lib/auth/authorization";
import { getProfileForUser } from "@/lib/auth/get-current-profile";
import type { LoginActionState } from "@/lib/auth/types";
import { loginSchema } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";

export async function loginAction(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const parsedCredentials = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsedCredentials.success) {
    const fieldErrors = parsedCredentials.error.flatten().fieldErrors;

    return {
      status: "error",
      message: "Revisa los datos ingresados.",
      fieldErrors: {
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      },
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(
    parsedCredentials.data,
  );

  if (error || !data.user) {
    return {
      status: "error",
      message: "Correo o contraseña incorrectos.",
    };
  }

  const profileResult = await getProfileForUser(supabase, data.user.id);

  if (profileResult.status !== "authenticated") {
    await supabase.auth.signOut();

    return {
      status: "error",
      message: "Acceso no habilitado. Contacta al administrador.",
    };
  }

  redirect(getHomePathForRole(profileResult.profile.role));
}
