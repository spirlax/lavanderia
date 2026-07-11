import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/app/admin/login/login-form";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { getHomePathForRole } from "@/lib/auth/authorization";

export default async function AdminLoginPage() {
  const authentication = await getCurrentProfile();
  if (authentication.status === "authenticated") redirect(getHomePathForRole(authentication.profile.role));
  return <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-5"><section className="w-full max-w-md space-y-7 rounded-2xl border bg-white p-7 shadow-sm"><div><Link className="text-sm text-zinc-600 underline" href="/login">← Cambiar acceso</Link><h1 className="mt-5 text-3xl font-semibold">Acceso administrador</h1></div><AdminLoginForm /></section></main>;
}
