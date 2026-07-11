import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import styles from "@/components/ui/ui.module.css";
import orderStyles from "@/components/orders/orders.module.css";
import { requireCurrentProfile } from "@/lib/auth/get-current-profile";
import { formatCurrency } from "@/lib/format/money";
import { formatDateTimeLima } from "@/lib/orders/datetime";
import { listActiveOrders } from "@/lib/orders/queries";
import { getOrderStatusLabel } from "@/lib/orders/status";

export default async function OperationalHomePage() {
  const profile = await requireCurrentProfile();
  const orders = await listActiveOrders();
  const readyOrders = orders.filter((order) => order.status === "ready");
  const prioritizedOrders = [
    ...readyOrders,
    ...orders.filter((order) => order.status !== "ready"),
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Inicio</h1>
        <p className={styles.subtitle}>Operación diaria · {profile.full_name}</p>
      </header>

      <Link
        href="/nuevo"
        className={`${styles.button} ${styles.buttonPrimary} ${styles.primaryCta}`}
      >
        Nuevo pedido
      </Link>

      <div className={styles.quickActions}>
        <Link href="/buscar" className={styles.linkCard}>
          <h2 className={styles.linkCardTitle}>Buscar</h2>
          <p className={styles.linkCardText}>
            Localizar pedidos por número, cliente o teléfono.
          </p>
        </Link>
        <Link href="/clientes" className={styles.linkCard}>
          <h2 className={styles.linkCardTitle}>Clientes</h2>
          <p className={styles.linkCardText}>
            Consultar y registrar clientes.
          </p>
        </Link>
      </div>

      <section className={styles.panelStack} aria-labelledby="active-orders">
        <div className={styles.header}>
          <h2 id="active-orders" className={styles.cardTitle}>
            Pedidos activos · {orders.length}
          </h2>
          <p className={styles.subtitle}>
            {readyOrders.length === 1
              ? "1 pedido listo para entregar"
              : `${readyOrders.length} pedidos listos para entregar`}
          </p>
        </div>

        {orders.length === 0 ? (
          <EmptyState
            title="No hay pedidos activos"
            description="Cuando registres un pedido aparecerá aquí."
          />
        ) : (
          <div className={styles.orderGrid}>
            {prioritizedOrders.map((order) => (
              <Link
                key={order.id}
                href={`/pedidos/${order.id}`}
                className={[
                  orderStyles.orderCardLink,
                  order.status === "ready" ? styles.orderReadyCard : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className={orderStyles.orderCardTop}>
                  <p className={orderStyles.orderNumber}>{order.order_number}</p>
                  <span className={`${styles.badge} ${styles.badgeActive}`}>
                    {getOrderStatusLabel(order.status)}
                  </span>
                </div>
                <p className={styles.cardTitle}>
                  {order.customer?.name ?? "Cliente no disponible"}
                </p>
                <div className={styles.meta}>
                  <span>{order.customer?.phone ?? "Sin teléfono"}</span>
                  <span>
                    Programado: {formatDateTimeLima(order.scheduled_for)}
                  </span>
                  <span>Total: {formatCurrency(order.total)}</span>
                </div>
                <p className={styles.balanceDue}>
                  Saldo pendiente: {formatCurrency(order.balance_due)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
