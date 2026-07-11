import { z } from "zod";

export const loginSchema = z.object({
  email: z.string({ error: "El correo es obligatorio." }).trim().min(1, "El correo es obligatorio.").email("Ingresa un correo válido."),
  password: z.string({ error: "La contraseña es obligatoria." }).min(1, "La contraseña es obligatoria.").max(256, "La contraseña es demasiado larga."),
});
