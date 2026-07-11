import { NextResponse } from "next/server";
import { getAdminReport, type ReportSource } from "@/lib/reports/queries";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const from = url.searchParams.get("from") ?? new Date().toISOString().slice(0, 8) + "01";
  const to = url.searchParams.get("to") ?? new Date().toISOString().slice(0, 10);
  const requestedSource = url.searchParams.get("source");
  const source: ReportSource = requestedSource === "historical" || requestedSource === "combined" ? requestedSource : "platform";
  const report = await getAdminReport(from, to, source);
  const rows = [["periodo", "origen", "recibidos", "entregados", "no_recogidos", "cumplimiento_pct", "tasa_no_recogidos_pct", "ingresos", "tiempo_reporte"], [ `${from} a ${to}`, source, String(report.ordersReceived), String(report.deliveredOrders), String(report.uncollectedOrders), String(report.compliance), String(report.uncollectedRate), report.revenue.toFixed(2), source === "historical" ? `${report.generationMinutes.toFixed(2)} min` : `${report.generationMs} ms` ]];
  return new NextResponse(rows.map((row) => row.join(",")).join("\n"), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename=reporte-${source}.csv` } });
}
