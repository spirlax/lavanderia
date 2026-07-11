import { ImportForm } from "@/components/imports/import-form";
import styles from "@/components/ui/ui.module.css";
import { createClient } from "@/lib/supabase/server";

export default async function ImportacionesPage() {
  const supabase = await createClient();
  const [{ data: batches }, { data: profiles }, { data: summaries }] =
    await Promise.all([
      supabase
        .from("import_batches")
        .select(
          "id,file_name,file_hash,imported_by,imported_at,row_count,status",
        )
        .order("imported_at", { ascending: false }),
      supabase.from("profiles").select("id,full_name"),
      supabase.from("historical_summaries").select("import_batch_id,business_date"),
    ]);

  const names = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile.full_name]),
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Importaciones históricas</h1>
        <p className={styles.subtitle}>
          Agrega resúmenes diarios sin crear pedidos ficticios.
        </p>
      </header>

      <ImportForm />

      <section className={`${styles.panel} ${styles.panelStack}`}>
        <h2 className={styles.sectionTitle}>Lotes importados</h2>
        {batches?.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Archivo</th>
                  <th>Periodo</th>
                  <th>Filas</th>
                  <th>Importado</th>
                  <th>Actor</th>
                  <th>Estado</th>
                  <th>Hash</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => {
                  const dates = (summaries ?? [])
                    .filter(
                      (summary) => summary.import_batch_id === batch.id,
                    )
                    .map((summary) => summary.business_date)
                    .sort();
                  const period = dates.length
                    ? `${dates[0]} — ${dates[dates.length - 1] ?? dates[0]}`
                    : "—";

                  return (
                    <tr key={batch.id}>
                      <td>{batch.file_name}</td>
                      <td>{period}</td>
                      <td>{batch.row_count}</td>
                      <td>
                        {new Date(batch.imported_at).toLocaleString("es-PE")}
                      </td>
                      <td>{names.get(batch.imported_by) ?? "—"}</td>
                      <td>{batch.status}</td>
                      <td
                        className={styles.monoTruncate}
                        title={batch.file_hash}
                      >
                        {batch.file_hash}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={styles.help}>No hay importaciones.</p>
        )}
      </section>
    </div>
  );
}
