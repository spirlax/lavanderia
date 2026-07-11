import Link from "next/link";
import { redirect } from "next/navigation";

import { getHomePathForRole } from "@/lib/auth/authorization";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";

export default async function LoginPage() {
  const authentication = await getCurrentProfile();
  if (authentication.status === "authenticated") redirect(getHomePathForRole(authentication.profile.role));
  if (authentication.status === "access_not_enabled") redirect("/auth/signout-invalid");
  return <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-5"><section className="w-full max-w-xl space-y-8"><div className="text-center"><p className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-500">Lavandería</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-950">¿Cómo deseas ingresar?</h1></div><div className="grid gap-4 sm:grid-cols-2"><Link href="/operadora" className="rounded-2xl border-2 border-zinc-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-zinc-900 hover:shadow-md"><span className="text-4xl" aria-hidden="true">◉</span><h2 className="mt-5 text-2xl font-semibold">Soy operadora</h2><p className="mt-2 text-zinc-600">Ingresa con tu identidad y PIN.</p></Link><Link href="/admin/login" className="rounded-2xl border-2 border-zinc-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-zinc-900 hover:shadow-md"><span className="text-4xl" aria-hidden="true">▣</span><h2 className="mt-5 text-2xl font-semibold">Soy administrador</h2><p className="mt-2 text-zinc-600">Accede con correo y contraseña.</p></Link></div></section></main>;
}
