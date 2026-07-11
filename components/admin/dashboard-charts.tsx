import styles from "@/components/ui/ui.module.css";

type BarItem = {
  key: string;
  label: string;
  value: number;
};

export function DistributionBars({
  items,
  formatValue,
  emptyLabel = "Sin datos en el periodo.",
  tone = "primary",
}: {
  items: BarItem[];
  formatValue: (value: number) => string;
  emptyLabel?: string;
  tone?: "primary" | "accent" | "success";
}) {
  const max = Math.max(...items.map((item) => item.value), 0);
  const hasData = items.some((item) => item.value > 0);

  if (!hasData) {
    return <p className={styles.help}>{emptyLabel}</p>;
  }

  const fillClass =
    tone === "accent"
      ? styles.distBarFillAccent
      : tone === "success"
        ? styles.distBarFillSuccess
        : styles.distBarFill;

  return (
    <ul className={styles.distList}>
      {items.map((item) => {
        const width = max > 0 ? Math.round((item.value / max) * 100) : 0;
        return (
          <li key={item.key} className={styles.distRow}>
            <div className={styles.distMeta}>
              <span>{item.label}</span>
              <span className={styles.amountValue}>{formatValue(item.value)}</span>
            </div>
            <div
              className={styles.distTrack}
              role="img"
              aria-label={`${item.label}: ${formatValue(item.value)}`}
            >
              <div
                className={fillClass}
                style={{ width: `${Math.max(width, item.value > 0 ? 4 : 0)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function TrendBars({
  points,
  valueKey,
  formatValue,
  emptyLabel = "Sin datos en los últimos 7 días.",
  tone = "primary",
}: {
  points: Array<{ date: string; label: string; revenue: number; orders: number }>;
  valueKey: "revenue" | "orders";
  formatValue: (value: number) => string;
  emptyLabel?: string;
  tone?: "primary" | "accent";
}) {
  const values = points.map((point) => point[valueKey]);
  const max = Math.max(...values, 0);
  const hasData = values.some((value) => value > 0);

  if (!hasData) {
    return <p className={styles.help}>{emptyLabel}</p>;
  }

  const fillClass =
    tone === "accent" ? styles.trendBarFillAccent : styles.trendBarFill;

  return (
    <div className={styles.trendChart} role="img" aria-label="Tendencia de 7 días">
      {points.map((point) => {
        const value = point[valueKey];
        const height = max > 0 ? Math.round((value / max) * 100) : 0;
        return (
          <div key={point.date} className={styles.trendCol}>
            <span className={styles.trendValue}>{formatValue(value)}</span>
            <div className={styles.trendTrack}>
              <div
                className={fillClass}
                style={{ height: `${Math.max(height, value > 0 ? 6 : 0)}%` }}
              />
            </div>
            <span className={styles.trendLabel}>{point.label}</span>
          </div>
        );
      })}
    </div>
  );
}
