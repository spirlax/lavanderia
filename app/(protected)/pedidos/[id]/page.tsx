import { notFound } from "next/navigation";

import { OrderStatusActions } from "@/components/orders/order-status-actions";
import styles from "@/components/ui/ui.module.css";
import orderStyles from "@/components/orders/orders.module.css";
import { requireCurrentProfile } from "@/lib/auth/get-current-profile";
import { formatCurrency } from "@/lib/format/money";
import { formatDateTimeLima } from "@/lib/orders/datetime";
import { getOrderDetail } from "@/lib/orders/queries";
import { getOrderStatusLabel } from "@/lib/orders/status";
import { getServiceUnitLabel } from "@/lib/services/labels";

type OrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const { id } = await params;

  if (!isUuid(id)) {
    notFound();
  }

  const [profile, detail] = await Promise.all([
    requireCurrentProfile(),
    getOrderDetail(id),
  ]);

  if (!detail) {
    notFound();
  }

  const { order, customer, items, history } = detail;

  return (
    <div className={styles.page}>
      <header className={styles.headerRow}>
        <div className={styles.header}>
          <h1 className={styles.title}>{order.order_number}</h1>
          <p className={styles.subtitle}>Detalle del pedido</p>
        </div>
        <span className={`${styles.badge} ${styles.badgeActive}`}>
          {getOrderStatusLabel(order.status)}
        </span>
      </header>

      <OrderStatusActions
        orderId={order.id}
        status={order.status}
        balanceDue={Number(order.balance_due)}
        role={profile.role}
      />

      <section className={`${styles.panel} ${styles.panelStack}`}>
        <h2 className={styles.cardTitle}>Cliente</h2>
        <div className={orderStyles.detailGrid}>
          <div>
            <p className={orderStyles.detailLabel}>Nombre</p>
            <p className={orderStyles.detailValue}>
              {customer?.name ?? "Cliente no disponible"}
            </p>
          </div>
          <div>
            <p className={orderStyles.detailLabel}>Teléfono</p>
            <p className={orderStyles.detailValue}>
              {customer?.phone ?? "Sin teléfono"}
            </p>
          </div>
          <div>
            <p className={orderStyles.detailLabel}>Correo</p>
            <p className={orderStyles.detailValue}>
              {customer?.email ?? "Sin correo"}
            </p>
          </div>
        </div>
      </section>

      <section className={`${styles.panel} ${styles.panelStack}`}>
        <h2 className={styles.cardTitle}>Fechas</h2>
        <div className={`${styles.formGrid} ${styles.formGridTwo}`}>
          <div>
            <p className={orderStyles.detailLabel}>Recepción</p>
            <p className={orderStyles.detailValue}>
              {formatDateTimeLima(order.received_at)}
            </p>
          </div>
          <div>
            <p className={orderStyles.detailLabel}>Programado</p>
            <p className={orderStyles.detailValue}>
              {formatDateTimeLima(order.scheduled_for)}
            </p>
          </div>
          {order.ready_at ? (
            <div>
              <p className={orderStyles.detailLabel}>Listo</p>
              <p className={orderStyles.detailValue}>
                {formatDateTimeLima(order.ready_at)}
              </p>
            </div>
          ) : null}
          {order.delivered_at ? (
            <div>
              <p className={orderStyles.detailLabel}>Entrega</p>
              <p className={orderStyles.detailValue}>
                {formatDateTimeLima(order.delivered_at)}
              </p>
            </div>
          ) : null}
          {order.cancelled_at ? (
            <div>
              <p className={orderStyles.detailLabel}>Cancelación</p>
              <p className={orderStyles.detailValue}>
                {formatDateTimeLima(order.cancelled_at)}
              </p>
            </div>
          ) : null}
        </div>
        {order.cancel_reason ? (
          <p className={styles.help}>Motivo de cancelación: {order.cancel_reason}</p>
        ) : null}
        {order.delivery_with_balance_reason ? (
          <p className={styles.help}>
            Entrega con saldo: {order.delivery_with_balance_reason}
          </p>
        ) : null}
      </section>

      <section className={styles.panelStack} aria-labelledby="order-lines">
        <h2 id="order-lines" className={styles.cardTitle}>
          Servicios
        </h2>

        <div className={`${styles.gridCards} ${styles.mobileOnly}`}>
          {items.map((item) => (
            <article key={item.id} className={styles.card}>
              <h3 className={styles.cardTitle}>{item.service_name_snapshot}</h3>
              <div className={styles.meta}>
                <span>{getServiceUnitLabel(item.unit_snapshot)}</span>
                <span>Cantidad: {formatQuantity(item.quantity)}</span>
                <span>Precio: {formatCurrency(item.unit_price)}</span>
                <span>Subtotal: {formatCurrency(item.line_total)}</span>
              </div>
            </article>
          ))}
        </div>

        <div className={`${styles.panel} ${styles.desktopOnly}`}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Servicio</th>
                  <th>Unidad</th>
                  <th>Cantidad</th>
                  <th>Precio</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.service_name_snapshot}</td>
                    <td>{getServiceUnitLabel(item.unit_snapshot)}</td>
                    <td>{formatQuantity(item.quantity)}</td>
                    <td>{formatCurrency(item.unit_price)}</td>
                    <td>{formatCurrency(item.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className={`${styles.panel} ${styles.panelStack}`}>
        <h2 className={styles.cardTitle}>Totales</h2>
        <div className={orderStyles.totalsRow}>
          <span>Subtotal</span>
          <span>{formatCurrency(order.subtotal)}</span>
        </div>
        <div className={orderStyles.totalsRow}>
          <span>Descuento</span>
          <span>{formatCurrency(order.discount)}</span>
        </div>
        <div className={orderStyles.totalsRow}>
          <span>Total</span>
          <strong className={orderStyles.totalsStrong}>
            {formatCurrency(order.total)}
          </strong>
        </div>
        <div className={orderStyles.totalsRow}>
          <span>Pagado</span>
          <span>{formatCurrency(order.amount_paid)}</span>
        </div>
        <div className={orderStyles.totalsRow}>
          <span>Saldo</span>
          <strong>{formatCurrency(order.balance_due)}</strong>
        </div>
      </section>

      <section className={`${styles.panel} ${styles.panelStack}`}>
        <h2 className={styles.cardTitle}>Historial</h2>
        {history.length === 0 ? (
          <p className={styles.help}>Sin eventos de historial.</p>
        ) : (
          <ol className={orderStyles.historyList}>
            {history.map((entry) => (
              <li key={entry.id} className={orderStyles.historyItem}>
                <strong>
                  {entry.from_status
                    ? `${getOrderStatusLabel(entry.from_status)} → ${getOrderStatusLabel(entry.to_status)}`
                    : getOrderStatusLabel(entry.to_status)}
                </strong>
                <span className={styles.help}>
                  {formatDateTimeLima(entry.changed_at)} ·{" "}
                  {entry.actor_name ??
                    (entry.actor_role_snapshot === "admin"
                      ? "Administrador"
                      : "Operador")}
                </span>
                {entry.reason ? (
                  <span className={styles.help}>Motivo: {entry.reason}</span>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function formatQuantity(value: number): string {
  return Number.isInteger(value) ? String(value) : String(value);
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
