import styles from "@/components/ui/ui.module.css";

type PageLoadingProps = {
  title: string;
  message: string;
};

export function PageLoading({ title, message }: PageLoadingProps) {
  return (
    <div
      className={styles.page}
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      <header className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{message}</p>
      </header>

      <div className={styles.skeletonStack} aria-hidden="true">
        <div className={`${styles.skeleton} ${styles.skeletonHero}`} />
        <div className={styles.skeletonRow}>
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
        </div>
        <div className={`${styles.skeleton} ${styles.skeletonBlock}`} />
        <div className={`${styles.skeleton} ${styles.skeletonBlock}`} />
      </div>
    </div>
  );
}
