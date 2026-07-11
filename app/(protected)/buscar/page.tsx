import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import { OrderStatusBadge } from "@/components/ui/order-status-badge";
import styles from "@/components/ui/ui.module.css";
import orderStyles from "@/components/orders/orders.module.css";
import { formatCurrency } from "@/lib/format/money";
import { formatDateTimeLima } from "@/lib/orders/datetime";
import { searchOrders } from "@/lib/orders/queries";
import { getOrderStatusOptions } from "@/lib/orders/status";
import { searchOrdersSchema } from "@/lib/orders/validation";

type SearchPageProps = {
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

function buildSearchHref(params: {
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
  return query ? `/buscar?${query}` : "/buscar";
}

export default async function SearchOrdersPage({
  searchParams,
}: SearchPageProps) {
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
  const results = parsed.success ? await searchOrders(filters) : [];
  const statusOptions = getOrderStatusOptions();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Buscar</h1>
        <p className={styles.subtitle}>
          Localiza pedidos por número, cliente, teléfono, estado o fecha.
        </p>
      </header>

      <form method="get" className={`${styles.panel} ${styles.panelStack}`}>
        {raw.status ? (
          <input type="hidden" name="status" value={raw.status} />
        ) : null}

        <div className={orderStyles.searchFilters}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="search-q">
              Buscar
            </label>
            <input
              id="search-q"
              className={styles.input}
              name="q"
              type="search"
              defaultValue={raw.q}
              placeholder="Ej. LAV-2026-000001, Ana o 999"
              maxLength={80}
              autoComplete="off"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="search-date">
              Fecha de recepción
            </label>
            <input
              id="search-date"
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
            Buscar
          </button>
        </div>

        <div className={styles.field}>
          <span className={styles.label} id="status-chips-label">
            Estado
          </span>
          <div
            className={styles.chipRow}
            role="group"
            aria-labelledby="status-chips-label"
          >
            <Link
              href={buildSearchHref({ q: raw.q, date: raw.date })}
              className={[
                styles.chip,
                !raw.status ? styles.chipActive : "",
              ]
                .filter(Boolean)
                .join(" ")}
              aria-current={!raw.status ? "true" : undefined}
            >
              Todos
            </Link>
            {statusOptions.map((option) => {
              const active = raw.status === option.value;
              return (
                <Link
                  key={option.value}
                  href={buildSearchHref({
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

      {!hasCriteria ? (
        <EmptyState
          title="Ingresa un criterio"
          description="Escribe un número, nombre o teléfono, o elige un estado o fecha."
        />
      ) : results.length === 0 ? (
        <EmptyState
          title="Sin resultados"
          description="No encontramos pedidos con esos criterios. Prueba con otro término o filtro."
        />
      ) : (
        <section className={styles.panelStack} aria-labelledby="search-results">
          <h2 id="search-results" className={styles.sectionTitle}>
            Resultados · {results.length}
            {results.length >= 40 ? " (máximo 40)" : ""}
          </h2>

          <div className={`${styles.gridCards} ${styles.mobileOnly}`}>
            {results.map((order) => {
              const balanceDue = Number(order.balance_due);
              return (
                <Link
                  key={order.id}
                  href={`/pedidos/${order.id}`}
                  className={orderStyles.orderCardLink}
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
                      Recepción: {formatDateTimeLima(order.received_at)}
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
                    <th>Teléfono</th>
                    <th>Estado</th>
                    <th>Recepción</th>
                    <th>Total</th>
                    <th>Saldo</th>
                    <th>Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((order) => (
                    <tr key={order.id}>
                      <td>{order.order_number}</td>
                      <td>{order.customer?.name ?? "—"}</td>
                      <td>{order.customer?.phone ?? "—"}</td>
                      <td>
                        <OrderStatusBadge status={order.status} />
                      </td>
                      <td>{formatDateTimeLima(order.received_at)}</td>
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
