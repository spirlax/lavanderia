import { z } from "zod";

import { Constants } from "@/lib/supabase/database.types";

const serviceUnitSchema = z.enum(Constants.public.Enums.service_unit, {
  error: "Selecciona una unidad válida.",
});

const priceSchema = z
  .union([z.string(), z.number()])
  .transform((value, ctx) => {
    const raw = typeof value === "number" ? String(value) : value.trim();

    if (!raw) {
      ctx.addIssue({
        code: "custom",
        message: "El precio es obligatorio.",
      });
      return z.NEVER;
    }

    if (!/^\d+(\.\d{1,2})?$/.test(raw)) {
      ctx.addIssue({
        code: "custom",
        message: "El precio debe ser un número con máximo dos decimales.",
      });
      return z.NEVER;
    }

    const parsed = Number(raw);

    if (!Number.isFinite(parsed) || parsed < 0) {
      ctx.addIssue({
        code: "custom",
        message: "El precio debe ser mayor o igual a 0.",
      });
      return z.NEVER;
    }

    if (parsed > 9_999_999_999.99) {
      ctx.addIssue({
        code: "custom",
        message: "El precio supera el máximo permitido.",
      });
      return z.NEVER;
    }

    return parsed;
  });

export const serviceFormSchema = z.object({
  name: z
    .string({ error: "El nombre es obligatorio." })
    .trim()
    .min(1, "El nombre es obligatorio.")
    .max(120, "El nombre no puede superar 120 caracteres."),
  unit: serviceUnitSchema,
  current_price: priceSchema,
  is_active: z.boolean(),
});

export const serviceCreateSchema = serviceFormSchema;
export const serviceUpdateSchema = serviceFormSchema;

export const serviceActiveSchema = z.object({
  id: z.string().uuid("Identificador de servicio no válido."),
  is_active: z.boolean(),
});

export type ServiceFormValues = z.infer<typeof serviceFormSchema>;
