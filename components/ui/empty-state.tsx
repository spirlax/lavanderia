import styles from "@/components/ui/ui.module.css";

type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className={styles.empty} role="status">
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}
