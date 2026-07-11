"use client";

import { useState, useTransition } from "react";

import styles from "@/components/ui/ui.module.css";
import {
  importHistoricalCsvAction,
  type ImportResult,
} from "@/lib/imports/actions";

const TEMPLATE_HREF =
  "data:text/csv;charset=utf-8,fecha%2Cpedidos_recibidos%2Cpedidos_entregados%2Cpedidos_no_recogidos%2Cingresos%2Ctiempo_reporte_minutos%0A2026-01-01%2C0%2C0%2C0%2C0.00%2C0";

export function ImportForm() {
  const [preview, setPreview] = useState<string[]>([]);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className={`${styles.panel} ${styles.panelStack}`}
      action={(formData) =>
        startTransition(async () =>
          setResult(await importHistoricalCsvAction(formData)),
        )
      }
    >
      <a
        className={styles.textLink}
        href={TEMPLATE_HREF}
        download="plantilla-importacion.csv"
      >
        Descargar plantilla
      </a>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="import-file">
          Archivo CSV
        </label>
        <input
          className={styles.input}
          id="import-file"
          name="file"
          type="file"
          accept=".csv,text/csv"
          required
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) {
              return;
            }
            const reader = new FileReader();
            reader.onload = () =>
              setPreview(String(reader.result).split(/\r?\n/).slice(0, 4));
            reader.readAsText(file);
          }}
        />
      </div>

      {preview.length ? (
        <pre className={styles.codePreview}>{preview.join("\n")}</pre>
      ) : null}

      <button
        className={`${styles.button} ${styles.buttonPrimary}`}
        disabled={pending}
        type="submit"
      >
        {pending ? "Importando…" : "Confirmar importación"}
      </button>

      {result ? (
        <p className={styles.help} role="status">
          {result.message}
          {result.rows ? ` Filas: ${result.rows}.` : ""}
        </p>
      ) : null}
    </form>
  );
}
