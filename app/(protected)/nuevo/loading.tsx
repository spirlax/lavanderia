import styles from "@/components/ui/ui.module.css";

export default function NewOrderLoading() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Nuevo pedido</h1>
        <p className={styles.subtitle}>Cargando formulario…</p>
      </header>
    </div>
  );
}
