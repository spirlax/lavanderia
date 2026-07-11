import { z } from "zod";

const moneySchema = z
  .union([z.string(), z.number()])
  .transform((value, ctx) => {
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

export const openCashSessionSchema = z.object({
  opening_cash: moneySchema,
  responsible_operator_id: z.string().uuid("Selecciona una responsable válida."),
  operation_id: z.string().uuid("Operación no válida."),
});

export const closeCashSessionSchema = z.object({
  cash_session_id: z.string().uuid("Caja no válida."),
  counted_cash: moneySchema,
  closing_notes: z
    .string()
    .trim()
    .max(500, "Las notas no pueden superar 500 caracteres.")
    .transform((value) => value || null),
  operation_id: z.string().uuid("Operación no válida."),
});

export const cashPermissionSchema = z.object({
  profile_id: z.string().uuid("Perfil no válido."),
  can_manage: z.boolean(),
});

