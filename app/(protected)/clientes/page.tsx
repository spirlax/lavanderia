import Link from "next/link";

import { CustomerForm } from "@/components/customers/customer-form";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import styles from "@/components/ui/ui.module.css";
import { canUpdateCustomer } from "@/lib/auth/authorization";
import { requireCurrentProfile } from "@/lib/auth/get-current-profile";
import { listCustomers } from "@/lib/data/catalog";

type CustomersPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function CustomersPage({
  searchParams,
}: CustomersPageProps) {
  const profile = await requireCurrentProfile();
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const customers = await listCustomers(query);
  const canManage = canUpdateCustomer(profile.role);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Clientes</h1>
        <p className={styles.subtitle}>
          {canManage
            ? "Consulta, alta, edición y activación de clientes."
            : "Consulta y alta de clientes. La edición está reservada a administración."}
        </p>
      </header>

      <section className={`${styles.panel} ${styles.panelStack}`}>
        <h2 className={styles.cardTitle}>Buscar</h2>
        <form className={styles.form} method="get">
          <div className={styles.field}>
            <label className={styles.label} htmlFor="customer-search">
              Nombre o teléfono
            </label>
            <input
              id="customer-search"
              className={styles.input}
              name="q"
              defaultValue={query}
              placeholder="Ej. Ana o 999"
            />
          </div>
          <button
            type="submit"
            className={`${styles.button} ${styles.buttonPrimary}`}
          >
            Buscar
          </button>
        </form>
      </section>

      <section
        className={`${styles.panel} ${styles.panelStack}`}
        aria-labelledby="create-customer"
      >
        <h2 id="create-customer" className={styles.cardTitle}>
          Nuevo cliente
        </h2>
        <CustomerForm mode="create" />
      </section>

      <section className={styles.panelStack} aria-labelledby="customer-list">
        <h2 id="customer-list" className={styles.cardTitle}>
          Listado
        </h2>

        {customers.length === 0 ? (
          <EmptyState
            title={query ? "Sin resultados" : "Aún no hay clientes"}
            description={
              query
                ? "Prueba con otro nombre o teléfono."
                : "Crea el primer cliente con el formulario de arriba."
            }
          />
        ) : (
          <>
            <div className={`${styles.gridCards} ${styles.mobileOnly}`}>
              {customers.map((customer) => (
                <article key={customer.id} className={styles.card}>
                  <div className={styles.headerRow}>
                    <h3 className={styles.cardTitle}>{customer.name}</h3>
                    <StatusBadge active={customer.is_active} />
                  </div>
                  <div className={styles.meta}>
                    <span>{customer.phone ?? "Sin teléfono"}</span>
                    <span>{customer.email ?? "Sin correo"}</span>
                  </div>
                  <div className={styles.actions}>
                    <Link
                      href={`/clientes/${customer.id}`}
                      className={`${styles.button} ${styles.buttonSecondary}`}
                    >
                      Ver detalle
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            <div className={`${styles.panel} ${styles.desktopOnly}`}>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Teléfono</th>
                      <th>Correo</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((customer) => (
                      <tr key={customer.id}>
                        <td>{customer.name}</td>
                        <td>{customer.phone ?? "—"}</td>
                        <td>{customer.email ?? "—"}</td>
                        <td>
                          <StatusBadge active={customer.is_active} />
                        </td>
                        <td>
                          <Link
                            href={`/clientes/${customer.id}`}
                            className={`${styles.button} ${styles.buttonSecondary}`}
                          >
                            Ver detalle
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
