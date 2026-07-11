import type { ActionResult } from "@/lib/auth/types";

export function actionSuccess(message: string): ActionResult {
  return { success: true, message };
}

export function actionFailure(
  message: string,
  fieldErrors?: Record<string, string>,
): ActionResult {
  return fieldErrors
    ? { success: false, message, fieldErrors }
    : { success: false, message };
}

export function mapZodFieldErrors(
  error: {
    flatten: () => {
      fieldErrors: Record<string, string[] | undefined>;
    };
  },
): Record<string, string> {
  const flattened = error.flatten().fieldErrors;
  const result: Record<string, string> = {};

  for (const [key, messages] of Object.entries(flattened)) {
    const first = messages?.[0];
    if (first) {
      result[key] = first;
    }
  }

  return result;
}

export function isPermissionOrRlsError(error: {
  code?: string;
  message?: string;
}): boolean {
  const code = error.code ?? "";
  const message = (error.message ?? "").toLowerCase();

  return (
    code === "42501" ||
    code === "PGRST301" ||
    message.includes("row-level security") ||
    message.includes("permission denied") ||
    message.includes("violates row-level security")
  );
}

export const FRIENDLY_PERMISSION_MESSAGE =
  "No tienes permiso para realizar esta acción.";

export const FRIENDLY_GENERIC_MESSAGE =
  "No se pudo completar la operación. Inténtalo de nuevo.";
