"use client";

import { useActionState } from "react";

import { loginAction } from "@/app/login/actions";
import type { LoginActionState } from "@/lib/auth/types";

const initialLoginState: LoginActionState = { status: "idle" };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialLoginState,
  );

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium">
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={Boolean(state.fieldErrors?.email)}
          aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
        />
        {state.fieldErrors?.email ? (
          <p id="email-error" className="text-sm text-red-700">
            {state.fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="pin" className="block text-sm font-medium">PIN de operadora (6 dígitos)</label>
        <input id="pin" name="pin" type="password" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" className="w-full rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900" />
        {state.fieldErrors?.pin ? <p className="text-sm text-red-700">{state.fieldErrors.pin}</p> : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={Boolean(state.fieldErrors?.password)}
          aria-describedby={
            state.fieldErrors?.password ? "password-error" : undefined
          }
          className="w-full rounded-md border border-zinc-300 px-3 py-2 outline-none focus:border-zinc-900"
        />
        {state.fieldErrors?.password ? (
          <p id="password-error" className="text-sm text-red-700">
            {state.fieldErrors.password}
          </p>
        ) : null}
      </div>

      {state.message ? (
        <p role="alert" className="text-sm text-red-700">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Ingresando…" : "Iniciar sesión"}
      </button>
    </form>
  );
}
