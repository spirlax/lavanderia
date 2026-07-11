import styles from "@/components/ui/ui.module.css";

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={[
        styles.badge,
        active ? styles.badgeActive : styles.badgeInactive,
      ].join(" ")}
    >
      {active ? "Activo" : "Inactivo"}
    </span>
  );
}
