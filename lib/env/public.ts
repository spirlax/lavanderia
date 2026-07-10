import { z } from "zod";

const publicEnvironmentSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .trim()
    .url("NEXT_PUBLIC_SUPABASE_URL debe ser una URL válida."),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .trim()
    .min(1, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY es obligatoria."),
});

export type PublicEnvironment = z.infer<typeof publicEnvironmentSchema>;

export function parsePublicEnvironment(input: unknown): PublicEnvironment {
  const result = publicEnvironmentSchema.safeParse(input);

  if (!result.success) {
    throw new Error(
      "Configuración local de Supabase incompleta. Revisa las variables NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return result.data;
}

export function getPublicEnvironment(): PublicEnvironment {
  return parsePublicEnvironment({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}
