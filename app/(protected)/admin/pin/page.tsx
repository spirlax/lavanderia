import { setOperatorPinAction } from "@/lib/auth/pin-actions";
import { createClient } from "@/lib/supabase/server";
import styles from "@/components/ui/ui.module.css";

export default async function AdminPinPage() {
  const supabase = await createClient();
  const { data: operators } = await supabase.rpc("list_operator_pin_status");
  return <div className={styles.page}><header className={styles.header}><h1 className={styles.title}>PIN de operadoras</h1><p className={styles.subtitle}>El PIN se almacena con hash y se bloquea tras intentos fallidos. Nunca se muestra el valor actual.</p></header><div className="space-y-4">{operators?.map((operator) => <form key={operator.profile_id} action={setOperatorPinAction} className="flex flex-wrap items-end gap-3 rounded border p-4"><input type="hidden" name="profile_id" value={operator.profile_id} /><div><p className="font-medium">{operator.full_name}</p><p className="text-sm text-zinc-600">{operator.is_active ? "Activa" : "Inactiva"} · {operator.pin_configured ? "PIN configurado" : "Sin PIN configurado"}</p></div><label>PIN de 6 dígitos<input className="ml-2 rounded border p-2" name="pin" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required /></label><button className="rounded bg-zinc-900 px-4 py-2 text-white" type="submit">{operator.pin_configured ? "Reemplazar PIN" : "Establecer PIN"}</button></form>)}</div></div>;
}
