import styles from "@/components/ui/ui.module.css";

export default function CustomersLoading() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Clientes</h1>
        <p className={styles.subtitle}>Cargando clientes…</p>
      </header>
    </div>
  );
}
