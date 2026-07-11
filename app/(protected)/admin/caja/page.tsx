import {
  CashPermissionForm,
  CloseCashSessionForm,
  OpenCashSessionForm,
} from "@/components/cash/cash-actions";
import { CashSummary } from "@/components/cash/cash-summary";
import styles from "@/components/ui/ui.module.css";
import {
  getCashSessionSummary,
  listCashOperators,
  listCashSessions,
} from "@/lib/cash/queries";

export default async function AdminCashPage() {
  const [sessions, operators] = await Promise.all([
    listCashSessions(),
    listCashOperators(),
  ]);
  const summaries = await Promise.all(
    sessions.map((session) => getCashSessionSummary(session)),
  );
  const current = summaries.find(
    (summary) => summary.session.status === "open",
  );
  const closed = summaries.filter(
    (summary) => summary.session.status === "closed",
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Administración de caja</h1>
        <p className={styles.subtitle}>
          Supervisa la jornada compartida y asigna la responsabilidad de
          apertura y cierre.
        </p>
      </header>

      <section className={`${styles.panel} ${styles.panelStack}`}>
        <h2 className={styles.sectionTitle}>Permiso de responsable</h2>
        {operators.map((operator) => (
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

      {current ? (
        <section className={`${styles.panel} ${styles.panelStack}`}>
          <CashSummary summary={current} />
          <h2 className={styles.sectionTitle}>Cierre administrativo</h2>
          <CloseCashSessionForm
            sessionId={current.session.id}
            expectedCash={Number(current.session.expected_cash)}
          />
        </section>
      ) : (
        <section className={`${styles.panel} ${styles.panelStack}`}>
          <h2 className={styles.sectionTitle}>Abrir caja</h2>
          <OpenCashSessionForm operators={operators} />
        </section>
      )}

      <section className={styles.panelStack}>
        <h2 className={styles.sectionTitle}>Jornadas anteriores</h2>
        {closed.length === 0 ? (
          <p className={styles.help}>Aún no hay jornadas cerradas.</p>
        ) : (
          closed.map((summary) => (
            <article key={summary.session.id} className={styles.panel}>
              <CashSummary summary={summary} compact />
            </article>
          ))
        )}
      </section>
    </div>
  );
}
