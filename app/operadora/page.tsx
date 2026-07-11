import Link from "next/link";
import { redirect } from "next/navigation";

import { OperatorAccess } from "@/app/operadora/operator-access";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";

export default async function OperatorPage() {
  const authentication = await getCurrentProfile();
  if (authentication.status === "authenticated") redirect(authentication.profile.role === "admin" ? "/admin" : "/");
  const supabase = await createClient();
  const { data } = await supabase.rpc("list_active_operator_directory");
  return <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-5"><section className="w-full max-w-md space-y-7"><Link className="text-sm text-zinc-600 underline" href="/login">← Cambiar acceso</Link><div><p className="text-sm font-medium uppercase tracking-[0.25em] text-zinc-500">Lavandería</p><h1 className="mt-3 text-3xl font-semibold">Acceso de operadora</h1></div><OperatorAccess operators={data ?? []} /></section></main>;
}
