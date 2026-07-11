import { z } from "zod";

import { Constants } from "@/lib/supabase/database.types";

export const paymentMethodSchema = z.enum(
  Constants.public.Enums.payment_method,
);

const optionalMoneySchema = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((value, ctx) => {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    const raw = String(value).trim();
    if (!/^\d+(\.\d{1,2})?$/.test(raw)) {
      ctx.addIssue({
        code: "custom",
        message: "Ingresa un monto válido con máximo dos decimales.",
      });
      return z.NEVER;
    }
    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount < 0 || amount > 9_999_999_999.99) {
      ctx.addIssue({ code: "custom", message: "El monto no es válido." });
      return z.NEVER;
    }
    return amount;
  });

const referenceSchema = z
  .string()
  .trim()
  .max(80, "La referencia no puede superar 80 caracteres.")
  .transform((value) => value || null);

export const paymentInputSchema = z
  .object({
    method: paymentMethodSchema,
    cash_received: optionalMoneySchema,
    reference: referenceSchema,
  })
  .superRefine((data, ctx) => {
    if (data.method === "cash" && data.cash_received === null) {
      ctx.addIssue({
        code: "custom",
        path: ["cash_received"],
        message: "Ingresa el efectivo recibido.",
      });
    }
    if (data.method !== "cash" && data.cash_received !== null) {
      ctx.addIssue({
        code: "custom",
        path: ["cash_received"],
        message: "Yape y Plin no usan efectivo recibido.",
      });
    }
    if (data.method === "cash" && data.reference !== null) {
      ctx.addIssue({
        code: "custom",
        path: ["reference"],
        message: "El efectivo no usa referencia.",
      });
    }
  });

export const payBalanceSchema = paymentInputSchema.and(
  z.object({
    order_id: z.string().uuid("Pedido no válido."),
    operation_id: z.string().uuid("Operación no válida."),
  }),
);

export const voidPaymentSchema = z.object({
  payment_id: z.string().uuid("Pago no válido."),
  operation_id: z.string().uuid("Operación no válida."),
  reason: z
    .string()
    .trim()
    .min(1, "El motivo es obligatorio.")
    .max(500, "El motivo no puede superar 500 caracteres."),
});

export function readPaymentFormData(formData: FormData) {
  return {
    method: formData.get("payment_method"),
    cash_received: formData.get("cash_received"),
    reference: String(formData.get("payment_reference") ?? ""),
  };
}

