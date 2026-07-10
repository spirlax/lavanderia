import { LogoutButton } from "@/components/auth/logout-button";
import { requireCurrentProfile } from "@/lib/auth/get-current-profile";

export default async function OperationalPage() {
  const profile = await requireCurrentProfile();

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <section className="w-full max-w-xl space-y-5 rounded-xl border border-zinc-200 p-8 shadow-sm">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Panel operativo</h1>
          <p className="text-zinc-600">Acceso autorizado para operación</p>
        </div>
        <dl className="grid gap-2 text-sm">
          <div>
            <dt className="font-medium text-zinc-500">Usuario</dt>
            <dd>{profile.full_name}</dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-500">Rol</dt>
            <dd>{profile.role}</dd>
          </div>
        </dl>
        <LogoutButton />
      </section>
    </main>
  );
}
