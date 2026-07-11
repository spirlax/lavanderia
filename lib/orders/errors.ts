import {
  FRIENDLY_GENERIC_MESSAGE,
  FRIENDLY_PERMISSION_MESSAGE,
  isPermissionOrRlsError,
} from "@/lib/actions/result";

export function mapCreateOrderError(error: {
  code?: string;
  message?: string;
}): string {
  const message = (error.message ?? "").toLowerCase();

  if (
    isPermissionOrRlsError(error) ||
    message.includes("authentication required")
  ) {
    return FRIENDLY_PERMISSION_MESSAGE;
  }

  if (message.includes("active staff profile required")) {
    return "Tu perfil no está habilitado para crear pedidos.";
  }

  if (message.includes("active customer required")) {
    return "El cliente no existe o no está activo.";
  }

  if (message.includes("inactive or missing service")) {
    return "Uno de los servicios no existe o no está activo.";
  }

  if (message.includes("duplicates service_id")) {
    return "No puedes repetir el mismo servicio en el pedido.";
  }

  if (
    message.includes("already used by a different operation") ||
    message.includes("already used by a different")
  ) {
    return "Esta operación ya fue registrada por otro usuario. Recarga e inténtalo de nuevo.";
  }

  if (
    message.includes("quantity must be greater than zero") ||
    message.includes("quantity must be a positive") ||
    message.includes("quantity is required") ||
    message.includes("quantity exceeds")
  ) {
    return "Revisa las cantidades: deben ser mayores que cero.";
  }

  if (message.includes("at least one order item")) {
    return "Agrega al menos un servicio al pedido.";
  }

  if (message.includes("at most 100 line items")) {
    return "El pedido no puede tener más de 100 líneas.";
  }

  if (message.includes("may contain only service_id and quantity")) {
    return "Los datos del pedido no son válidos.";
  }

  return FRIENDLY_GENERIC_MESSAGE;
}

export function mapTransitionOrderError(error: {
  code?: string;
  message?: string;
}): string {
  const message = (error.message ?? "").toLowerCase();

  if (
    isPermissionOrRlsError(error) ||
    message.includes("authentication required")
  ) {
    return FRIENDLY_PERMISSION_MESSAGE;
  }

  if (message.includes("active staff profile required")) {
    return "Tu perfil no está habilitado para cambiar el estado del pedido.";
  }

  if (message.includes("order not found")) {
    return "No encontramos ese pedido.";
  }

  if (message.includes("only platform orders")) {
    return "Solo se pueden gestionar pedidos de la plataforma.";
  }

  if (message.includes("terminal order status cannot be changed")) {
    return "Este pedido ya está cerrado y no admite cambios de estado.";
  }

  if (message.includes("transition to the same status is not allowed")) {
    return "El pedido ya está en ese estado.";
  }

  if (
    message.includes("operator cannot deliver an order with outstanding balance")
  ) {
    return "No puedes entregar un pedido con saldo pendiente. Solicita apoyo a un administrador.";
  }

  if (message.includes("delivery with outstanding balance requires a reason")) {
    return "Indica un motivo para entregar con saldo pendiente.";
  }

  if (message.includes("only admin can return a ready order to in_process")) {
    return "Solo un administrador puede reprocesar un pedido listo.";
  }

  if (message.includes("reprocess requires a reason")) {
    return "Indica un motivo para el reproceso.";
  }

  if (message.includes("only admin can cancel an order")) {
    return "Solo un administrador puede cancelar pedidos.";
  }

  if (message.includes("cancellation requires a reason")) {
    return "Indica un motivo para cancelar el pedido.";
  }

  if (message.includes("transition from") && message.includes("is not allowed")) {
    return "Esa transición de estado no está permitida.";
  }

  if (
    message.includes("already used by a different operation") ||
    message.includes("already used by a different")
  ) {
    return "Esta operación ya fue registrada por otro usuario. Recarga e inténtalo de nuevo.";
  }

  return FRIENDLY_GENERIC_MESSAGE;
}
