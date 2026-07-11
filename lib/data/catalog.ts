import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type ServiceRow = Tables<"services">;
export type CustomerRow = Tables<"customers">;

export async function listServices(): Promise<ServiceRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select(
      "id, name, unit, current_price, is_active, created_at, updated_at",
    )
    .order("name", { ascending: true });

  if (error) {
    throw new Error("No se pudieron cargar los servicios.");
  }

  return data ?? [];
}

export async function getServiceById(
  id: string,
): Promise<ServiceRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select(
      "id, name, unit, current_price, is_active, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error("No se pudo cargar el servicio.");
  }

  return data;
}

export async function listCustomers(query?: string): Promise<CustomerRow[]> {
  const supabase = await createClient();
  let request = supabase
    .from("customers")
    .select(
      "id, name, phone, email, notes, is_active, created_by, created_at, updated_at",
    )
    .order("name", { ascending: true })
    .limit(100);

  const trimmed = query?.trim();
  if (trimmed) {
    const safe = trimmed
      .replace(/[%_,.()]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80);

    if (safe) {
      request = request.or(`name.ilike.%${safe}%,phone.ilike.%${safe}%`);
    }
  }

  const { data, error } = await request;

  if (error) {
    throw new Error("No se pudieron cargar los clientes.");
  }

  return data ?? [];
}

export async function getCustomerById(
  id: string,
): Promise<CustomerRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select(
      "id, name, phone, email, notes, is_active, created_by, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error("No se pudo cargar el cliente.");
  }

  return data;
}
