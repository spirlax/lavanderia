import styles from "@/components/ui/ui.module.css";
import type { OrderStatus } from "@/lib/auth/types";
import {
  getOrderStatusLabel,
  getOrderStatusTone,
} from "@/lib/orders/status";

const TONE_CLASS: Record<ReturnType<typeof getOrderStatusTone>, string> = {
  info: styles.badgeInfo,
  process: styles.badgeProcess,
  success: styles.badgeActive,
  muted: styles.badgeInactive,
  danger: styles.badgeDanger,
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`${styles.badge} ${TONE_CLASS[getOrderStatusTone(status)]}`}>
      {getOrderStatusLabel(status)}
    </span>
  );
}
