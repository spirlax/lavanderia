import Link from "next/link";

import { getHomePathForRole } from "@/lib/auth/authorization";
import { requireCurrentProfile } from "@/lib/auth/get-current-profile";

export default async function AccessDeniedPage() {
  const profile = await requireCurrentProfile();
  const allowedArea = getHomePathForRole(profile.role);

  return (
    <main className="flex min-h-screen items-center justify-center px-6 text-center">
      <section className="w-full max-w-md space-y-4 rounded-xl border border-zinc-200 p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Acceso denegado</h1>
        <p className="text-zinc-600">
          Tu perfil no tiene permisos para acceder a esta sección.
        </p>
        <Link
          href={allowedArea}
          className="inline-flex rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Volver al área permitida
        </Link>
      </section>
    </main>
  );
}
