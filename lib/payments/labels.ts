import type { PaymentMethod } from "@/lib/auth/types";

export function getPaymentMethodLabel(method: PaymentMethod): string {
  if (method === "cash") return "Efectivo";
  if (method === "yape") return "Yape";
  return "Plin";
}

