import styles from "@/components/ui/ui.module.css";

export default function HomeLoading() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Inicio</h1>
        <p className={styles.subtitle}>Cargando pedidos activos…</p>
      </header>
    </div>
  );
}
