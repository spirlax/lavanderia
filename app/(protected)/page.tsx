import Link from "next/link";
import { redirect } from "next/navigation";

import { EmptyState } from "@/components/ui/empty-state";
import { OrderStatusBadge } from "@/components/ui/order-status-badge";
import styles from "@/components/ui/ui.module.css";
import orderStyles from "@/components/orders/orders.module.css";
import { canAccessAdmin } from "@/lib/auth/authorization";
import { requireCurrentProfile } from "@/lib/auth/get-current-profile";
import { formatCurrency } from "@/lib/format/money";
import { formatDateTimeLima } from "@/lib/orders/datetime";
import { listActiveOrders } from "@/lib/orders/queries";

export default async function OperationalHomePage() {
  const profile = await requireCurrentProfile();
  if (canAccessAdmin(profile.role)) {
    redirect("/admin");
  }

  const orders = await listActiveOrders();
  const readyOrders = orders.filter((order) => order.status === "ready");
  const inProcessOrders = orders.filter(
    (order) => order.status === "in_process",
  );
  const prioritizedOrders = [
    ...readyOrders,
    ...orders.filter((order) => order.status !== "ready"),
  ];

  return (
    <div className={styles.page}>
      <header className={styles.headerRow}>
        <div className={styles.header}>
          <h1 className={styles.title}>Inicio</h1>
          <p className={styles.subtitle}>
            Cola del día · {profile.full_name}
          </p>
        </div>
        <Link
          href="/nuevo"
          className={`${styles.button} ${styles.buttonPrimary} ${styles.homeNewButton}`}
        >
          Nuevo pedido
        </Link>
      </header>

      <div className={styles.queueSummary} aria-label="Resumen de cola">
        <div className={styles.queueStat}>
          <p className={styles.queueStatValue}>{orders.length}</p>
          <p className={styles.queueStatLabel}>Activos</p>
        </div>
        <div className={`${styles.queueStat} ${styles.queueStatReady}`}>
          <p className={styles.queueStatValue}>{readyOrders.length}</p>
          <p className={styles.queueStatLabel}>Listos</p>
        </div>
        <div className={styles.queueStat}>
          <p className={styles.queueStatValue}>{inProcessOrders.length}</p>
          <p className={styles.queueStatLabel}>En proceso</p>
        </div>
      </div>

      <section className={styles.panelStack} aria-labelledby="active-orders">
        <div className={styles.header}>
          <h2 id="active-orders" className={styles.sectionTitle}>
            Pedidos recientes
          </h2>
          <p className={styles.subtitle}>
            Prioridad a listos para entregar. Cliente, hora e importe a la vista.
          </p>
        </div>

        {orders.length === 0 ? (
          <EmptyState
            title="Cola vacía"
            description="Registra el primer pedido del día."
            action={
              <Link
                href="/nuevo"
                className={`${styles.button} ${styles.buttonPrimary} ${styles.buttonAction}`}
              >
                Nuevo pedido
              </Link>
            }
          />
        ) : (
          <div className={styles.orderGrid}>
            {prioritizedOrders.map((order) => {
              const balanceDue = Number(order.balance_due);
              return (
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
                    <p className={orderStyles.orderNumber}>
                      {order.order_number}
                    </p>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className={orderStyles.orderCardCustomer}>
                    {order.customer?.name ?? "Cliente no disponible"}
                  </p>
                  <div className={orderStyles.orderCardMeta}>
                    <span className={orderStyles.orderCardMetaPrimary}>
                      {formatDateTimeLima(order.scheduled_for, {
                        timeStyle: "short",
                      })}
                    </span>
                    <span className={orderStyles.orderCardMetaPrimary}>
                      {formatCurrency(order.total)}
                    </span>
                    <span>{order.customer?.phone ?? "Sin teléfono"}</span>
                  </div>
                  {balanceDue > 0 ? (
                    <p className={`${styles.balanceDue} ${styles.balanceDueWarn}`}>
                      Saldo: {formatCurrency(balanceDue)}
                    </p>
                  ) : (
                    <p className={styles.balanceClear}>Saldo pagado</p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
