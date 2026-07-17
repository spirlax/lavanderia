import Link from "next/link";

import {
  CloseCashSessionForm,
  OpenCashSessionForm,
} from "@/components/cash/cash-actions";
import { CashSummary } from "@/components/cash/cash-summary";
import { Alert } from "@/components/ui/alert";
import styles from "@/components/ui/ui.module.css";
import {
  getCashSessionByBusinessDate,
  getCashSessionSummary,
  getOpenCashSession,
  listCashOperators,
  listCashSessions,
} from "@/lib/cash/queries";
import { limaTodayDate } from "@/lib/orders/datetime";

export default async function AdminCashPage() {
  const today = limaTodayDate();
  const [openSession, todaySession, sessions, operators] = await Promise.all([
    getOpenCashSession(),
    getCashSessionByBusinessDate(today),
    listCashSessions(),
    listCashOperators(),
  ]);

  const session = openSession ?? todaySession;
  const summary = session ? await getCashSessionSummary(session) : null;
  const isOpen = openSession !== null;
  const isClosedToday =
    !isOpen && todaySession !== null && todaySession.status === "closed";

  const historySummaries = await Promise.all(
    sessions
      .filter((row) => row.status === "closed")
      .slice(0, 12)
      .map((row) => getCashSessionSummary(row)),
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Supervisión de caja</h1>
        <p className={styles.subtitle}>
          Estado de la jornada, totales y historial. Sin flujo operativo de
          apertura como acción principal.
        </p>
      </header>

      <section
        className={`${styles.panel} ${styles.panelStack}`}
        aria-labelledby="cash-today"
      >
        <div className={styles.headerRow}>
          <h2 id="cash-today" className={styles.sectionTitle}>
            Jornada de hoy
          </h2>
          <span
            className={`${styles.badge} ${
              isOpen
                ? styles.badgeActive
                : isClosedToday
                  ? styles.badgeInactive
                  : styles.badgeInfo
            }`}
          >
            {isOpen ? "Abierta" : isClosedToday ? "Cerrada" : "Sin apertura"}
          </span>
        </div>

        {summary ? (
          <CashSummary summary={summary} />
        ) : (
          <Alert tone="info">
            Aún no hay jornada registrada para hoy.
          </Alert>
        )}
      </section>

      {isOpen && summary && openSession ? (
        <section className={`${styles.panel} ${styles.panelStack}`}>
          <h2 className={styles.sectionTitle}>Cierre administrativo</h2>
          <p className={styles.help}>
            Reserva para supervisión. El cierre habitual lo realiza la
            empleada responsable en su área.
          </p>
          <CloseCashSessionForm
            sessionId={openSession.id}
            expectedCash={Number(summary.session.expected_cash)}
          />
        </section>
      ) : null}

      {!isOpen && !isClosedToday ? (
        <details className={`${styles.panel} ${styles.panelStack}`}>
          <summary className={styles.sectionTitle}>
            Apertura excepcional
          </summary>
          <p className={styles.help}>
            Usa solo si la empleada responsable no puede abrir desde su
            sesión.
          </p>
          <OpenCashSessionForm operators={operators} />
        </details>
      ) : null}

      {isClosedToday ? (
        <Alert tone="info">La jornada de hoy ya fue cerrada.</Alert>
      ) : null}

      <section className={styles.panelStack}>
        <h2 className={styles.sectionTitle}>Historial de jornadas</h2>
        {historySummaries.length === 0 ? (
          <p className={styles.help}>Aún no hay jornadas cerradas.</p>
        ) : (
          historySummaries.map((item) => (
            <article key={item.session.id} className={styles.panel}>
              <CashSummary summary={item} compact />
            </article>
          ))
        )}
      </section>

      <p className={styles.help}>
        La autorización de responsable de caja se gestiona en{" "}
        <Link href="/admin/pin" className={styles.textLink}>
          Empleadas y PIN
        </Link>
        .
      </p>
    </div>
  );
}
