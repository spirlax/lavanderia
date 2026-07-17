"use server";

import { revalidatePath } from "next/cache";

import {
  actionFailure,
  actionSuccess,
  FRIENDLY_GENERIC_MESSAGE,
  FRIENDLY_PERMISSION_MESSAGE,
  mapZodFieldErrors,
} from "@/lib/actions/result";
import { canAccessAdmin, canUseOperationalArea } from "@/lib/auth/authorization";
import { requireCurrentProfile } from "@/lib/auth/get-current-profile";
import type { ActionResult } from "@/lib/auth/types";
import {
  cashPermissionSchema,
  closeCashSessionSchema,
  openCashSessionSchema,
} from "@/lib/cash/validation";
import { createClient } from "@/lib/supabase/server";

function refreshCashPaths() {
  revalidatePath("/caja");
  revalidatePath("/admin/caja");
  revalidatePath("/nuevo");
}

function mapCashError(error: { message?: string }): string {
  const message = (error.message ?? "").toLowerCase();
  if (message.includes("permission") || message.includes("only admin")) {
    return FRIENDLY_PERMISSION_MESSAGE;
  }
  if (message.includes("already exists") || message.includes("already open")) {
    return "Ya existe una caja para la jornada o hay una caja abierta.";
  }
  if (message.includes("responsible operator")) {
    return "La responsable debe ser una empleada activa con permiso de caja.";
  }
  if (message.includes("already closed")) {
    return "La caja ya está cerrada.";
  }
  if (message.includes("cannot revoke")) {
    return "No puedes retirar el permiso a la responsable mientras la caja está abierta.";
  }
  return FRIENDLY_GENERIC_MESSAGE;
}

export async function openCashSessionAction(
  _state: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireCurrentProfile();
  if (
    !canUseOperationalArea(profile.role) ||
    (profile.role === "operator" && !profile.can_manage_cash_session)
  ) {
    return actionFailure(FRIENDLY_PERMISSION_MESSAGE);
  }

  const parsed = openCashSessionSchema.safeParse({
    opening_cash: formData.get("opening_cash"),
    responsible_operator_id:
      profile.role === "operator"
        ? profile.id
        : formData.get("responsible_operator_id"),
    operation_id: formData.get("operation_id"),
  });
  if (!parsed.success) {
    return actionFailure("Revisa los datos de apertura.", mapZodFieldErrors(parsed.error));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("open_cash_session", {
    p_opening_cash: parsed.data.opening_cash,
    p_responsible_operator_id: parsed.data.responsible_operator_id,
    p_operation_id: parsed.data.operation_id,
  });
  if (error) return actionFailure(mapCashError(error));
  refreshCashPaths();
  return actionSuccess("Caja abierta correctamente.");
}

export async function closeCashSessionAction(
  _state: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireCurrentProfile();
  if (!canUseOperationalArea(profile.role)) {
    return actionFailure(FRIENDLY_PERMISSION_MESSAGE);
  }

  const parsed = closeCashSessionSchema.safeParse({
    cash_session_id: formData.get("cash_session_id"),
    counted_cash: formData.get("counted_cash"),
    closing_notes: String(formData.get("closing_notes") ?? ""),
    operation_id: formData.get("operation_id"),
  });
  if (!parsed.success) {
    return actionFailure("Revisa los datos de cierre.", mapZodFieldErrors(parsed.error));
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("close_cash_session", {
    p_cash_session_id: parsed.data.cash_session_id,
    p_counted_cash: parsed.data.counted_cash,
    p_closing_notes: parsed.data.closing_notes ?? "",
    p_operation_id: parsed.data.operation_id,
  });
  if (error) return actionFailure(mapCashError(error));
  refreshCashPaths();
  return actionSuccess("Caja cerrada correctamente.");
}

export async function setCashManagerPermissionAction(
  _state: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireCurrentProfile();
  if (!canAccessAdmin(profile.role)) {
    return actionFailure(FRIENDLY_PERMISSION_MESSAGE);
  }

  const parsed = cashPermissionSchema.safeParse({
    profile_id: formData.get("profile_id"),
    can_manage: ["true", "1", "on"].includes(String(formData.get("can_manage"))),
  });
  if (!parsed.success) return actionFailure("No se pudo actualizar el permiso.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_cash_manager_permission", {
    p_profile_id: parsed.data.profile_id,
    p_can_manage: parsed.data.can_manage,
  });
  if (error) return actionFailure(mapCashError(error));
  refreshCashPaths();
  return actionSuccess("Permiso de caja actualizado.");
}

