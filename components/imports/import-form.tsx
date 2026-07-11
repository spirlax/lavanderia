"use client";

import { useState, useTransition } from "react";

import { importHistoricalCsvAction, type ImportResult } from "@/lib/imports/actions";

export function ImportForm() {
  const [preview, setPreview] = useState<string[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [pending, startTransition] = useTransition();
  return <form className="space-y-4 rounded border p-4" action={(formData) => startTransition(async () => setResult(await importHistoricalCsvAction(formData)))}>
    <a className="text-sm underline" href="data:text/csv;charset=utf-8,fecha%2Cpedidos_recibidos%2Cpedidos_entregados%2Cpedidos_no_recogidos%2Cingresos%2Ctiempo_reporte_minutos%0A2026-01-01%2C0%2C0%2C0%2C0.00%2C0" download="plantilla-importacion.csv">Descargar plantilla</a>
    <input name="file" type="file" accept=".csv,text/csv" required onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => setPreview(String(reader.result).split(/\r?\n/).slice(0, 4)); reader.readAsText(file); }} />
    {preview.length ? <pre className="overflow-auto rounded bg-zinc-100 p-3 text-xs">{preview.join("\n")}</pre> : null}
    <button className="rounded bg-zinc-900 px-4 py-2 text-white" disabled={pending} type="submit">{pending ? "Importando…" : "Confirmar importación"}</button>
    {result ? <p role="status">{result.message}{result.rows ? ` Filas: ${result.rows}.` : ""}</p> : null}
  </form>;
}
