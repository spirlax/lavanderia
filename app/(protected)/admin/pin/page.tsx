import { CashPermissionForm } from "@/components/cash/cash-actions";
import styles from "@/components/ui/ui.module.css";
import { setOperatorPinAction } from "@/lib/auth/pin-actions";
import { listCashOperators } from "@/lib/cash/queries";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPinPage() {
  const supabase = await createClient();
  const [{ data: operators }, cashOperators] = await Promise.all([
    supabase.rpc("list_operator_pin_status"),
    listCashOperators(),
  ]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Empleadas y PIN</h1>
        <p className={styles.subtitle}>
          Acceso por PIN y autorización de responsable de caja.
        </p>
      </header>

      <section className={styles.panelStack} aria-labelledby="pin-section">
        <h2 id="pin-section" className={styles.sectionTitle}>
          PIN de acceso
        </h2>
        <p className={styles.help}>
          El PIN se almacena con hash y se bloquea tras intentos fallidos. Nunca
          se muestra el valor actual.
        </p>
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
                <label
                  className={styles.label}
                  htmlFor={`pin-${operator.profile_id}`}
                >
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
      </section>

      <section
        className={`${styles.panel} ${styles.panelStack}`}
        aria-labelledby="cash-perm-section"
      >
        <h2 id="cash-perm-section" className={styles.sectionTitle}>
          Responsable de caja
        </h2>
        <p className={styles.help}>
          Solo la empleada autorizada puede abrir la caja del día.
        </p>
        {cashOperators.map((operator) => (
          <article key={operator.id} className={styles.card}>
            <div className={styles.headerRow}>
              <div>
                <strong>{operator.full_name}</strong>
                <p className={styles.help}>
                  {operator.can_manage_cash_session
                    ? "Responsable autorizada"
                    : "Sin permiso de caja"}
                </p>
              </div>
              <CashPermissionForm operator={operator} />
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
