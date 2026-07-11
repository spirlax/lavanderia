import styles from "@/components/ui/ui.module.css";

export default function AdminServicesLoading() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Servicios</h1>
        <p className={styles.subtitle}>Cargando catálogo…</p>
      </header>
    </div>
  );
}
