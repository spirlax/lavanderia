"use client";

import { useActionState } from "react";
import { adminLoginAction, type AdminLoginState } from "@/app/admin/login/actions";

export function AdminLoginForm() {
  const [state, action, pending] = useActionState<AdminLoginState, FormData>(adminLoginAction, {});
  return <form action={action} className="space-y-5" noValidate><div><label className="block text-sm font-medium" htmlFor="email">Correo electrónico</label><input className="mt-2 w-full rounded-lg border px-3 py-3" id="email" name="email" type="email" autoComplete="email" required /></div><div><label className="block text-sm font-medium" htmlFor="password">Contraseña</label><input className="mt-2 w-full rounded-lg border px-3 py-3" id="password" name="password" type="password" autoComplete="current-password" required /></div>{state.message ? <p className="text-sm text-red-700" role="alert">{state.message}</p> : null}<button className="w-full rounded-lg bg-zinc-950 px-4 py-3 font-medium text-white" disabled={pending} type="submit">{pending ? "Ingresando…" : "Iniciar sesión"}</button></form>;
}
