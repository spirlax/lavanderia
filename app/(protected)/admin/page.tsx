import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Clock3,
  Package,
  TrendingUp,
  Wallet,
} from "lucide-react";

import {
  DistributionBars,
  TrendBars,
} from "@/components/admin/dashboard-charts";
import { EmptyState } from "@/components/ui/empty-state";
import styles from "@/components/ui/ui.module.css";
import { requireCurrentProfile } from "@/lib/auth/get-current-profile";
import { formatCurrency } from "@/lib/format/money";
import { getAdminDashboardData } from "@/lib/reports/dashboard";

export default async function AdminPage() {
  const profile = await requireCurrentProfile();
  const data = await getAdminDashboardData();

  const cashLabel =
    data.cash.status === "open"
      ? "Abierta"
      : data.cash.status === "closed"
        ? "Cerrada"
        : "Sin apertura";

  const alertItems = [
    {
      key: "overdue",
      label: "Programados vencidos",
      value: data.alerts.overdueScheduled,
      tone: "warn" as const,
    },
    {
      key: "ready",
      label: "Listos pendientes",
      value: data.alerts.readyPending,
      tone: "info" as const,
    },
    {
      key: "balance",
      label: "Con saldo pendiente",
      value: data.alerts.balancePending,
      tone: "warn" as const,
    },
    {
      key: "diff",
      label: "Diferencia de caja",
      value:
        data.alerts.cashDifference === null
          ? null
          : data.alerts.cashDifference,
      tone:
        data.alerts.cashDifference === null || data.alerts.cashDifference === 0
          ? ("ok" as const)
          : ("warn" as const),
    },
  ];

  const hasAlerts = alertItems.some((item) =>
    typeof item.value === "number" ? item.value !== 0 : false,
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Panel administrativo</h1>
        <p className={styles.subtitle}>
          Hola, {profile.full_name}. Resumen real de la jornada y últimos 7
          días.
        </p>
      </header>

      <section className={styles.dashboardSection} aria-labelledby="today-summary">
        <h2 id="today-summary" className={styles.sectionTitle}>
          Resumen de hoy
        </h2>
        <div className={styles.kpiGrid}>
          <article className={`${styles.kpiCard} ${styles.kpiCardPrimary}`}>
            <div className={styles.kpiIcon}>
              <Wallet aria-hidden="true" size={18} />
            </div>
            <p className={styles.kpiLabel}>Caja</p>
            <p className={styles.kpiValue}>{cashLabel}</p>
            <p className={styles.help}>
              {data.cash.summary
                ? `Resp. ${data.cash.summary.responsibleName}`
                : "Sin jornada registrada"}
            </p>
          </article>
          <article className={`${styles.kpiCard} ${styles.kpiCardSuccess}`}>
            <div className={styles.kpiIcon}>
              <Banknote aria-hidden="true" size={18} />
            </div>
            <p className={styles.kpiLabel}>Ingresos de jornada</p>
            <p className={styles.kpiValue}>
              {data.cash.summary ? formatCurrency(data.cash.collected) : "—"}
            </p>
            <p className={styles.help}>Efectivo + Yape + Plin</p>
          </article>
          <article className={styles.kpiCard}>
            <div className={styles.kpiIcon}>
              <Package aria-hidden="true" size={18} />
            </div>
            <p className={styles.kpiLabel}>Pedidos recibidos</p>
            <p className={styles.kpiValue}>{data.todayOrdersReceived}</p>
            <p className={styles.help}>Creados hoy</p>
          </article>
          <article className={styles.kpiCard}>
            <div className={styles.kpiIcon}>
              <TrendingUp aria-hidden="true" size={18} />
            </div>
            <p className={styles.kpiLabel}>Pedidos activos</p>
            <p className={styles.kpiValue}>{data.activeOrders}</p>
            <p className={styles.help}>
              {data.readyPending === 1
                ? "1 listo no recogido"
                : `${data.readyPending} listos no recogidos`}
            </p>
          </article>
          <article
            className={`${styles.kpiCard} ${
              data.cash.difference !== null && data.cash.difference !== 0
                ? styles.kpiCardWarn
                : ""
            }`}
          >
            <div className={styles.kpiIcon}>
              <CheckCircle2 aria-hidden="true" size={18} />
            </div>
            <p className={styles.kpiLabel}>Diferencia de caja</p>
            <p className={styles.kpiValue}>
              {data.cash.difference === null
                ? "—"
                : formatCurrency(data.cash.difference)}
            </p>
            <p className={styles.help}>
              {data.cash.difference === null
                ? "Disponible al cerrar"
                : data.cash.difference === 0
                  ? "Cuadra"
                  : "Revisar cierre"}
            </p>
          </article>
        </div>
      </section>

      <section className={styles.dashboardSection} aria-labelledby="performance">
        <h2 id="performance" className={styles.sectionTitle}>
          Rendimiento
        </h2>
        <div className={styles.dashboardGrid}>
          <article className={`${styles.panel} ${styles.panelStack}`}>
            <h3 className={styles.cardTitle}>Ingresos · 7 días</h3>
            <TrendBars
              points={data.revenueTrend}
              valueKey="revenue"
              formatValue={(value) =>
                value === 0 ? "0" : formatCurrency(value)
              }
              tone="primary"
            />
          </article>
          <article className={`${styles.panel} ${styles.panelStack}`}>
            <h3 className={styles.cardTitle}>Pedidos · 7 días</h3>
            <TrendBars
              points={data.ordersTrend}
              valueKey="orders"
              formatValue={(value) => String(value)}
              tone="accent"
            />
          </article>
          <article className={`${styles.panel} ${styles.panelStack}`}>
            <h3 className={styles.cardTitle}>Métodos de pago · 7 días</h3>
            <DistributionBars
              items={data.methodDistribution}
              formatValue={(value) => formatCurrency(value)}
              tone="success"
            />
          </article>
          <article className={`${styles.panel} ${styles.panelStack}`}>
            <h3 className={styles.cardTitle}>Pedidos por estado · 7 días</h3>
            <DistributionBars
              items={data.statusDistribution}
              formatValue={(value) => String(value)}
              tone="accent"
              emptyLabel="Sin pedidos en el periodo."
            />
          </article>
        </div>
      </section>

      <section className={styles.dashboardSection} aria-labelledby="thesis">
        <h2 id="thesis" className={styles.sectionTitle}>
          Indicadores de tesis
        </h2>
        <p className={styles.help}>
          Calculados sobre pedidos de plataforma de los últimos 7 días. Sin
          inventar cifras.
        </p>
        <div className={styles.kpiGrid}>
          <article className={`${styles.kpiCard} ${styles.kpiCardAccent}`}>
            <p className={styles.kpiLabel}>Cumplimiento</p>
            <p className={styles.kpiValue}>
              {data.thesis.ordersReceived === 0
                ? "—"
                : `${data.thesis.compliance}%`}
            </p>
            <p className={styles.help}>
              Entregados / recibidos ({data.thesis.deliveredOrders}/
              {data.thesis.ordersReceived})
            </p>
          </article>
          <article className={`${styles.kpiCard} ${styles.kpiCardAccent}`}>
            <p className={styles.kpiLabel}>No recogidos</p>
            <p className={styles.kpiValue}>
              {data.thesis.ordersReceived === 0
                ? "—"
                : `${data.thesis.uncollectedRate}%`}
            </p>
            <p className={styles.help}>
              Listos / recibidos ({data.thesis.uncollectedOrders}/
              {data.thesis.ordersReceived})
            </p>
          </article>
          <article className={`${styles.kpiCard} ${styles.kpiCardAccent}`}>
            <p className={styles.kpiLabel}>Tiempo de generación</p>
            <p className={styles.kpiValue}>{data.thesis.generationMs} ms</p>
            <p className={styles.help}>Carga de este panel</p>
          </article>
        </div>
      </section>

      <section className={styles.dashboardSection} aria-labelledby="alerts">
        <h2 id="alerts" className={styles.sectionTitle}>
          Alertas
        </h2>
        {!hasAlerts && data.alerts.cashDifference === null ? (
          <EmptyState
            title="Sin alertas activas"
            description="No hay vencidos, listos pendientes ni saldos con atención especial."
          />
        ) : (
          <div className={styles.alertGrid}>
            {alertItems.map((item) => (
              <article
                key={item.key}
                className={[
                  styles.alertCard,
                  item.tone === "warn"
                    ? styles.alertCardWarn
                    : item.tone === "ok"
                      ? styles.alertCardOk
                      : styles.alertCardInfo,
                ].join(" ")}
              >
                <div className={styles.kpiIcon}>
                  <AlertTriangle aria-hidden="true" size={16} />
                </div>
                <p className={styles.kpiLabel}>{item.label}</p>
                <p className={styles.kpiValue}>
                  {item.value === null
                    ? "—"
                    : typeof item.value === "number" && item.key === "diff"
                      ? formatCurrency(item.value)
                      : item.value}
                </p>
              </article>
            ))}
            {data.alerts.overdueScheduled > 0 ? (
              <p className={styles.help}>
                <Clock3
                  aria-hidden="true"
                  size={14}
                  className={styles.inlineIcon}
                />{" "}
                Hay pedidos con fecha programada vencida en la cola activa.
              </p>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
