"use server";

import { revalidatePath } from "next/cache";

import {
  actionFailure,
  actionSuccess,
  FRIENDLY_GENERIC_MESSAGE,
  FRIENDLY_PERMISSION_MESSAGE,
  mapZodFieldErrors,
} from "@/lib/actions/result";
import { canAccessAdmin, canUseOperationalArea } from "@/lib/auth/authorization";
import { requireCurrentProfile } from "@/lib/auth/get-current-profile";
import type { ActionResult } from "@/lib/auth/types";
import {
  payBalanceSchema,
  readPaymentFormData,
  voidPaymentSchema,
} from "@/lib/payments/validation";
import { createClient } from "@/lib/supabase/server";

function mapPaymentError(error: { message?: string }): string {
  const message = (error.message ?? "").toLowerCase();
  if (message.includes("only admin") || message.includes("active staff")) {
    return FRIENDLY_PERMISSION_MESSAGE;
  }
  if (message.includes("open cash session")) {
    return "Abre la caja del día antes de registrar o anular pagos.";
  }
  if (message.includes("cash received")) {
    return "El efectivo recibido debe cubrir el saldo completo.";
  }
  if (message.includes("no outstanding balance")) {
    return "El pedido ya no tiene saldo pendiente.";
  }
  if (message.includes("already voided")) {
    return "El pago ya fue anulado.";
  }
  if (message.includes("refund exceeds")) {
    return "La caja abierta no tiene efectivo esperado suficiente para la devolución.";
  }
  return FRIENDLY_GENERIC_MESSAGE;
}

function refreshPaymentPaths(orderId?: string) {
  revalidatePath("/");
  revalidatePath("/buscar");
  revalidatePath("/caja");
  revalidatePath("/admin/caja");
  if (orderId) revalidatePath(`/pedidos/${orderId}`);
}

export async function payOrderBalanceAction(
  _state: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireCurrentProfile();
  if (!canUseOperationalArea(profile.role)) {
    return actionFailure(FRIENDLY_PERMISSION_MESSAGE);
  }

  const parsed = payBalanceSchema.safeParse({
    order_id: formData.get("order_id"),
    operation_id: formData.get("operation_id"),
    ...readPaymentFormData(formData),
  });
  if (!parsed.success) {
    return actionFailure("Revisa los datos del pago.", mapZodFieldErrors(parsed.error));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("pay_order_balance", {
    p_order_id: parsed.data.order_id,
    p_method: parsed.data.method,
    p_cash_received: parsed.data.cash_received,
    p_reference: parsed.data.reference,
    p_operation_id: parsed.data.operation_id,
  });
  if (error) return actionFailure(mapPaymentError(error));
  refreshPaymentPaths(parsed.data.order_id);
  return actionSuccess("Saldo pagado completamente.");
}

export async function voidPaymentAction(
  _state: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireCurrentProfile();
  if (!canAccessAdmin(profile.role)) {
    return actionFailure(FRIENDLY_PERMISSION_MESSAGE);
  }

  const parsed = voidPaymentSchema.safeParse({
    payment_id: formData.get("payment_id"),
    operation_id: formData.get("operation_id"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) {
    return actionFailure("El motivo es obligatorio.", mapZodFieldErrors(parsed.error));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("void_payment", {
    p_payment_id: parsed.data.payment_id,
    p_reason: parsed.data.reason,
    p_operation_id: parsed.data.operation_id,
  });
  if (error) return actionFailure(mapPaymentError(error));
  refreshPaymentPaths(data?.order_id);
  return actionSuccess("Pago anulado y devolución registrada.");
}

