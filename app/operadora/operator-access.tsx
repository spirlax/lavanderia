"use client";

import { useActionState, useState } from "react";
import { operatorPinLoginAction, type OperatorPinState } from "@/lib/auth/operator-pin-login";

export function OperatorAccess({ operators }: { operators: Array<{ id: string; full_name: string }> }) {
  const [selected, setSelected] = useState<string | null>(null);
  return <div className="space-y-6">{selected ? <OperatorPinForm operator={operators.find((operator) => operator.id === selected) ?? operators[0]} onBack={() => setSelected(null)} /> : <div className="grid gap-3">{operators.map((operator) => <button className="rounded-2xl border-2 bg-white p-6 text-left text-xl font-semibold shadow-sm transition hover:border-zinc-900" key={operator.id} onClick={() => setSelected(operator.id)} type="button">{operator.full_name}<span className="mt-1 block text-sm font-normal text-zinc-600">Seleccionar operadora</span></button>)}</div>}</div>;
}

function OperatorPinForm({ operator, onBack }: { operator: { id: string; full_name: string }; onBack: () => void }) {
  const action = operatorPinLoginAction.bind(null, operator.id);
  const [state, formAction, pending] = useActionState<OperatorPinState, FormData>(action, { status: "idle" });
  const [pin, setPin] = useState("");
  const add = (digit: string) => { if (pin.length < 6) setPin((current) => current + digit); };
  return <form action={(data) => { data.set("pin", pin); formAction(data); }} className="space-y-6"><button className="text-sm text-zinc-600 underline" onClick={onBack} type="button">← Cambiar operadora</button><div className="text-center"><p className="text-sm text-zinc-600">Operadora seleccionada</p><h2 className="mt-1 text-2xl font-semibold">{operator.full_name}</h2><p className="mt-5 text-4xl tracking-[0.3em]" aria-label={`${pin.length} de 6 dígitos`}>{Array.from({ length: 6 }, (_, index) => index < pin.length ? "●" : "○").join(" ")}</p></div><div className="mx-auto grid max-w-xs grid-cols-3 gap-3">{["1","2","3","4","5","6","7","8","9"].map((digit) => <button className="min-h-14 rounded-xl border bg-white text-2xl font-semibold shadow-sm active:scale-95" key={digit} onClick={() => add(digit)} type="button">{digit}</button>)}<span /><button className="min-h-14 rounded-xl border bg-white text-2xl font-semibold shadow-sm active:scale-95" onClick={() => add("0")} type="button">0</button><button className="min-h-14 rounded-xl border bg-white text-sm font-semibold shadow-sm" onClick={() => setPin((current) => current.slice(0, -1))} type="button">Borrar</button></div>{state.message ? <p className="text-center text-sm text-red-700" role="alert">{state.message}</p> : null}<button className="mx-auto block w-full max-w-xs rounded-xl bg-zinc-950 px-4 py-4 text-lg font-semibold text-white disabled:opacity-50" disabled={pending || pin.length !== 6} type="submit">{pending ? "Ingresando…" : "Ingresar"}</button></form>;
}
