import "server-only";

import { createClient } from "@/lib/supabase/server";

export type AdminReport = {
  from: string;
  to: string;
  totalOrders: number;
  deliveredOrders: number;
  readyPendingOrders: Array<{ order_number: string; total: number; scheduled_for: string | null }>;
  compliance: number;
  uncollectedRate: number;
  generationMs: number;
  revenue: number;
  revenueByMethod: Record<"cash" | "yape" | "plin", number>;
  ordersByStatus: Record<string, number>;
};

function money(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function getAdminReport(from: string, to: string): Promise<AdminReport> {
  const started = performance.now();
  const supabase = await createClient();
  const [ordersResult, paymentsResult] = await Promise.all([
    supabase
      .from("orders")
      .select("order_number,status,total,scheduled_for")
      .gte("created_at", `${from}T00:00:00-05:00`)
      .lt("created_at", `${to}T00:00:00-05:00`),
    supabase
      .from("payments")
      .select("amount,method,status,paid_at")
      .gte("paid_at", `${from}T00:00:00-05:00`)
      .lt("paid_at", `${to}T00:00:00-05:00`),
  ]);
  if (ordersResult.error) throw new Error(ordersResult.error.message);
  if (paymentsResult.error) throw new Error(paymentsResult.error.message);

  const orders = ordersResult.data ?? [];
  const payments = paymentsResult.data ?? [];
  const ordersByStatus: Record<string, number> = {};
  for (const order of orders) ordersByStatus[order.status] = (ordersByStatus[order.status] ?? 0) + 1;
  const deliveredOrders = orders.filter((order) => order.status === "delivered").length;
  const readyPendingOrders = orders
    .filter((order) => order.status === "ready")
    .map((order) => ({ order_number: order.order_number, total: Number(order.total), scheduled_for: order.scheduled_for }));
  const revenueByMethod = { cash: 0, yape: 0, plin: 0 };
  for (const payment of payments) {
    if (payment.status === "posted") revenueByMethod[payment.method] += Number(payment.amount);
  }
  const revenue = money(revenueByMethod.cash + revenueByMethod.yape + revenueByMethod.plin);
  const totalOrders = orders.length;
  const generationMs = Math.max(0, Math.round(performance.now() - started));
  const result: AdminReport = {
    from, to, totalOrders, deliveredOrders, readyPendingOrders,
    compliance: totalOrders ? money((deliveredOrders / totalOrders) * 100) : 0,
    uncollectedRate: totalOrders ? money((readyPendingOrders.length / totalOrders) * 100) : 0,
    generationMs, revenue, revenueByMethod: {
      cash: money(revenueByMethod.cash), yape: money(revenueByMethod.yape), plin: money(revenueByMethod.plin),
    }, ordersByStatus,
  };
  await supabase.from("report_runs").insert({
    requested_by: (await supabase.auth.getUser()).data.user?.id ?? "00000000-0000-0000-0000-000000000000",
    date_from: from, date_to: to, completed_at: new Date().toISOString(), duration_ms: generationMs,
    result, status: "completed",
  });
  return result;
}
