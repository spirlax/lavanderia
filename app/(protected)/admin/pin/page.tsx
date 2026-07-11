import styles from "@/components/ui/ui.module.css";
import { setOperatorPinAction } from "@/lib/auth/pin-actions";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPinPage() {
  const supabase = await createClient();
  const { data: operators } = await supabase.rpc("list_operator_pin_status");

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>PIN de operadoras</h1>
        <p className={styles.subtitle}>
          El PIN se almacena con hash y se bloquea tras intentos fallidos. Nunca
          se muestra el valor actual.
        </p>
      </header>

      <div className={styles.stackTight}>
        {operators?.map((operator) => (
          <form
            key={operator.profile_id}
            action={setOperatorPinAction}
            className={`${styles.panel} ${styles.inlineForm}`}
          >
            <input
              type="hidden"
              name="profile_id"
              value={operator.profile_id}
            />
            <div className={styles.inlineFormGrow}>
              <p className={styles.cardTitle}>{operator.full_name}</p>
              <p className={styles.help}>
                {operator.is_active ? "Activa" : "Inactiva"} ·{" "}
                {operator.pin_configured
                  ? "PIN configurado"
                  : "Sin PIN configurado"}
              </p>
            </div>
            <div className={styles.filterField}>
              <label className={styles.label} htmlFor={`pin-${operator.profile_id}`}>
                PIN de 6 dígitos
              </label>
              <input
                className={styles.input}
                id={`pin-${operator.profile_id}`}
                name="pin"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
              />
            </div>
            <button
              className={`${styles.button} ${styles.buttonPrimary}`}
              type="submit"
            >
              {operator.pin_configured ? "Reemplazar PIN" : "Establecer PIN"}
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
