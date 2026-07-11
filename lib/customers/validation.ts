import { z } from "zod";

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

const optionalPhoneSchema = z
  .string()
  .transform(emptyToNull)
  .refine(
    (value) =>
      value === null ||
      (value.length >= 6 &&
        value.length <= 30 &&
        /^[\d\s+().-]+$/.test(value)),
    {
      message:
        "Ingresa un teléfono válido (solo números y símbolos habituales).",
    },
  );

const optionalEmailSchema = z
  .string()
  .transform(emptyToNull)
  .refine(
    (value) => value === null || z.string().email().safeParse(value).success,
    { message: "Ingresa un correo válido." },
  );

const optionalNotesSchema = z
  .string()
  .transform(emptyToNull)
  .refine((value) => value === null || value.length <= 1000, {
    message: "Las notas no pueden superar 1000 caracteres.",
  });

export const customerCreateSchema = z.object({
  name: z
    .string({ error: "El nombre es obligatorio." })
    .trim()
    .min(1, "El nombre es obligatorio.")
    .max(160, "El nombre no puede superar 160 caracteres."),
  phone: optionalPhoneSchema,
  email: optionalEmailSchema,
  notes: optionalNotesSchema,
});

export const customerUpdateSchema = customerCreateSchema;

export const customerActiveSchema = z.object({
  id: z.string().uuid("Identificador de cliente no válido."),
  is_active: z.boolean(),
});

export type CustomerCreateValues = z.infer<typeof customerCreateSchema>;
export type CustomerUpdateValues = z.infer<typeof customerUpdateSchema>;
