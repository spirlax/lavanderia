import Link from "next/link";
import { redirect } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { OrderStatusBadge } from "@/components/ui/order-status-badge";
import styles from "@/components/ui/ui.module.css";
import orderStyles from "@/components/orders/orders.module.css";
import { canAccessAdmin } from "@/lib/auth/authorization";
import { requireCurrentProfile } from "@/lib/auth/get-current-profile";
import { formatCurrency } from "@/lib/format/money";
import {
  formatDateTimeLima,
  getReferenceInstantMs,
} from "@/lib/orders/datetime";
import { listActiveOrders, searchOrders } from "@/lib/orders/queries";
import { getOrderStatusOptions } from "@/lib/orders/status";
import { searchOrdersSchema } from "@/lib/orders/validation";

type AdminOrdersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function buildAdminOrdersHref(params: {
  q?: string;
  status?: string;
  date?: string;
}): string {
  const search = new URLSearchParams();
  if (params.q?.trim()) {
    search.set("q", params.q.trim());
  }
  if (params.status) {
    search.set("status", params.status);
  }
  if (params.date) {
    search.set("date", params.date);
  }
  const query = search.toString();
  return query ? `/admin/pedidos?${query}` : "/admin/pedidos";
}

export default async function AdminOrdersPage({
  searchParams,
}: AdminOrdersPageProps) {
  const profile = await requireCurrentProfile();
  if (!canAccessAdmin(profile.role)) {
    redirect("/acceso-denegado");
  }

  const params = await searchParams;
  const raw = {
    q: readParam(params.q) ?? "",
    status: readParam(params.status) ?? "",
    date: readParam(params.date) ?? "",
  };

  const parsed = searchOrdersSchema.safeParse(raw);
  const filters = parsed.success
    ? parsed.data
    : { q: undefined, status: undefined, date: undefined };
  const hasCriteria = Boolean(filters.q || filters.status || filters.date);

  const [activeOrders, searchResults] = await Promise.all([
    listActiveOrders(),
    parsed.success && hasCriteria
      ? searchOrders(filters)
      : Promise.resolve([]),
  ]);

  const results = hasCriteria ? searchResults : activeOrders;
  const statusOptions = getOrderStatusOptions();
  const nowMs = getReferenceInstantMs();
  const overdue = activeOrders.filter((order) => {
    if (!order.scheduled_for) return false;
    return new Date(order.scheduled_for).getTime() < nowMs;
  });
  const readyPending = activeOrders.filter((order) => order.status === "ready");

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Pedidos</h1>
        <p className={styles.subtitle}>
          Consulta, filtra y revisa estados. Sin creación de pedidos desde el
          panel.
        </p>
      </header>

      {(overdue.length > 0 || readyPending.length > 0) && !hasCriteria ? (
        <div className={styles.alertGrid}>
          {overdue.length > 0 ? (
            <Alert tone="info">
              {overdue.length === 1
                ? "1 pedido con programación vencida."
                : `${overdue.length} pedidos con programación vencida.`}
            </Alert>
          ) : null}
          {readyPending.length > 0 ? (
            <Alert tone="info">
              {readyPending.length === 1
                ? "1 pedido listo pendiente de recojo."
                : `${readyPending.length} pedidos listos pendientes de recojo.`}
            </Alert>
          ) : null}
        </div>
      ) : null}

      <form method="get" className={`${styles.panel} ${styles.panelStack}`}>
        {raw.status ? (
          <input type="hidden" name="status" value={raw.status} />
        ) : null}

        <div className={orderStyles.searchFilters}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="admin-search-q">
              Buscar
            </label>
            <input
              id="admin-search-q"
              className={styles.input}
              name="q"
              type="search"
              defaultValue={raw.q}
              placeholder="Número, cliente o teléfono"
              maxLength={80}
              autoComplete="off"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="admin-search-date">
              Fecha de recepción
            </label>
            <input
              id="admin-search-date"
              className={styles.input}
              name="date"
              type="date"
              defaultValue={raw.date}
            />
          </div>

          <button
            type="submit"
            className={`${styles.button} ${styles.buttonPrimary} ${styles.buttonAction}`}
          >
            Filtrar
          </button>
        </div>

        <div className={styles.field}>
          <span className={styles.label} id="admin-status-chips-label">
            Estado
          </span>
          <div
            className={styles.chipRow}
            role="group"
            aria-labelledby="admin-status-chips-label"
          >
            <Link
              href={buildAdminOrdersHref({ q: raw.q, date: raw.date })}
              className={[
                styles.chip,
                !raw.status ? styles.chipActive : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-current={!raw.status ? "true" : undefined}
            >
              {hasCriteria ? "Todos" : "Activos"}
            </Link>
            {statusOptions.map((option) => {
              const active = raw.status === option.value;
              return (
                <Link
                  key={option.value}
                  href={buildAdminOrdersHref({
                    q: raw.q,
                    date: raw.date,
                    status: option.value,
                  })}
                  className={[
                    styles.chip,
                    active ? styles.chipActive : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-current={active ? "true" : undefined}
                >
                  {option.label}
                </Link>
              );
            })}
          </div>
        </div>
      </form>

      {!parsed.success ? (
        <Alert tone="error">Revisa los filtros de búsqueda.</Alert>
      ) : null}

      {results.length === 0 ? (
        <EmptyState
          title={hasCriteria ? "Sin resultados" : "Sin pedidos activos"}
          description={
            hasCriteria
              ? "No hay pedidos con esos criterios."
              : "Cuando existan pedidos activos aparecerán aquí."
          }
        />
      ) : (
        <section className={styles.panelStack} aria-labelledby="admin-orders">
          <h2 id="admin-orders" className={styles.sectionTitle}>
            {hasCriteria ? "Resultados" : "Cola activa"} · {results.length}
            {hasCriteria && results.length >= 40 ? " (máximo 40)" : ""}
          </h2>

          <div className={`${styles.gridCards} ${styles.mobileOnly}`}>
            {results.map((order) => {
              const balanceDue = Number(order.balance_due);
              const isOverdue =
                order.scheduled_for !== null &&
                new Date(order.scheduled_for).getTime() < nowMs;
              return (
                <Link
                  key={order.id}
                  href={`/pedidos/${order.id}`}
                  className={[
                    orderStyles.orderCardLink,
                    isOverdue ? styles.orderOverdueCard : "",
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
                      Programado: {formatDateTimeLima(order.scheduled_for)}
                      {isOverdue ? " · Vencido" : ""}
                    </span>
                    <span>{order.customer?.phone ?? "Sin teléfono"}</span>
                    <span>Total: {formatCurrency(order.total)}</span>
                  </div>
                  {balanceDue > 0 ? (
                    <p
                      className={`${styles.balanceDue} ${styles.balanceDueWarn}`}
                    >
                      Saldo: {formatCurrency(balanceDue)}
                    </p>
                  ) : (
                    <p className={styles.balanceClear}>Saldo pagado</p>
                  )}
                </Link>
              );
            })}
          </div>

          <div className={`${styles.panel} ${styles.desktopOnly}`}>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Cliente</th>
                    <th>Estado</th>
                    <th>Programado</th>
                    <th>Total</th>
                    <th>Saldo</th>
                    <th>Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((order) => {
                    const isOverdue =
                      order.scheduled_for !== null &&
                      new Date(order.scheduled_for).getTime() < nowMs;
                    return (
                      <tr key={order.id}>
                        <td>{order.order_number}</td>
                        <td>{order.customer?.name ?? "—"}</td>
                        <td>
                          <OrderStatusBadge status={order.status} />
                        </td>
                        <td>
                          {formatDateTimeLima(order.scheduled_for)}
                          {isOverdue ? " · Vencido" : ""}
                        </td>
                        <td className={orderStyles.moneyCell}>
                          {formatCurrency(order.total)}
                        </td>
                        <td className={orderStyles.moneyCell}>
                          {formatCurrency(order.balance_due)}
                        </td>
                        <td>
                          <Link
                            href={`/pedidos/${order.id}`}
                            className={`${styles.button} ${styles.buttonSecondary}`}
                          >
                            Ver
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
