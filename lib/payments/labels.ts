import type { PaymentMethod } from "@/lib/auth/types";

export const PAYMENT_METHODS = ["cash", "yape", "plin"] as const satisfies ReadonlyArray<PaymentMethod>;

export function getPaymentMethodLabel(method: PaymentMethod): string {
  if (method === "cash") return "Efectivo";
  if (method === "yape") return "Yape";
  return "Plin";
}

export function getPaymentMethodOptions(): Array<{
  value: PaymentMethod;
  label: string;
}> {
  return PAYMENT_METHODS.map((method) => ({
    value: method,
    label: getPaymentMethodLabel(method),
  }));
}

