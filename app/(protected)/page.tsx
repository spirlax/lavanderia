import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import styles from "@/components/ui/ui.module.css";
import orderStyles from "@/components/orders/orders.module.css";
import { canAccessAdmin } from "@/lib/auth/authorization";
import { requireCurrentProfile } from "@/lib/auth/get-current-profile";
import { formatCurrency } from "@/lib/format/money";
import { formatDateTimeLima } from "@/lib/orders/datetime";
import { listActiveOrders } from "@/lib/orders/queries";
import { getOrderStatusLabel } from "@/lib/orders/status";

export default async function OperationalHomePage() {
  const profile = await requireCurrentProfile();
  const isAdmin = canAccessAdmin(profile.role);
  const orders = await listActiveOrders();

  return (
    <div className={styles.page}>
      <header className={styles.headerRow}>
        <div className={styles.header}>
          <h1 className={styles.title}>Inicio</h1>
          <p className={styles.subtitle}>
            Pedidos activos · {profile.full_name}
          </p>
        </div>
        <Link
          href="/nuevo"
          className={`${styles.button} ${styles.buttonPrimary} ${styles.buttonAction}`}
        >
          Nuevo pedido
        </Link>
      </header>

      <div className={styles.gridCards}>
        <Link href="/nuevo" className={styles.linkCard}>
          <h2 className={styles.linkCardTitle}>Nuevo pedido</h2>
          <p className={styles.linkCardText}>
            Registrar un pedido con cliente y servicios.
          </p>
        </Link>
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
        {isAdmin ? (
          <Link href="/admin" className={styles.linkCard}>
            <h2 className={styles.linkCardTitle}>
              Volver al panel administrativo
            </h2>
            <p className={styles.linkCardText}>
              Servicios, clientes y configuración administrativa.
            </p>
          </Link>
        ) : null}
      </div>

      <section className={styles.panelStack} aria-labelledby="active-orders">
        <h2 id="active-orders" className={styles.cardTitle}>
          Pedidos activos
        </h2>

        {orders.length === 0 ? (
          <EmptyState
            title="No hay pedidos activos"
            description="Cuando registres un pedido aparecerá aquí."
          />
        ) : (
          <>
            <div className={`${styles.gridCards} ${styles.mobileOnly}`}>
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/pedidos/${order.id}`}
                  className={orderStyles.orderCardLink}
                >
                  <div className={orderStyles.orderCardTop}>
                    <p className={orderStyles.orderNumber}>
                      {order.order_number}
                    </p>
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
                    <span>Saldo: {formatCurrency(order.balance_due)}</span>
                  </div>
                </Link>
              ))}
            </div>

            <div className={`${styles.panel} ${styles.desktopOnly}`}>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Pedido</th>
                      <th>Cliente</th>
                      <th>Teléfono</th>
                      <th>Estado</th>
                      <th>Programado</th>
                      <th>Total</th>
                      <th>Saldo</th>
                      <th>Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td>{order.order_number}</td>
                        <td>{order.customer?.name ?? "—"}</td>
                        <td>{order.customer?.phone ?? "—"}</td>
                        <td>{getOrderStatusLabel(order.status)}</td>
                        <td>{formatDateTimeLima(order.scheduled_for)}</td>
                        <td>{formatCurrency(order.total)}</td>
                        <td>{formatCurrency(order.balance_due)}</td>
                        <td>
                          <Link
                            href={`/pedidos/${order.id}`}
                            className={`${styles.button} ${styles.buttonSecondary}`}
                          >
                            Ver
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
