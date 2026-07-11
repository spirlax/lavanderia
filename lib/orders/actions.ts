"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  actionFailure,
  FRIENDLY_GENERIC_MESSAGE,
  FRIENDLY_PERMISSION_MESSAGE,
  mapZodFieldErrors,
} from "@/lib/actions/result";
import { canUseOperationalArea } from "@/lib/auth/authorization";
import { requireCurrentProfile } from "@/lib/auth/get-current-profile";
import {
  mapCreateOrderError,
  mapTransitionOrderError,
} from "@/lib/orders/errors";
import {
  assertTransitionAllowed,
  getTransitionSuccessMessage,
} from "@/lib/orders/transitions";
import {
  createOrderSchema,
  toCreateOrderRpcItems,
  transitionOrderSchema,
} from "@/lib/orders/validation";
import { createClient } from "@/lib/supabase/server";
import { readPaymentFormData } from "@/lib/payments/validation";

export type CreateOrderActionResult =
  | {
      success: true;
      message: string;
      orderId: string;
      orderNumber: string;
      reusedExisting: boolean;
    }
  | {
      success: false;
      message: string;
      fieldErrors?: Record<string, string>;
    };

export type TransitionOrderActionResult =
  | {
      success: true;
      message: string;
      orderId: string;
      status: string;
      reusedExisting: boolean;
    }
  | {
      success: false;
      message: string;
      fieldErrors?: Record<string, string>;
    };

function parseItemsFromFormData(formData: FormData) {
  const itemsJson = formData.get("items");
  if (typeof itemsJson !== "string" || !itemsJson.trim()) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(itemsJson);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return null;
  }
}

function readOptionalReason(formData: FormData): string {
  const value = formData.get("reason");
  return typeof value === "string" ? value : "";
}

export async function createOrderAction(
  _prevState: CreateOrderActionResult | undefined,
  formData: FormData,
): Promise<CreateOrderActionResult> {
  const profile = await requireCurrentProfile();

  if (!canUseOperationalArea(profile.role)) {
    return actionFailure(FRIENDLY_PERMISSION_MESSAGE) as CreateOrderActionResult;
  }

  const rawItems = parseItemsFromFormData(formData);
  if (rawItems === null) {
    return {
      success: false,
      message: "No se pudieron leer las líneas del pedido.",
    };
  }

  const parsed = createOrderSchema.safeParse({
    customer_id: formData.get("customer_id"),
    scheduled_for: formData.get("scheduled_for"),
    operation_id: formData.get("operation_id"),
    items: rawItems,
    ...readPaymentFormData(formData),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Revisa los datos del pedido.",
      fieldErrors: mapZodFieldErrors(parsed.error),
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_platform_order", {
    p_customer_id: parsed.data.customer_id,
    p_scheduled_for: parsed.data.scheduled_for,
    p_items: toCreateOrderRpcItems(parsed.data.items),
    p_payment_method: parsed.data.method,
    p_cash_received: parsed.data.cash_received,
    p_payment_reference: parsed.data.reference,
    p_operation_id: parsed.data.operation_id,
  });

  if (error) {
    return {
      success: false,
      message: mapCreateOrderError(error),
    };
  }

  const row = Array.isArray(data) ? data[0] : data;

  if (!row?.order_id || !row.order_number) {
    return {
      success: false,
      message: FRIENDLY_GENERIC_MESSAGE,
    };
  }

  revalidatePath("/");
  revalidatePath("/nuevo");
  revalidatePath("/buscar");
  revalidatePath(`/pedidos/${row.order_id}`);

  redirect(`/pedidos/${row.order_id}`);
}

export async function transitionOrderAction(
  _prevState: TransitionOrderActionResult | undefined,
  formData: FormData,
): Promise<TransitionOrderActionResult> {
  const profile = await requireCurrentProfile();

  if (!canUseOperationalArea(profile.role)) {
    return {
      success: false,
      message: FRIENDLY_PERMISSION_MESSAGE,
    };
  }

  const parsed = transitionOrderSchema.safeParse({
    order_id: formData.get("order_id"),
    to_status: formData.get("to_status"),
    operation_id: formData.get("operation_id"),
    reason: readOptionalReason(formData),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Revisa los datos de la transición.",
      fieldErrors: mapZodFieldErrors(parsed.error),
    };
  }

  const supabase = await createClient();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, status, balance_due, source")
    .eq("id", parsed.data.order_id)
    .maybeSingle();

  if (orderError) {
    return {
      success: false,
      message: FRIENDLY_GENERIC_MESSAGE,
    };
  }

  if (!order) {
    return {
      success: false,
      message: "No encontramos ese pedido.",
    };
  }

  const allowed = assertTransitionAllowed({
    role: profile.role,
    fromStatus: order.status,
    toStatus: parsed.data.to_status,
    balanceDue: Number(order.balance_due),
    reason: parsed.data.reason,
  });

  if (!allowed.ok) {
    return {
      success: false,
      message: allowed.message,
      fieldErrors: allowed.message.includes("motivo")
        ? { reason: allowed.message }
        : undefined,
    };
  }

  const { data, error } = await supabase.rpc("transition_order_status", {
    p_order_id: parsed.data.order_id,
    p_to_status: parsed.data.to_status,
    p_operation_id: parsed.data.operation_id,
    ...(parsed.data.reason ? { p_reason: parsed.data.reason } : {}),
  });

  if (error) {
    return {
      success: false,
      message: mapTransitionOrderError(error),
    };
  }

  const row = Array.isArray(data) ? data[0] : data;

  if (!row?.order_id || !row.status) {
    return {
      success: false,
      message: FRIENDLY_GENERIC_MESSAGE,
    };
  }

  revalidatePath("/");
  revalidatePath("/buscar");
  revalidatePath(`/pedidos/${row.order_id}`);

  return {
    success: true,
    message: row.reused_existing
      ? "La operación ya estaba registrada."
      : getTransitionSuccessMessage(row.status),
    orderId: row.order_id,
    status: row.status,
    reusedExisting: Boolean(row.reused_existing),
  };
}
