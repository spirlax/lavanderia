import { redirect } from "next/navigation";

import {
  CloseCashSessionForm,
  OpenCashSessionForm,
} from "@/components/cash/cash-actions";
import { CashSummary } from "@/components/cash/cash-summary";
import { Alert } from "@/components/ui/alert";
import styles from "@/components/ui/ui.module.css";
import { canAccessAdmin } from "@/lib/auth/authorization";
import { requireCurrentProfile } from "@/lib/auth/get-current-profile";
import {
  getCashSessionByBusinessDate,
  getCashSessionSummary,
  getOpenCashSession,
  listCashOperators,
} from "@/lib/cash/queries";
import { limaTodayDate } from "@/lib/orders/datetime";

export default async function CashPage() {
  const profile = await requireCurrentProfile();
  if (canAccessAdmin(profile.role)) {
    redirect("/admin/caja");
  }

  const today = limaTodayDate();
  const [openSession, todaySession, operators] = await Promise.all([
    getOpenCashSession(),
    getCashSessionByBusinessDate(today),
    listCashOperators(),
  ]);

  const session = openSession ?? todaySession;
  const summary = session ? await getCashSessionSummary(session) : null;
  const isOpen = openSession !== null;
  const isClosedToday =
    !isOpen && todaySession !== null && todaySession.status === "closed";
  const canOpen =
    profile.role === "operator" && profile.can_manage_cash_session && !isClosedToday;
  const canClose =
    isOpen &&
    openSession !== null &&
    openSession.responsible_operator_id === profile.id;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Caja del día</h1>
        <p className={styles.subtitle}>
          Una sola caja compartida para ambas empleadas.
        </p>
      </header>

      {isClosedToday && summary ? (
        <>
          <Alert tone="info">La jornada de hoy ya fue cerrada.</Alert>
          <section className={`${styles.panel} ${styles.panelStack}`}>
            <CashSummary summary={summary} />
          </section>
        </>
      ) : null}

      {isOpen && summary ? (
        <section className={`${styles.panel} ${styles.panelStack}`}>
          <CashSummary summary={summary} />
        </section>
      ) : null}

      {!isOpen && !isClosedToday ? (
        <Alert tone="info">No hay una caja abierta para hoy.</Alert>
      ) : null}

      {!isOpen && !isClosedToday && canOpen ? (
        <section className={`${styles.panel} ${styles.panelStack}`}>
          <h2 className={styles.sectionTitle}>Abrir caja</h2>
          <OpenCashSessionForm
            operators={operators}
            ownOperatorId={profile.id}
          />
        </section>
      ) : null}

      {!isOpen && !isClosedToday && !canOpen ? (
        <Alert tone="info">
          La empleada responsable debe abrir la caja.
        </Alert>
      ) : null}

      {isOpen && canClose && summary && openSession ? (
        <section className={`${styles.panel} ${styles.panelStack}`}>
          <h2 className={styles.sectionTitle}>Cerrar jornada</h2>
          <CloseCashSessionForm
            sessionId={openSession.id}
            expectedCash={Number(summary.session.expected_cash)}
          />
        </section>
      ) : null}

      {isOpen && !canClose ? (
        <Alert tone="info">
          Solo la empleada responsable puede cerrar la caja.
        </Alert>
      ) : null}
    </div>
  );
}
