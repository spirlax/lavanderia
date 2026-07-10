import { redirect } from "next/navigation";

import { LoginForm } from "@/app/login/login-form";
import { getHomePathForRole } from "@/lib/auth/authorization";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";

type LoginPageProps = {
  searchParams: Promise<{ notice?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const authentication = await getCurrentProfile();

  if (authentication.status === "authenticated") {
    redirect(getHomePathForRole(authentication.profile.role));
  }

  if (authentication.status === "access_not_enabled") {
    redirect("/auth/signout-invalid");
  }

  const { notice } = await searchParams;
  const noticeMessage =
    notice === "access-not-enabled"
      ? "Acceso no habilitado. Contacta al administrador."
      : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <section className="w-full max-w-md space-y-6 rounded-xl border border-zinc-200 p-8 shadow-sm">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Lavandería</h1>
          <p className="text-zinc-600">Ingresa con tu correo y contraseña</p>
        </div>
        {noticeMessage ? (
          <p role="alert" className="text-sm text-red-700">
            {noticeMessage}
          </p>
        ) : null}
        <LoginForm />
      </section>
    </main>
  );
}
