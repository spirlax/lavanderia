import Link from "next/link";
import { notFound } from "next/navigation";

import { OrderStatusActions } from "@/components/orders/order-status-actions";
import {
  PayBalanceForm,
  VoidPaymentForm,
} from "@/components/payments/payment-actions";
import { OrderStatusBadge } from "@/components/ui/order-status-badge";
import styles from "@/components/ui/ui.module.css";
import orderStyles from "@/components/orders/orders.module.css";
import { requireCurrentProfile } from "@/lib/auth/get-current-profile";
import { getOpenCashSession } from "@/lib/cash/queries";
import { formatCurrency } from "@/lib/format/money";
import { formatDateTimeLima } from "@/lib/orders/datetime";
import { getOrderDetail } from "@/lib/orders/queries";
import { getOrderStatusLabel } from "@/lib/orders/status";
import { getPaymentMethodLabel } from "@/lib/payments/labels";
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

  const [profile, detail, cashSession] = await Promise.all([
    requireCurrentProfile(),
    getOrderDetail(id),
    getOpenCashSession(),
  ]);

  if (!detail) {
    notFound();
  }

  const { order, customer, items, history, payments } = detail;
  const balanceDue = Number(order.balance_due);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Detalle del pedido</p>
        <h1 className={styles.title}>{order.order_number}</h1>
      </header>

      <section className={styles.detailSummary} aria-label="Resumen del pedido">
        <div className={styles.detailSummaryTop}>
          <div>
            <p className={styles.detailKpiLabel}>Cliente</p>
            <p className={styles.cardTitle}>
              {customer?.name ?? "Cliente no disponible"}
            </p>
            <p className={styles.help}>{customer?.phone ?? "Sin teléfono"}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className={styles.detailSummaryGrid}>
          <div className={styles.detailKpi}>
            <p className={styles.detailKpiLabel}>Total</p>
            <p className={styles.detailKpiValueMuted}>
              {formatCurrency(order.total)}
            </p>
          </div>
          <div className={styles.detailKpi}>
            <p className={styles.detailKpiLabel}>Pagado</p>
            <p className={styles.detailKpiValueMuted}>
              {formatCurrency(order.amount_paid)}
            </p>
          </div>
          <div className={styles.detailKpi}>
            <p className={styles.detailKpiLabel}>Saldo</p>
            <p
              className={[
                styles.detailKpiValue,
                balanceDue > 0 ? styles.detailKpiValueWarn : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {formatCurrency(balanceDue)}
            </p>
          </div>
        </div>

        <p className={styles.help}>
          Programado: {formatDateTimeLima(order.scheduled_for)}
        </p>
      </section>

      <OrderStatusActions
        orderId={order.id}
        status={order.status}
        balanceDue={balanceDue}
        role={profile.role}
      />

      {balanceDue > 0 && order.status !== "cancelled" ? (
        <section className={`${styles.panel} ${styles.panelStack}`}>
          <h2 className={styles.sectionTitle}>Pagar saldo completo</h2>
          <PayBalanceForm
            orderId={order.id}
            balanceDue={order.balance_due}
            hasOpenCashSession={Boolean(cashSession)}
          />
        </section>
      ) : null}

      <section className={`${styles.panel} ${styles.panelStack}`}>
        <h2 className={styles.sectionTitle}>Cliente</h2>
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
        <h2 className={styles.sectionTitle}>Fechas</h2>
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
          <p className={styles.help}>
            Motivo de cancelación: {order.cancel_reason}
          </p>
        ) : null}
        {order.delivery_with_balance_reason ? (
          <p className={styles.help}>
            Entrega con saldo: {order.delivery_with_balance_reason}
          </p>
        ) : null}
      </section>

      <section className={styles.panelStack} aria-labelledby="order-lines">
        <h2 id="order-lines" className={styles.sectionTitle}>
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
                    <td className={orderStyles.moneyCell}>
                      {formatCurrency(item.unit_price)}
                    </td>
                    <td className={orderStyles.moneyCell}>
                      {formatCurrency(item.line_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className={`${styles.panel} ${styles.panelStack}`}>
        <h2 className={styles.sectionTitle}>Totales</h2>
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
          <strong
            className={balanceDue > 0 ? styles.balanceDueWarn : undefined}
          >
            {formatCurrency(balanceDue)}
          </strong>
        </div>
      </section>

      <section className={`${styles.panel} ${styles.panelStack}`}>
        <h2 className={styles.sectionTitle}>Pagos</h2>
        {payments.length === 0 ? (
          <p className={styles.help}>Sin pagos registrados.</p>
        ) : (
          payments.map((payment) => (
            <article key={payment.id} className={styles.card}>
              <div className={styles.headerRow}>
                <strong>{getPaymentMethodLabel(payment.method)}</strong>
                <strong>{formatCurrency(payment.amount)}</strong>
              </div>
              <div className={styles.meta}>
                <span>{formatDateTimeLima(payment.paid_at)}</span>
                {payment.cash_received !== null ? (
                  <span>
                    Recibido {formatCurrency(payment.cash_received)} · Vuelto{" "}
                    {formatCurrency(payment.change_given ?? 0)}
                  </span>
                ) : null}
                {payment.reference ? (
                  <span>Referencia: {payment.reference}</span>
                ) : null}
                {payment.status === "voided" ? (
                  <span>Anulado: {payment.void_reason}</span>
                ) : null}
              </div>
              {profile.role === "admin" && payment.status === "posted" ? (
                <VoidPaymentForm paymentId={payment.id} />
              ) : null}
            </article>
          ))
        )}
      </section>

      <section className={`${styles.panel} ${styles.panelStack}`}>
        <h2 className={styles.sectionTitle}>Historial</h2>
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
                      : "Operadora")}
                </span>
                {entry.reason ? (
                  <span className={styles.help}>Motivo: {entry.reason}</span>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      <p>
        <Link href="/" className={styles.textLink}>
          ← Volver a inicio
        </Link>
      </p>
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
