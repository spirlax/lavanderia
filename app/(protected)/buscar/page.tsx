import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import styles from "@/components/ui/ui.module.css";
import orderStyles from "@/components/orders/orders.module.css";
import { formatCurrency } from "@/lib/format/money";
import { formatDateTimeLima } from "@/lib/orders/datetime";
import { searchOrders } from "@/lib/orders/queries";
import {
  getOrderStatusLabel,
  getOrderStatusOptions,
} from "@/lib/orders/status";
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
          Busca por número de pedido, cliente o teléfono. Puedes filtrar por
          estado y fecha de recepción.
        </p>
      </header>

      <form method="get" className={`${styles.panel} ${styles.panelStack}`}>
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
            <label className={styles.label} htmlFor="search-status">
              Estado
            </label>
            <select
              id="search-status"
              className={styles.select}
              name="status"
              defaultValue={raw.status}
            >
              <option value="">Todos</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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
          <h2 id="search-results" className={styles.cardTitle}>
            Resultados · {results.length}
            {results.length >= 40 ? " (máximo 40)" : ""}
          </h2>

          <div className={`${styles.gridCards} ${styles.mobileOnly}`}>
            {results.map((order) => (
              <Link
                key={order.id}
                href={`/pedidos/${order.id}`}
                className={orderStyles.orderCardLink}
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
                    Recepción: {formatDateTimeLima(order.received_at)}
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
                      <td>{getOrderStatusLabel(order.status)}</td>
                      <td>{formatDateTimeLima(order.received_at)}</td>
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
        </section>
      )}
    </div>
  );
}
