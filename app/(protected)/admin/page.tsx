import Link from "next/link";

import styles from "@/components/ui/ui.module.css";
import { requireCurrentProfile } from "@/lib/auth/get-current-profile";
import {
  getCashSessionSummary,
  getOpenCashSession,
} from "@/lib/cash/queries";
import { formatCurrency } from "@/lib/format/money";
import { listActiveOrders } from "@/lib/orders/queries";

export default async function AdminPage() {
  const profile = await requireCurrentProfile();

  const [openSession, activeOrders] = await Promise.all([
    getOpenCashSession(),
    listActiveOrders(),
  ]);

  const cashSummary = openSession
    ? await getCashSessionSummary(openSession)
    : null;
  const readyCount = activeOrders.filter(
    (order) => order.status === "ready",
  ).length;
  const balancePending = activeOrders.filter(
    (order) => Number(order.balance_due) > 0,
  ).length;
  const collected = cashSummary
    ? Number(cashSummary.totals.cash) +
      Number(cashSummary.totals.yape) +
      Number(cashSummary.totals.plin)
    : 0;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Panel administrativo</h1>
        <p className={styles.subtitle}>
          Hola, {profile.full_name}. Resumen operativo y accesos principales.
        </p>
      </header>

      <section className={styles.metricGrid} aria-label="Resumen operativo">
        <div className={`${styles.metric} ${styles.metricPrimary}`}>
          <p className={styles.metricLabel}>Caja</p>
          <p className={styles.metricValue}>
            {openSession ? "Abierta" : "Cerrada"}
          </p>
          <p className={styles.help}>
            {cashSummary
              ? `Esperado ${formatCurrency(Number(cashSummary.session.expected_cash))}`
              : "Sin jornada abierta"}
          </p>
        </div>
        <div className={styles.metric}>
          <p className={styles.metricLabel}>Cobrado en jornada</p>
          <p className={styles.metricValue}>
            {openSession ? formatCurrency(collected) : "—"}
          </p>
          <p className={styles.help}>
            {openSession
              ? "Pagos de la caja abierta"
              : "Abre caja para ver totales"}
          </p>
        </div>
        <div className={styles.metric}>
          <p className={styles.metricLabel}>Pedidos activos</p>
          <p className={styles.metricValue}>{activeOrders.length}</p>
          <p className={styles.help}>
            {readyCount === 1
              ? "1 listo para entregar"
              : `${readyCount} listos para entregar`}
          </p>
        </div>
        <div className={styles.metric}>
          <p className={styles.metricLabel}>Con saldo</p>
          <p className={styles.metricValue}>{balancePending}</p>
          <p className={styles.help}>Activos con saldo pendiente</p>
        </div>
      </section>

      <section className={styles.panelStack}>
        <h2 className={styles.sectionTitle}>Accesos rápidos</h2>
        <div className={styles.shortcutGrid}>
          <Link href="/" className={styles.linkCard}>
            <h3 className={styles.linkCardTitle}>Operación</h3>
            <p className={styles.linkCardText}>Cola activa y entregas.</p>
          </Link>
          <Link href="/admin/caja" className={styles.linkCard}>
            <h3 className={styles.linkCardTitle}>Caja</h3>
            <p className={styles.linkCardText}>
              Apertura, cierre y responsables.
            </p>
          </Link>
          <Link href="/admin/reportes" className={styles.linkCard}>
            <h3 className={styles.linkCardTitle}>Reportes</h3>
            <p className={styles.linkCardText}>Indicadores y exportación.</p>
          </Link>
          <Link href="/admin/servicios" className={styles.linkCard}>
            <h3 className={styles.linkCardTitle}>Servicios</h3>
            <p className={styles.linkCardText}>Catálogo y precios.</p>
          </Link>
          <Link href="/admin/importaciones" className={styles.linkCard}>
            <h3 className={styles.linkCardTitle}>Importaciones</h3>
            <p className={styles.linkCardText}>Históricos diarios.</p>
          </Link>
          <Link href="/admin/pin" className={styles.linkCard}>
            <h3 className={styles.linkCardTitle}>PIN</h3>
            <p className={styles.linkCardText}>Acceso de operadoras.</p>
          </Link>
        </div>
      </section>
    </div>
  );
}
