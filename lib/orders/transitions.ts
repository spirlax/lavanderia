import type { OrderStatus, Role } from "@/lib/auth/types";
import { getOrderStatusLabel } from "@/lib/orders/status";

export type TransitionTone = "primary" | "secondary" | "danger";

export type AvailableTransition = {
  toStatus: OrderStatus;
  label: string;
  confirmLabel: string;
  description: string;
  requiresReason: boolean;
  tone: TransitionTone;
};

export function listAvailableTransitions(
  role: Role,
  status: OrderStatus,
  balanceDue: number,
): AvailableTransition[] {
  if (status === "delivered" || status === "cancelled") {
    return [];
  }

  const actions: AvailableTransition[] = [];

  if (status === "received") {
    if (balanceDue <= 0) {
      actions.push({
        toStatus: "in_process",
        label: "Iniciar preparación",
        confirmLabel: "Iniciar",
        description: "El pedido pasará a En proceso.",
        requiresReason: false,
        tone: "primary",
      });
    }
  }

  if (status === "in_process") {
    actions.push({
      toStatus: "ready",
      label: "Marcar listo",
      confirmLabel: "Marcar listo",
      description: "El pedido quedará listo para entrega.",
      requiresReason: false,
      tone: "primary",
    });
  }

  if (status === "ready") {
    if (balanceDue <= 0) {
      actions.push({
        toStatus: "delivered",
        label: "Entregar",
        confirmLabel: "Entregar",
        description: "Confirma la entrega del pedido al cliente.",
        requiresReason: false,
        tone: "primary",
      });
    }

    if (role === "admin") {
      actions.push({
        toStatus: "in_process",
        label: "Reprocesar",
        confirmLabel: "Reprocesar",
        description:
          "El pedido volverá a En proceso. Indica el motivo del reproceso.",
        requiresReason: true,
        tone: "secondary",
      });
    }
  }

  if (
    role === "admin" &&
    (status === "received" || status === "in_process" || status === "ready")
  ) {
    actions.push({
      toStatus: "cancelled",
      label: "Cancelar pedido",
      confirmLabel: "Cancelar pedido",
      description: "Esta acción es definitiva. Indica el motivo de la cancelación.",
      requiresReason: true,
      tone: "danger",
    });
  }

  return actions;
}

export function assertTransitionAllowed(input: {
  role: Role;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  balanceDue: number;
  reason: string | null;
}): { ok: true } | { ok: false; message: string } {
  const { role, fromStatus, toStatus, balanceDue, reason } = input;
  const hasReason = Boolean(reason?.trim());

  if (fromStatus === "delivered" || fromStatus === "cancelled") {
    return {
      ok: false,
      message: "Este pedido ya está cerrado y no admite cambios de estado.",
    };
  }

  if (fromStatus === toStatus) {
    return {
      ok: false,
      message: "El pedido ya está en ese estado.",
    };
  }

  const allowed = listAvailableTransitions(role, fromStatus, balanceDue).some(
    (action) =>
      action.toStatus === toStatus &&
      (!action.requiresReason || hasReason),
  );

  if (!allowed) {
    const needsReason = listAvailableTransitions(
      role,
      fromStatus,
      balanceDue,
    ).find((action) => action.toStatus === toStatus && action.requiresReason);

    if (needsReason && !hasReason) {
      return {
        ok: false,
        message: "Indica un motivo para continuar.",
      };
    }

    if (
      balanceDue > 0 &&
      ((fromStatus === "ready" && toStatus === "delivered") ||
        (fromStatus === "received" && toStatus === "in_process"))
    ) {
      return {
        ok: false,
        message: "El pedido debe pagarse completamente antes de continuar.",
      };
    }

    return {
      ok: false,
      message: `No puedes pasar de ${getOrderStatusLabel(fromStatus)} a ${getOrderStatusLabel(toStatus)}.`,
    };
  }

  return { ok: true };
}

export function getTransitionSuccessMessage(toStatus: OrderStatus): string {
  switch (toStatus) {
    case "in_process":
      return "Pedido en proceso.";
    case "ready":
      return "Pedido marcado como listo.";
    case "delivered":
      return "Pedido entregado.";
    case "cancelled":
      return "Pedido cancelado.";
    default:
      return "Estado actualizado.";
  }
}
