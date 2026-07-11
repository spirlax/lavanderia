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
import {
  canCreateCustomer,
  canSetCustomerActive,
  canUpdateCustomer,
} from "@/lib/auth/authorization";
import { requireCurrentProfile } from "@/lib/auth/get-current-profile";
import type { ActionResult } from "@/lib/auth/types";
import {
  customerActiveSchema,
  customerCreateSchema,
  customerUpdateSchema,
} from "@/lib/customers/validation";
import { createClient } from "@/lib/supabase/server";

function revalidateCustomerPaths(customerId?: string) {
  revalidatePath("/clientes");
  if (customerId) {
    revalidatePath(`/clientes/${customerId}`);
  }
}

function readBoolean(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "true" || value === "on" || value === "1";
}

function readOptionalString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function createCustomer(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireCurrentProfile();

  if (!canCreateCustomer(profile.role)) {
    return actionFailure(FRIENDLY_PERMISSION_MESSAGE);
  }

  const parsed = customerCreateSchema.safeParse({
    name: formData.get("name"),
    phone: readOptionalString(formData, "phone"),
    email: readOptionalString(formData, "email"),
    notes: readOptionalString(formData, "notes"),
  });

  if (!parsed.success) {
    return actionFailure(
      "Revisa los datos del cliente.",
      mapZodFieldErrors(parsed.error),
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .insert({
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email,
      notes: parsed.data.notes,
      created_by: profile.id,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    if (isPermissionOrRlsError(error)) {
      return actionFailure(FRIENDLY_PERMISSION_MESSAGE);
    }
    return actionFailure(FRIENDLY_GENERIC_MESSAGE);
  }

  if (!data?.id) {
    return actionFailure(FRIENDLY_GENERIC_MESSAGE);
  }

  revalidateCustomerPaths(data.id);
  return {
    success: true,
    message: "Cliente creado correctamente.",
    customerId: data.id,
  };
}

export async function updateCustomer(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireCurrentProfile();

  if (!canUpdateCustomer(profile.role)) {
    return actionFailure(FRIENDLY_PERMISSION_MESSAGE);
  }

  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) {
    return actionFailure("No se encontró el cliente.");
  }

  const parsed = customerUpdateSchema.safeParse({
    name: formData.get("name"),
    phone: readOptionalString(formData, "phone"),
    email: readOptionalString(formData, "email"),
    notes: readOptionalString(formData, "notes"),
  });

  if (!parsed.success) {
    return actionFailure(
      "Revisa los datos del cliente.",
      mapZodFieldErrors(parsed.error),
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .update({
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email,
      notes: parsed.data.notes,
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
    return actionFailure("No se encontró el cliente o no se pudo actualizar.");
  }

  revalidateCustomerPaths(id);
  return actionSuccess("Cliente actualizado correctamente.");
}

export async function setCustomerActive(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const profile = await requireCurrentProfile();

  if (!canSetCustomerActive(profile.role)) {
    return actionFailure(FRIENDLY_PERMISSION_MESSAGE);
  }

  const parsed = customerActiveSchema.safeParse({
    id: formData.get("id"),
    is_active: readBoolean(formData, "is_active"),
  });

  if (!parsed.success) {
    return actionFailure("No se pudo cambiar el estado del cliente.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("set_customer_active", {
    p_customer_id: parsed.data.id,
    p_is_active: parsed.data.is_active,
  });

  if (error) {
    if (isPermissionOrRlsError(error)) {
      return actionFailure(FRIENDLY_PERMISSION_MESSAGE);
    }
    return actionFailure(FRIENDLY_GENERIC_MESSAGE);
  }

  if (!data) {
    return actionFailure("No se encontró el cliente o no se pudo actualizar.");
  }

  revalidateCustomerPaths(parsed.data.id);
  return actionSuccess(
    parsed.data.is_active
      ? "Cliente activado correctamente."
      : "Cliente desactivado correctamente.",
  );
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
