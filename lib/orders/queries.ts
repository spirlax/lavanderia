import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { limaDateBoundsUtc } from "@/lib/orders/datetime";
import { ACTIVE_ORDER_STATUSES } from "@/lib/orders/status";
import type { SearchOrdersInput } from "@/lib/orders/validation";

export type OrderRow = Tables<"orders">;
export type OrderItemRow = Tables<"order_items">;
export type OrderStatusHistoryRow = Tables<"order_status_history">;
export type CustomerRow = Tables<"customers">;
export type ServiceCatalogRow = Pick<
  Tables<"services">,
  "id" | "name" | "unit" | "current_price" | "is_active"
>;

export type ActiveOrderListItem = {
  id: string;
  order_number: string;
  status: OrderRow["status"];
  scheduled_for: string | null;
  total: number;
  balance_due: number;
  created_at: string;
  customer: {
    id: string;
    name: string;
    phone: string | null;
  } | null;
};

export type OrderDetail = {
  order: OrderRow;
  customer: Pick<
    CustomerRow,
    "id" | "name" | "phone" | "email" | "is_active"
  > | null;
  items: OrderItemRow[];
  history: Array<
    OrderStatusHistoryRow & {
      actor_name: string | null;
    }
  >;
};

const ACTIVE_ORDERS_LIMIT = 50;
const SEARCH_ORDERS_LIMIT = 40;

export type SearchOrderListItem = ActiveOrderListItem & {
  received_at: string | null;
};

function sanitizeSearchTerm(value: string): string {
  return value
    .replace(/[%_,.()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function mapOrderListRow(row: {
  id: string;
  order_number: string;
  status: OrderRow["status"];
  scheduled_for: string | null;
  total: number;
  balance_due: number;
  created_at: string;
  received_at?: string | null;
  customer:
    | { id: string; name: string; phone: string | null }
    | Array<{ id: string; name: string; phone: string | null }>
    | null;
}): ActiveOrderListItem & { received_at?: string | null } {
  const customerRaw = row.customer;
  const customer = Array.isArray(customerRaw)
    ? (customerRaw[0] ?? null)
    : customerRaw;

  return {
    id: row.id,
    order_number: row.order_number,
    status: row.status,
    scheduled_for: row.scheduled_for,
    total: row.total,
    balance_due: row.balance_due,
    created_at: row.created_at,
    received_at: row.received_at,
    customer: customer
      ? {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
        }
      : null,
  };
}

export async function listActiveOrders(): Promise<ActiveOrderListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      order_number,
      status,
      scheduled_for,
      total,
      balance_due,
      created_at,
      customer:customers!orders_customer_id_fkey (
        id,
        name,
        phone
      )
    `,
    )
    .in("status", [...ACTIVE_ORDER_STATUSES])
    .order("scheduled_for", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true })
    .limit(ACTIVE_ORDERS_LIMIT);

  if (error) {
    throw new Error("No se pudieron cargar los pedidos activos.");
  }

  return (data ?? []).map((row) => {
    const mapped = mapOrderListRow(row);
    return {
      id: mapped.id,
      order_number: mapped.order_number,
      status: mapped.status,
      scheduled_for: mapped.scheduled_for,
      total: mapped.total,
      balance_due: mapped.balance_due,
      created_at: mapped.created_at,
      customer: mapped.customer,
    };
  });
}

export async function searchOrders(
  filters: SearchOrdersInput,
): Promise<SearchOrderListItem[]> {
  const hasCriteria = Boolean(filters.q || filters.status || filters.date);
  if (!hasCriteria) {
    return [];
  }

  const supabase = await createClient();
  let request = supabase
    .from("orders")
    .select(
      `
      id,
      order_number,
      status,
      scheduled_for,
      total,
      balance_due,
      created_at,
      received_at,
      customer:customers!orders_customer_id_fkey (
        id,
        name,
        phone
      )
    `,
    )
    .order("received_at", { ascending: false })
    .limit(SEARCH_ORDERS_LIMIT);

  if (filters.status) {
    request = request.eq("status", filters.status);
  }

  if (filters.date) {
    const bounds = limaDateBoundsUtc(filters.date);
    if (!bounds) {
      return [];
    }
    request = request
      .gte("received_at", bounds.startIso)
      .lt("received_at", bounds.endIso);
  }

  if (filters.q) {
    const safe = sanitizeSearchTerm(filters.q);
    if (!safe) {
      return [];
    }

    const { data: customers, error: customersError } = await supabase
      .from("customers")
      .select("id")
      .or(`name.ilike.%${safe}%,phone.ilike.%${safe}%`)
      .limit(80);

    if (customersError) {
      throw new Error("No se pudo buscar pedidos.");
    }

    const customerIds = (customers ?? []).map((customer) => customer.id);
    const orParts = [`order_number.ilike.%${safe}%`];
    if (customerIds.length > 0) {
      orParts.push(`customer_id.in.(${customerIds.join(",")})`);
    }
    request = request.or(orParts.join(","));
  }

  const { data, error } = await request;

  if (error) {
    throw new Error("No se pudo buscar pedidos.");
  }

  return (data ?? []).map((row) => {
    const mapped = mapOrderListRow(row);
    return {
      ...mapped,
      received_at: row.received_at,
    };
  });
}

export async function getOrderDetail(
  orderId: string,
): Promise<OrderDetail | null> {
  const supabase = await createClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      `
      id,
      customer_id,
      order_number,
      status,
      source,
      scheduled_for,
      received_at,
      ready_at,
      delivered_at,
      cancelled_at,
      subtotal,
      discount,
      total,
      amount_paid,
      balance_due,
      created_by,
      created_at,
      updated_at,
      cancel_reason,
      delivery_with_balance_authorized_by,
      delivery_with_balance_reason,
      customer:customers!orders_customer_id_fkey (
        id,
        name,
        phone,
        email,
        is_active
      )
    `,
    )
    .eq("id", orderId)
    .maybeSingle();

  if (orderError) {
    throw new Error("No se pudo cargar el pedido.");
  }

  if (!order) {
    return null;
  }

  const [{ data: items, error: itemsError }, { data: history, error: historyError }] =
    await Promise.all([
      supabase
        .from("order_items")
        .select(
          "id, order_id, service_id, service_name_snapshot, unit_snapshot, quantity, unit_price, line_total, created_at",
        )
        .eq("order_id", orderId)
        .order("created_at", { ascending: true }),
      supabase
        .from("order_status_history")
        .select(
          "id, order_id, from_status, to_status, changed_by, actor_role_snapshot, changed_at, reason, operation_id",
        )
        .eq("order_id", orderId)
        .order("changed_at", { ascending: true }),
    ]);

  if (itemsError || historyError) {
    throw new Error("No se pudo cargar el detalle del pedido.");
  }

  const actorIds = [
    ...new Set((history ?? []).map((entry) => entry.changed_by)),
  ];

  const actorNames = new Map<string, string>();
  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", actorIds);

    for (const profile of profiles ?? []) {
      actorNames.set(profile.id, profile.full_name);
    }
  }

  const customerRaw = order.customer;
  const customer = Array.isArray(customerRaw)
    ? (customerRaw[0] ?? null)
    : customerRaw;

  const orderFields = { ...order };
  delete (orderFields as { customer?: unknown }).customer;

  return {
    order: orderFields as OrderRow,
    customer,
    items: items ?? [],
    history: (history ?? []).map((entry) => ({
      ...entry,
      actor_name: actorNames.get(entry.changed_by) ?? null,
    })),
  };
}

export async function listActiveServicesForOrder(): Promise<ServiceCatalogRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("services")
    .select("id, name, unit, current_price, is_active")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw new Error("No se pudieron cargar los servicios.");
  }

  return data ?? [];
}

export async function listActiveCustomersForOrder(
  query?: string,
): Promise<
  Array<Pick<CustomerRow, "id" | "name" | "phone" | "email" | "is_active">>
> {
  const supabase = await createClient();
  let request = supabase
    .from("customers")
    .select("id, name, phone, email, is_active")
    .eq("is_active", true)
    .order("name", { ascending: true })
    .limit(50);

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
