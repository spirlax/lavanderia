import { NextResponse } from "next/server";

import { getAdminReport } from "@/lib/reports/queries";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const from = url.searchParams.get("from") ?? new Date().toISOString().slice(0, 8) + "01";
  const to = url.searchParams.get("to") ?? new Date().toISOString().slice(0, 10);
  const report = await getAdminReport(from, to);
  const rows = [["indicador", "valor"], ["pedidos_totales", String(report.totalOrders)], ["pedidos_entregados", String(report.deliveredOrders)], ["cumplimiento_pct", String(report.compliance)], ["no_recogidos_pct", String(report.uncollectedRate)], ["ingresos", report.revenue.toFixed(2)], ["efectivo", report.revenueByMethod.cash.toFixed(2)], ["yape", report.revenueByMethod.yape.toFixed(2)], ["plin", report.revenueByMethod.plin.toFixed(2)], ["tiempo_reporte_ms", String(report.generationMs)]];
  return new NextResponse(rows.map((row) => row.join(",")).join("\n"), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": "attachment; filename=reporte.csv" } });
}
