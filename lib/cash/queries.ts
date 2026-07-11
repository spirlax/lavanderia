import "server-only";

import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type CashSessionRow = Tables<"cash_sessions">;
export type PaymentRow = Tables<"payments">;

export type CashSessionSummary = {
  session: CashSessionRow;
  responsibleName: string;
  totals: Record<"cash" | "yape" | "plin", number>;
  paymentsByOperator: Array<{ id: string; name: string; amount: number; count: number }>;
  voidedPayments: Array<PaymentRow & { actorName: string }>;
};

export type CashOperator = Pick<
  Tables<"profiles">,
  "id" | "full_name" | "can_manage_cash_session" | "is_active"
>;

export async function getOpenCashSession(): Promise<CashSessionRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cash_sessions")
    .select("*")
    .eq("status", "open")
    .maybeSingle();
  if (error) throw new Error("No se pudo consultar la caja del día.");
  return data;
}

export async function listCashOperators(): Promise<CashOperator[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, can_manage_cash_session, is_active")
    .eq("role", "operator")
    .order("full_name");
  if (error) throw new Error("No se pudieron cargar las operadoras.");
  return data ?? [];
}

export async function listCashSessions(limit = 30): Promise<CashSessionRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cash_sessions")
    .select("*")
    .order("business_date", { ascending: false })
    .limit(limit);
  if (error) throw new Error("No se pudieron cargar las jornadas de caja.");
  return data ?? [];
}

export async function getCashSessionByBusinessDate(
  businessDate: string,
): Promise<CashSessionRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cash_sessions")
    .select("*")
    .eq("business_date", businessDate)
    .maybeSingle();
  if (error) throw new Error("No se pudo consultar la jornada de caja.");
  return data;
}

export async function getCashSessionSummary(
  session: CashSessionRow,
): Promise<CashSessionSummary> {
  const supabase = await createClient();
  const [{ data: payments, error: paymentsError }, { data: profiles, error: profilesError }] =
    await Promise.all([
      supabase
        .from("payments")
        .select("*")
        .or(`cash_session_id.eq.${session.id},void_cash_session_id.eq.${session.id}`)
        .order("paid_at", { ascending: true }),
      supabase
        .from("profiles")
        .select("id, full_name")
        .in("role", ["admin", "operator"]),
    ]);

  if (paymentsError || profilesError) {
    throw new Error("No se pudo calcular el resumen de caja.");
  }

  const names = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name]));
  const totals = { cash: 0, yape: 0, plin: 0 };
  const byOperator = new Map<string, { amount: number; count: number }>();

  for (const payment of payments ?? []) {
    if (payment.cash_session_id !== session.id || payment.status !== "posted") continue;
    totals[payment.method] += payment.amount;
    const current = byOperator.get(payment.created_by) ?? { amount: 0, count: 0 };
    current.amount += payment.amount;
    current.count += 1;
    byOperator.set(payment.created_by, current);
  }

  return {
    session,
    responsibleName: names.get(session.responsible_operator_id) ?? "Operadora",
    totals,
    paymentsByOperator: [...byOperator].map(([id, value]) => ({
      id,
      name: names.get(id) ?? "Operadora",
      ...value,
    })),
    voidedPayments: (payments ?? [])
      .filter(
        (payment) =>
          payment.status === "voided" && payment.void_cash_session_id === session.id,
      )
      .map((payment) => ({
        ...payment,
        actorName: names.get(payment.voided_by ?? "") ?? "Administrador",
      })),
  };
}

