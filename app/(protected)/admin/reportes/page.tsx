import Link from "next/link";
import { getAdminReport, type ReportSource } from "@/lib/reports/queries";
import styles from "@/components/ui/ui.module.css";

type Props = { searchParams: Promise<{ from?: string; to?: string; source?: ReportSource }> };
const sourceLabels: Record<ReportSource, string> = { platform: "Plataforma", historical: "Históricos", combined: "Combinado" };

export default async function ReportsPage({ searchParams }: Props) {
  const params = await searchParams;
  const to = params.to ?? new Date().toISOString().slice(0, 10);
  const from = params.from ?? `${to.slice(0, 8)}01`;
  const source: ReportSource = params.source === "historical" || params.source === "combined" ? params.source : "platform";
  const report = await getAdminReport(from, to, source);
  return <div className={styles.page}><header className={styles.header}><h1 className={styles.title}>Reportes y BI</h1><p className={styles.subtitle}>Origen actual: <strong>{sourceLabels[source]}</strong>. {report.note}</p></header>
    <form className="mb-6 flex flex-wrap items-end gap-3" method="get"><label>Desde<input className="ml-2 rounded border p-2" type="date" name="from" defaultValue={from} /></label><label>Hasta<input className="ml-2 rounded border p-2" type="date" name="to" defaultValue={to} /></label><label>Origen<select className="ml-2 rounded border p-2" name="source" defaultValue={source}><option value="platform">Plataforma</option><option value="historical">Históricos</option><option value="combined">Combinado</option></select></label><button className="rounded bg-zinc-900 px-4 py-2 text-white" type="submit">Generar</button><Link className="rounded border px-4 py-2" href={`/admin/reportes/export?from=${from}&to=${to}&source=${source}`}>Exportar CSV</Link></form>
    <p className="mb-4 text-sm text-zinc-600">Periodo: {from} a {to} · Origen: {sourceLabels[source]}</p>
    <div className="grid gap-3 md:grid-cols-4"><Metric label="Pedidos recibidos" value={report.ordersReceived} /><Metric label="Pedidos entregados" value={report.deliveredOrders} /><Metric label="Pedidos no recogidos" value={report.uncollectedOrders} /><Metric label="Cumplimiento" value={`${report.compliance}%`} /><Metric label="Tasa no recogidos" value={`${report.uncollectedRate}%`} /><Metric label="Ingresos" value={`S/ ${report.revenue.toFixed(2)}`} /><Metric label="Tiempo reporte" value={source === "historical" ? `${report.generationMinutes.toFixed(2)} min (promedio)` : `${report.generationMs} ms`} /></div>
    {source !== "historical" ? <section className="mt-6 rounded border p-4"><h2 className="text-lg font-semibold">Ingresos de plataforma por método</h2><p>Efectivo: S/ {report.revenueByMethod.cash.toFixed(2)}</p><p>Yape: S/ {report.revenueByMethod.yape.toFixed(2)}</p><p>Plin: S/ {report.revenueByMethod.plin.toFixed(2)}</p></section> : null}
    {source !== "historical" ? <section className="mt-6 rounded border p-4"><h2 className="text-lg font-semibold">Pedidos listos pendientes</h2>{report.readyPendingOrders.length ? <ul>{report.readyPendingOrders.map((order) => <li key={order.order_number}>{order.order_number} — S/ {order.total.toFixed(2)}</li>)}</ul> : <p>No hay pedidos pendientes.</p>}</section> : null}
  </div>;
}

function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded border p-4"><p className="text-sm text-zinc-600">{label}</p><p className="text-2xl font-semibold">{value}</p></div>; }
