import styles from "@/components/ui/ui.module.css";

export default function OrderDetailLoading() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Pedido</h1>
        <p className={styles.subtitle}>Cargando detalle…</p>
      </header>
    </div>
  );
}
