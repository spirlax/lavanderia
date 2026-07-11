import { z } from "zod";

import { Constants } from "@/lib/supabase/database.types";
import { limaDateTimeLocalToTimestamptz } from "@/lib/orders/datetime";
import { paymentInputSchema } from "@/lib/payments/validation";

const orderStatusSchema = z.enum(Constants.public.Enums.order_status);

const quantitySchema = z
  .union([z.string(), z.number()])
  .transform((value, ctx) => {
    const raw = typeof value === "number" ? String(value) : value.trim();

    if (!raw) {
      ctx.addIssue({
        code: "custom",
        message: "La cantidad es obligatoria.",
      });
      return z.NEVER;
    }

    if (!/^\d+(\.\d{1,3})?$/.test(raw)) {
      ctx.addIssue({
        code: "custom",
        message: "La cantidad debe ser un número positivo con máximo tres decimales.",
      });
      return z.NEVER;
    }

    const parsed = Number(raw);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      ctx.addIssue({
        code: "custom",
        message: "La cantidad debe ser mayor que cero.",
      });
      return z.NEVER;
    }

    if (parsed > 999_999_999.999) {
      ctx.addIssue({
        code: "custom",
        message: "La cantidad supera el máximo permitido.",
      });
      return z.NEVER;
    }

    return parsed;
  });

const orderItemSchema = z.object({
  service_id: z.string().uuid("Selecciona un servicio válido."),
  quantity: quantitySchema,
});

export const createOrderSchema = z
  .object({
    customer_id: z.string().uuid("Selecciona un cliente válido."),
    scheduled_for: z
      .string({ error: "La fecha programada es obligatoria." })
      .trim()
      .min(1, "La fecha programada es obligatoria.")
      .transform((value, ctx) => {
        const iso = limaDateTimeLocalToTimestamptz(value);
        if (!iso) {
          ctx.addIssue({
            code: "custom",
            message: "Ingresa una fecha y hora válidas.",
          });
          return z.NEVER;
        }
        return iso;
      }),
    operation_id: z.string().uuid("Identificador de operación no válido."),
    items: z
      .array(orderItemSchema)
      .min(1, "Agrega al menos un servicio.")
      .max(100, "El pedido no puede tener más de 100 líneas."),
  })
  .superRefine((data, ctx) => {
    const seen = new Set<string>();
    for (const [index, item] of data.items.entries()) {
      if (seen.has(item.service_id)) {
        ctx.addIssue({
          code: "custom",
          message: "No puedes repetir el mismo servicio en el pedido.",
          path: ["items", index, "service_id"],
        });
      }
      seen.add(item.service_id);
    }
  })
  .and(paymentInputSchema);

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export type CreateOrderRpcItem = {
  service_id: string;
  quantity: number;
};

export function toCreateOrderRpcItems(
  items: CreateOrderInput["items"],
): CreateOrderRpcItem[] {
  return items.map((item) => ({
    service_id: item.service_id,
    quantity: item.quantity,
  }));
}

export const transitionOrderSchema = z.object({
  order_id: z.string().uuid("Pedido no válido."),
  to_status: orderStatusSchema,
  operation_id: z.string().uuid("Identificador de operación no válido."),
  reason: z
    .string()
    .trim()
    .max(500, "El motivo no puede superar 500 caracteres.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
});

export type TransitionOrderInput = z.infer<typeof transitionOrderSchema>;

export const searchOrdersSchema = z.object({
  q: z
    .string()
    .trim()
    .max(80, "La búsqueda es demasiado larga.")
    .optional()
    .transform((value) => value || undefined),
  status: z
    .union([orderStatusSchema, z.literal("")])
    .optional()
    .transform((value) => (value === "" || value === undefined ? undefined : value)),
  date: z
    .string()
    .trim()
    .optional()
    .transform((value, ctx) => {
      if (!value) {
        return undefined;
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        ctx.addIssue({
          code: "custom",
          message: "Fecha no válida.",
        });
        return z.NEVER;
      }
      return value;
    }),
});

export type SearchOrdersInput = z.infer<typeof searchOrdersSchema>;
