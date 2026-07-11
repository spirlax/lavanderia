import "server-only";

import { createClient } from "@/lib/supabase/server";

export type ReportSource = "platform" | "historical" | "combined";
export type AdminReport = {
  from: string; to: string; source: ReportSource; ordersReceived: number; deliveredOrders: number; uncollectedOrders: number;
  compliance: number; uncollectedRate: number; generationMs: number; generationMinutes: number; revenue: number;
  revenueByMethod: Record<"cash" | "yape" | "plin", number>; readyPendingOrders: Array<{ order_number: string; total: number; scheduled_for: string | null }>;
  ordersByStatus: Record<string, number>; note: string;
};

function money(value: number): number { return Math.round(value * 100) / 100; }
function nextDate(value: string): string { const date = new Date(`${value}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + 1); return date.toISOString().slice(0, 10); }

export async function getAdminReport(from: string, to: string, source: ReportSource = "platform"): Promise<AdminReport> {
  const started = performance.now();
  const supabase = await createClient();
  const includePlatform = source !== "historical";
  const includeHistorical = source !== "platform";
  const [ordersResult, paymentsResult, historicalResult] = await Promise.all([
    includePlatform ? supabase.from("orders").select("order_number,status,total,scheduled_for").gte("created_at", `${from}T00:00:00-05:00`).lt("created_at", `${nextDate(to)}T00:00:00-05:00`) : Promise.resolve({ data: [], error: null }),
    includePlatform ? supabase.from("payments").select("amount,method,status,paid_at").gte("paid_at", `${from}T00:00:00-05:00`).lt("paid_at", `${nextDate(to)}T00:00:00-05:00`) : Promise.resolve({ data: [], error: null }),
    includeHistorical ? supabase.from("historical_summaries").select("business_date,orders_received,orders_delivered,orders_uncollected,revenue,report_time_minutes").gte("business_date", from).lte("business_date", to) : Promise.resolve({ data: [], error: null }),
  ]);
  if (ordersResult.error || paymentsResult.error || historicalResult.error) throw new Error(ordersResult.error?.message ?? paymentsResult.error?.message ?? historicalResult.error?.message);
  const orders = ordersResult.data ?? [];
  const payments = paymentsResult.data ?? [];
  const historical = historicalResult.data ?? [];
  const ordersByStatus: Record<string, number> = {};
  for (const order of orders) ordersByStatus[order.status] = (ordersByStatus[order.status] ?? 0) + 1;
  const deliveredPlatform = orders.filter((order) => order.status === "delivered").length;
  const uncollectedPlatform = orders.filter((order) => order.status === "ready").length;
  const revenueByMethod = { cash: 0, yape: 0, plin: 0 };
  for (const payment of payments) if (payment.status === "posted") revenueByMethod[payment.method] += Number(payment.amount);
  const receivedHistorical = historical.reduce((sum, row) => sum + row.orders_received, 0);
  const deliveredHistorical = historical.reduce((sum, row) => sum + row.orders_delivered, 0);
  const uncollectedHistorical = historical.reduce((sum, row) => sum + row.orders_uncollected, 0);
  const revenueHistorical = historical.reduce((sum, row) => sum + Number(row.revenue), 0);
  const minutesHistorical = historical.length ? historical.reduce((sum, row) => sum + Number(row.report_time_minutes), 0) / historical.length : 0;
  const ordersReceived = (includePlatform ? orders.length : 0) + (includeHistorical ? receivedHistorical : 0);
  const deliveredOrders = (includePlatform ? deliveredPlatform : 0) + (includeHistorical ? deliveredHistorical : 0);
  const uncollectedOrders = (includePlatform ? uncollectedPlatform : 0) + (includeHistorical ? uncollectedHistorical : 0);
  const platformRevenue = Object.values(revenueByMethod).reduce((sum, value) => sum + value, 0);
  const revenue = money((includePlatform ? platformRevenue : 0) + (includeHistorical ? revenueHistorical : 0));
  const generationMs = Math.max(0, Math.round(performance.now() - started));
  const result: AdminReport = {
    from, to, source, ordersReceived, deliveredOrders, uncollectedOrders,
    compliance: ordersReceived ? money((deliveredOrders / ordersReceived) * 100) : 0,
    uncollectedRate: ordersReceived ? money((uncollectedOrders / ordersReceived) * 100) : 0,
    generationMs, generationMinutes: source === "historical" ? money(minutesHistorical) : money(generationMs / 60000), revenue,
    revenueByMethod: { cash: money(revenueByMethod.cash), yape: money(revenueByMethod.yape), plin: money(revenueByMethod.plin) },
    readyPendingOrders: orders.filter((order) => order.status === "ready").map((order) => ({ order_number: order.order_number, total: Number(order.total), scheduled_for: order.scheduled_for })),
    ordersByStatus, note: source === "combined" ? "Se suman recibidos, entregados, no recogidos e ingresos; los históricos no tienen desglose por método ni pedidos individuales." : source === "historical" ? "Datos agregados importados; no representan pedidos individuales." : "Datos operativos detallados de la plataforma.",
  };
  const user = (await supabase.auth.getUser()).data.user;
  if (user) await supabase.from("report_runs").insert({ requested_by: user.id, date_from: from, date_to: to, completed_at: new Date().toISOString(), duration_ms: generationMs, result, status: "completed" });
  return result;
}
