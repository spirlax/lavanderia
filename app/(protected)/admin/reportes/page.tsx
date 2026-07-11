import Link from "next/link";

import styles from "@/components/ui/ui.module.css";
import { formatCurrency } from "@/lib/format/money";
import { getAdminReport, type ReportSource } from "@/lib/reports/queries";

type Props = {
  searchParams: Promise<{ from?: string; to?: string; source?: ReportSource }>;
};

const sourceLabels: Record<ReportSource, string> = {
  platform: "Plataforma",
  historical: "Históricos",
  combined: "Combinado",
};

export default async function ReportsPage({ searchParams }: Props) {
  const params = await searchParams;
  const to = params.to ?? new Date().toISOString().slice(0, 10);
  const from = params.from ?? `${to.slice(0, 8)}01`;
  const source: ReportSource =
    params.source === "historical" || params.source === "combined"
      ? params.source
      : "platform";
  const report = await getAdminReport(from, to, source);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Reportes y BI</h1>
        <p className={styles.subtitle}>
          Origen: <strong>{sourceLabels[source]}</strong>. {report.note}
        </p>
      </header>

      <form className={`${styles.panel} ${styles.filterBar}`} method="get">
        <div className={styles.filterField}>
          <label className={styles.label} htmlFor="from">
            Desde
          </label>
          <input
            className={styles.input}
            id="from"
            type="date"
            name="from"
            defaultValue={from}
          />
        </div>
        <div className={styles.filterField}>
          <label className={styles.label} htmlFor="to">
            Hasta
          </label>
          <input
            className={styles.input}
            id="to"
            type="date"
            name="to"
            defaultValue={to}
          />
        </div>
        <div className={styles.filterField}>
          <label className={styles.label} htmlFor="source">
            Origen
          </label>
          <select
            className={styles.select}
            id="source"
            name="source"
            defaultValue={source}
          >
            <option value="platform">Plataforma</option>
            <option value="historical">Históricos</option>
            <option value="combined">Combinado</option>
          </select>
        </div>
        <button
          className={`${styles.button} ${styles.buttonPrimary}`}
          type="submit"
        >
          Generar
        </button>
        <Link
          className={`${styles.button} ${styles.buttonSecondary}`}
          href={`/admin/reportes/export?from=${from}&to=${to}&source=${source}`}
        >
          Exportar CSV
        </Link>
      </form>

      <section className={styles.panelStack} aria-label="Indicadores principales">
        <h2 className={styles.sectionTitle}>Indicadores principales</h2>
        <div className={styles.metricGrid}>
          <div className={`${styles.metric} ${styles.metricPrimary}`}>
            <p className={styles.metricLabel}>Ingresos</p>
            <p className={styles.metricValue}>
              {formatCurrency(report.revenue)}
            </p>
          </div>
          <div className={styles.metric}>
            <p className={styles.metricLabel}>Pedidos recibidos</p>
            <p className={styles.metricValue}>{report.ordersReceived}</p>
          </div>
          <div className={styles.metric}>
            <p className={styles.metricLabel}>Cumplimiento</p>
            <p className={styles.metricValue}>{report.compliance}%</p>
          </div>
          <div className={styles.metric}>
            <p className={styles.metricLabel}>No recogidos</p>
            <p className={styles.metricValue}>{report.uncollectedOrders}</p>
          </div>
        </div>
      </section>

      <section className={styles.panelStack} aria-label="Indicadores secundarios">
        <h2 className={styles.sectionTitle}>Detalle operativo</h2>
        <div className={styles.metricGrid}>
          <Metric label="Pedidos entregados" value={report.deliveredOrders} />
          <Metric
            label="Tasa no recogidos"
            value={`${report.uncollectedRate}%`}
          />
          <Metric
            label="Tiempo reporte"
            value={
              source === "historical"
                ? `${report.generationMinutes.toFixed(2)} min`
                : `${report.generationMs} ms`
            }
          />
        </div>
      </section>

      {source !== "historical" ? (
        <section className={`${styles.panel} ${styles.panelStack}`}>
          <h2 className={styles.sectionTitle}>
            Ingresos de plataforma por método
          </h2>
          <ul className={styles.amountList}>
            <li className={styles.amountRow}>
              <span>Efectivo</span>
              <span className={styles.amountValue}>
                {formatCurrency(report.revenueByMethod.cash)}
              </span>
            </li>
            <li className={styles.amountRow}>
              <span>Yape</span>
              <span className={styles.amountValue}>
                {formatCurrency(report.revenueByMethod.yape)}
              </span>
            </li>
            <li className={styles.amountRow}>
              <span>Plin</span>
              <span className={styles.amountValue}>
                {formatCurrency(report.revenueByMethod.plin)}
              </span>
            </li>
          </ul>
        </section>
      ) : null}

      {source !== "historical" ? (
        <section className={`${styles.panel} ${styles.panelStack}`}>
          <h2 className={styles.sectionTitle}>Pedidos listos pendientes</h2>
          {report.readyPendingOrders.length ? (
            <ul className={styles.amountList}>
              {report.readyPendingOrders.map((order) => (
                <li className={styles.amountRow} key={order.order_number}>
                  <span>{order.order_number}</span>
                  <span className={styles.amountValue}>
                    {formatCurrency(order.total)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.help}>No hay pedidos pendientes.</p>
          )}
        </section>
      ) : null}
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className={styles.metric}>
      <p className={styles.metricLabel}>{label}</p>
      <p className={styles.metricValue}>{value}</p>
    </div>
  );
}
