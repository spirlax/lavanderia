"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

const HEADERS = ["fecha", "pedidos_recibidos", "pedidos_entregados", "pedidos_no_recogidos", "ingresos", "tiempo_reporte_minutos"];

export type ImportResult = { success: boolean; message: string; rows?: number };

export async function importHistoricalCsvAction(formData: FormData): Promise<ImportResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0 || file.size > 5_000_000) return { success: false, message: "Sube un CSV de hasta 5 MB." };
  const text = await file.text();
  const lines = text.replace(/^\uFEFF/, "").trim().split(/\r?\n/).filter(Boolean);
  const headers = lines.shift()?.split(",").map((value) => value.trim());
  if (!headers || headers.length !== HEADERS.length || headers.some((value, index) => value !== HEADERS[index])) return { success: false, message: "Los encabezados no coinciden con la plantilla." };
  const rows: Array<{ business_date: string; orders_received: number; orders_delivered: number; orders_uncollected: number; revenue: number; report_time_minutes: number }> = [];
  for (const [index, line] of lines.entries()) {
    const values = line.split(",").map((value) => value.trim());
    if (values.length !== HEADERS.length) return { success: false, message: `Fila ${index + 2} inválida.` };
    const [business_date, received, delivered, uncollected, revenue, minutes] = values;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(business_date) || [received, delivered, uncollected, revenue, minutes].some((value) => value === "" || !Number.isFinite(Number(value)) || Number(value) < 0)) return { success: false, message: `Fila ${index + 2} contiene valores inválidos.` };
    rows.push({ business_date, orders_received: Number(received), orders_delivered: Number(delivered), orders_uncollected: Number(uncollected), revenue: Number(revenue), report_time_minutes: Number(minutes) });
  }
  if (!rows.length) return { success: false, message: "El CSV no contiene filas." };
  const supabase = await createClient();
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return { success: false, message: "Sesión requerida." };
  const hash = createHash("sha256").update(Buffer.from(await file.arrayBuffer())).digest("hex");
  const existing = await supabase.from("import_batches").select("id").eq("file_hash", hash).maybeSingle();
  if (existing.data) return { success: false, message: "Este archivo ya fue importado." };
  const batch = await supabase.from("import_batches").insert({ file_name: file.name, file_hash: hash, imported_by: user.id, row_count: rows.length, status: "completed", error_count: 0 }).select("id").single();
  if (batch.error || !batch.data) return { success: false, message: batch.error?.message ?? "No se pudo crear el lote." };
  const summaries = await supabase.from("historical_summaries").insert(rows.map((row) => ({ ...row, import_batch_id: batch.data.id })));
  if (summaries.error) return { success: false, message: summaries.error.message };
  revalidatePath("/admin/importaciones");
  return { success: true, message: "Importación completada.", rows: rows.length };
}
