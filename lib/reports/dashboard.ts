import "server-only";

import type { OrderStatus } from "@/lib/auth/types";
import {
  getCashSessionByBusinessDate,
  getCashSessionSummary,
  getOpenCashSession,
  type CashSessionSummary,
} from "@/lib/cash/queries";
import {
  limaDateBoundsUtc,
  limaDateOffset,
  limaTodayDate,
  getReferenceInstantMs,
} from "@/lib/orders/datetime";
import { listActiveOrders } from "@/lib/orders/queries";
import { getOrderStatusLabel } from "@/lib/orders/status";
import { createClient } from "@/lib/supabase/server";

export type DashboardDayPoint = {
  date: string;
  label: string;
  revenue: number;
  orders: number;
};

export type DashboardDistributionItem = {
  key: string;
  label: string;
  value: number;
};

export type AdminDashboardData = {
  today: string;
  cash: {
    status: "open" | "closed" | "none";
    summary: CashSessionSummary | null;
    collected: number;
    difference: number | null;
  };
  todayOrdersReceived: number;
  activeOrders: number;
  readyPending: number;
  thesis: {
    compliance: number;
    uncollectedRate: number;
    generationMs: number;
    ordersReceived: number;
    deliveredOrders: number;
    uncollectedOrders: number;
  };
  revenueTrend: DashboardDayPoint[];
  ordersTrend: DashboardDayPoint[];
  methodDistribution: DashboardDistributionItem[];
  statusDistribution: DashboardDistributionItem[];
  alerts: {
    overdueScheduled: number;
    readyPending: number;
    balancePending: number;
    cashDifference: number | null;
  };
};

function money(value: number): number {
  return Math.round(value * 100) / 100;
}

function limaDayLabel(date: string): string {
  const [, month, day] = date.split("-");
  return `${day}/${month}`;
}

function limaCalendarDateFromIso(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(iso));

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";

  return `${get("year")}-${get("month")}-${get("day")}`;
}

/**
 * Agrega métricas de panel sin escribir en `report_runs`
 * (a diferencia de `getAdminReport`).
 */
export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const started = performance.now();
  const today = limaTodayDate();
  const from = limaDateOffset(-6);
  const range = limaDateBoundsUtc(from);
  if (!range) {
    throw new Error("No se pudo calcular el rango del panel.");
  }

  const endExclusive = limaDateBoundsUtc(today);
  if (!endExclusive) {
    throw new Error("No se pudo calcular el día actual del panel.");
  }

  const supabase = await createClient();
  const [openSession, todaySession, activeOrders, ordersResult, paymentsResult] =
    await Promise.all([
      getOpenCashSession(),
      getCashSessionByBusinessDate(today),
      listActiveOrders(),
      supabase
        .from("orders")
        .select("status, created_at, scheduled_for, balance_due")
        .gte("created_at", range.startIso)
        .lt("created_at", endExclusive.endIso),
      supabase
        .from("payments")
        .select("amount, method, status, paid_at")
        .gte("paid_at", range.startIso)
        .lt("paid_at", endExclusive.endIso),
    ]);

  if (ordersResult.error || paymentsResult.error) {
    throw new Error(
      ordersResult.error?.message ??
        paymentsResult.error?.message ??
        "No se pudo cargar el panel.",
    );
  }

  const sessionForSummary = openSession ?? todaySession;
  const cashSummary = sessionForSummary
    ? await getCashSessionSummary(sessionForSummary)
    : null;

  const cashStatus: AdminDashboardData["cash"]["status"] = openSession
    ? "open"
    : todaySession?.status === "closed"
      ? "closed"
      : "none";

  const collected = cashSummary
    ? money(
        Number(cashSummary.totals.cash) +
          Number(cashSummary.totals.yape) +
          Number(cashSummary.totals.plin),
      )
    : 0;

  const difference =
    cashSummary?.session.difference !== null &&
    cashSummary?.session.difference !== undefined
      ? Number(cashSummary.session.difference)
      : null;

  const orders = ordersResult.data ?? [];
  const payments = paymentsResult.data ?? [];

  const dayKeys: string[] = [];
  for (let offset = -6; offset <= 0; offset += 1) {
    dayKeys.push(limaDateOffset(offset));
  }

  const revenueByDay = new Map(dayKeys.map((date) => [date, 0]));
  const ordersByDay = new Map(dayKeys.map((date) => [date, 0]));
  const methodTotals = { cash: 0, yape: 0, plin: 0 };
  const statusTotals: Record<string, number> = {};

  for (const order of orders) {
    const day = limaCalendarDateFromIso(order.created_at);
    if (ordersByDay.has(day)) {
      ordersByDay.set(day, (ordersByDay.get(day) ?? 0) + 1);
    }
    statusTotals[order.status] = (statusTotals[order.status] ?? 0) + 1;
  }

  for (const payment of payments) {
    if (payment.status !== "posted") continue;
    methodTotals[payment.method] += Number(payment.amount);
    const day = limaCalendarDateFromIso(payment.paid_at);
    if (revenueByDay.has(day)) {
      revenueByDay.set(
        day,
        money((revenueByDay.get(day) ?? 0) + Number(payment.amount)),
      );
    }
  }

  const todayOrdersReceived = orders.filter(
    (order) => limaCalendarDateFromIso(order.created_at) === today,
  ).length;

  const readyPending = activeOrders.filter(
    (order) => order.status === "ready",
  ).length;
  const balancePending = activeOrders.filter(
    (order) => Number(order.balance_due) > 0,
  ).length;
  const nowMs = getReferenceInstantMs();
  const overdueScheduled = activeOrders.filter((order) => {
    if (!order.scheduled_for) return false;
    return new Date(order.scheduled_for).getTime() < nowMs;
  }).length;

  const weekDelivered = orders.filter((order) => order.status === "delivered")
    .length;
  const weekUncollected = orders.filter((order) => order.status === "ready")
    .length;
  const weekReceived = orders.length;
  const generationMs = Math.max(0, Math.round(performance.now() - started));

  return {
    today,
    cash: {
      status: cashStatus,
      summary: cashSummary,
      collected,
      difference,
    },
    todayOrdersReceived,
    activeOrders: activeOrders.length,
    readyPending,
    thesis: {
      compliance: weekReceived
        ? money((weekDelivered / weekReceived) * 100)
        : 0,
      uncollectedRate: weekReceived
        ? money((weekUncollected / weekReceived) * 100)
        : 0,
      generationMs,
      ordersReceived: weekReceived,
      deliveredOrders: weekDelivered,
      uncollectedOrders: weekUncollected,
    },
    revenueTrend: dayKeys.map((date) => ({
      date,
      label: limaDayLabel(date),
      revenue: revenueByDay.get(date) ?? 0,
      orders: ordersByDay.get(date) ?? 0,
    })),
    ordersTrend: dayKeys.map((date) => ({
      date,
      label: limaDayLabel(date),
      revenue: revenueByDay.get(date) ?? 0,
      orders: ordersByDay.get(date) ?? 0,
    })),
    methodDistribution: [
      { key: "cash", label: "Efectivo", value: money(methodTotals.cash) },
      { key: "yape", label: "Yape", value: money(methodTotals.yape) },
      { key: "plin", label: "Plin", value: money(methodTotals.plin) },
    ],
    statusDistribution: Object.entries(statusTotals).map(([key, value]) => ({
      key,
      label: getOrderStatusLabel(key as OrderStatus),
      value,
    })),
    alerts: {
      overdueScheduled,
      readyPending,
      balancePending,
      cashDifference: difference,
    },
  };
}
