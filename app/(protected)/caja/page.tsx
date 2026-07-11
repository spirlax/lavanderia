import {
  CloseCashSessionForm,
  OpenCashSessionForm,
} from "@/components/cash/cash-actions";
import { CashSummary } from "@/components/cash/cash-summary";
import { Alert } from "@/components/ui/alert";
import styles from "@/components/ui/ui.module.css";
import { requireCurrentProfile } from "@/lib/auth/get-current-profile";
import {
  getCashSessionSummary,
  getOpenCashSession,
  listCashOperators,
} from "@/lib/cash/queries";

export default async function CashPage() {
  const [profile, session, operators] = await Promise.all([
    requireCurrentProfile(),
    getOpenCashSession(),
    listCashOperators(),
  ]);
  const summary = session ? await getCashSessionSummary(session) : null;
  const canOpen =
    profile.role === "admin" ||
    (profile.role === "operator" && profile.can_manage_cash_session);
  const canClose =
    session &&
    (profile.role === "admin" || session.responsible_operator_id === profile.id);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Caja del día</h1>
        <p className={styles.subtitle}>Una sola caja compartida para ambas operadoras.</p>
      </header>

      {summary ? (
        <section className={`${styles.panel} ${styles.panelStack}`}>
          <CashSummary summary={summary} />
        </section>
      ) : (
        <Alert tone="info">La caja del día está cerrada.</Alert>
      )}

      {!session && canOpen ? (
        <section className={`${styles.panel} ${styles.panelStack}`}>
          <h2 className={styles.cardTitle}>Abrir caja</h2>
          <OpenCashSessionForm
            operators={operators}
            ownOperatorId={profile.role === "operator" ? profile.id : undefined}
          />
        </section>
      ) : null}

      {!session && !canOpen ? (
        <Alert tone="info">La operadora responsable debe abrir la caja.</Alert>
      ) : null}

      {session && canClose ? (
        <section className={`${styles.panel} ${styles.panelStack}`}>
          <h2 className={styles.cardTitle}>Cerrar jornada</h2>
          <CloseCashSessionForm sessionId={session.id} />
        </section>
      ) : null}
    </div>
  );
}

