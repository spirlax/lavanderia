"use server";

import { revalidatePath } from "next/cache";

import {
  actionFailure,
  actionSuccess,
  FRIENDLY_GENERIC_MESSAGE,
  FRIENDLY_PERMISSION_MESSAGE,
  isPermissionOrRlsError,
  mapZodFieldErrors,
} from "@/lib/actions/result";
import { canManageServices } from "@/lib/auth/authorization";
import { requireCurrentProfile } from "@/lib/auth/get-current-profile";
import type { ActionResult } from "@/lib/auth/types";
import {
  serviceActiveSchema,
  serviceCreateSchema,
  serviceUpdateSchema,
} from "@/lib/services/validation";
import { createClient } from "@/lib/supabase/server";

function revalidateServicePaths() {
  revalidatePath("/admin/servicios");
  revalidatePath("/admin");
}

function readBoolean(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "true" || value === "on" || value === "1";
}

export async function createService(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireCurrentProfile();

  if (!canManageServices(profile.role)) {
    return actionFailure(FRIENDLY_PERMISSION_MESSAGE);
  }

  const parsed = serviceCreateSchema.safeParse({
    name: formData.get("name"),
    unit: formData.get("unit"),
    current_price: formData.get("current_price"),
    is_active: readBoolean(formData, "is_active"),
  });

  if (!parsed.success) {
    return actionFailure(
      "Revisa los datos del servicio.",
      mapZodFieldErrors(parsed.error),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.from("services").insert({
    name: parsed.data.name,
    unit: parsed.data.unit,
    current_price: parsed.data.current_price,
    is_active: parsed.data.is_active,
  });

  if (error) {
    if (isPermissionOrRlsError(error)) {
      return actionFailure(FRIENDLY_PERMISSION_MESSAGE);
    }
    return actionFailure(FRIENDLY_GENERIC_MESSAGE);
  }

  revalidateServicePaths();
  return actionSuccess("Servicio creado correctamente.");
}

export async function updateService(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireCurrentProfile();

  if (!canManageServices(profile.role)) {
    return actionFailure(FRIENDLY_PERMISSION_MESSAGE);
  }

  const id = String(formData.get("id") ?? "");
  if (!zUuid(id)) {
    return actionFailure("No se encontró el servicio.");
  }

  const parsed = serviceUpdateSchema.safeParse({
    name: formData.get("name"),
    unit: formData.get("unit"),
    current_price: formData.get("current_price"),
    is_active: readBoolean(formData, "is_active"),
  });

  if (!parsed.success) {
    return actionFailure(
      "Revisa los datos del servicio.",
      mapZodFieldErrors(parsed.error),
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .update({
      name: parsed.data.name,
      unit: parsed.data.unit,
      current_price: parsed.data.current_price,
      is_active: parsed.data.is_active,
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    if (isPermissionOrRlsError(error)) {
      return actionFailure(FRIENDLY_PERMISSION_MESSAGE);
    }
    return actionFailure(FRIENDLY_GENERIC_MESSAGE);
  }

  if (!data) {
    return actionFailure("No se encontró el servicio o no se pudo actualizar.");
  }

  revalidateServicePaths();
  return actionSuccess("Servicio actualizado correctamente.");
}

export async function setServiceActive(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireCurrentProfile();

  if (!canManageServices(profile.role)) {
    return actionFailure(FRIENDLY_PERMISSION_MESSAGE);
  }

  const parsed = serviceActiveSchema.safeParse({
    id: formData.get("id"),
    is_active: readBoolean(formData, "is_active"),
  });

  if (!parsed.success) {
    return actionFailure("No se pudo cambiar el estado del servicio.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .update({ is_active: parsed.data.is_active })
    .eq("id", parsed.data.id)
    .select("id")
    .maybeSingle();

  if (error) {
    if (isPermissionOrRlsError(error)) {
      return actionFailure(FRIENDLY_PERMISSION_MESSAGE);
    }
    return actionFailure(FRIENDLY_GENERIC_MESSAGE);
  }

  if (!data) {
    return actionFailure("No se encontró el servicio o no se pudo actualizar.");
  }

  revalidateServicePaths();
  return actionSuccess(
    parsed.data.is_active
      ? "Servicio activado correctamente."
      : "Servicio desactivado correctamente.",
  );
}

function zUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
