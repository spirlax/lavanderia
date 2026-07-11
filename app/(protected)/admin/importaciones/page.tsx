import { ImportForm } from "@/components/imports/import-form";
import { createClient } from "@/lib/supabase/server";
import styles from "@/components/ui/ui.module.css";

export default async function ImportacionesPage() {
  const supabase = await createClient();
  const { data: batches } = await supabase.from("import_batches").select("id,file_name,imported_at,row_count,status").order("imported_at", { ascending: false });
  return <div className={styles.page}><header className={styles.header}><h1 className={styles.title}>Importaciones históricas</h1><p className={styles.subtitle}>Agrega resúmenes diarios sin crear pedidos ficticios.</p></header><ImportForm /><section className="mt-6 rounded border p-4"><h2 className="text-lg font-semibold">Lotes</h2>{batches?.length ? <ul>{batches.map((batch) => <li key={batch.id}>{batch.file_name} — {batch.row_count} filas — {batch.status}</li>)}</ul> : <p>No hay importaciones.</p>}</section></div>;
}
