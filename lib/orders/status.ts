import type { OrderStatus } from "@/lib/auth/types";

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  received: "Recibido",
  in_process: "En proceso",
  ready: "Listo",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

export const ACTIVE_ORDER_STATUSES = [
  "received",
  "in_process",
  "ready",
] as const satisfies ReadonlyArray<OrderStatus>;

export const ALL_ORDER_STATUSES = [
  "received",
  "in_process",
  "ready",
  "delivered",
  "cancelled",
] as const satisfies ReadonlyArray<OrderStatus>;

export type ActiveOrderStatus = (typeof ACTIVE_ORDER_STATUSES)[number];

export function getOrderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_LABELS[status];
}

export type OrderStatusTone =
  | "info"
  | "process"
  | "success"
  | "muted"
  | "danger";

export function getOrderStatusTone(status: OrderStatus): OrderStatusTone {
  switch (status) {
    case "received":
      return "info";
    case "in_process":
      return "process";
    case "ready":
      return "success";
    case "delivered":
      return "muted";
    case "cancelled":
      return "danger";
  }
}

export function isActiveOrderStatus(
  status: OrderStatus,
): status is ActiveOrderStatus {
  return (ACTIVE_ORDER_STATUSES as ReadonlyArray<OrderStatus>).includes(status);
}

export function isOrderStatus(value: string): value is OrderStatus {
  return (ALL_ORDER_STATUSES as ReadonlyArray<string>).includes(value);
}

export function getOrderStatusOptions(): Array<{
  value: OrderStatus;
  label: string;
}> {
  return ALL_ORDER_STATUSES.map((status) => ({
    value: status,
    label: ORDER_STATUS_LABELS[status],
  }));
}
