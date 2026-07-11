import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import styles from "@/components/ui/ui.module.css";
import {
  ServiceActiveToggle,
  ServiceForm,
} from "@/components/services/service-form";
import { listServices } from "@/lib/data/catalog";
import { formatCurrency } from "@/lib/format/money";
import { getServiceUnitLabel } from "@/lib/services/labels";

export default async function AdminServicesPage() {
  const services = await listServices();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Servicios</h1>
        <p className={styles.subtitle}>
          Catálogo administrativo. Los servicios solo se crean cuando los
          introduces manualmente.
        </p>
      </header>

      <section
        className={`${styles.panel} ${styles.panelStack}`}
        aria-labelledby="create-service"
      >
        <h2 id="create-service" className={styles.cardTitle}>
          Nuevo servicio
        </h2>
        <ServiceForm mode="create" />
      </section>

      <section className={styles.panelStack} aria-labelledby="service-list">
        <h2 id="service-list" className={styles.cardTitle}>
          Listado
        </h2>

        {services.length === 0 ? (
          <EmptyState
            title="Aún no hay servicios"
            description="Crea el primer servicio con el formulario de arriba cuando lo necesites."
          />
        ) : (
          <>
            <div className={`${styles.gridCards} ${styles.mobileOnly}`}>
              {services.map((service) => (
                <article key={service.id} className={styles.card}>
                  <div className={styles.headerRow}>
                    <h3 className={styles.cardTitle}>{service.name}</h3>
                    <StatusBadge active={service.is_active} />
                  </div>
                  <div className={styles.meta}>
                    <span>{getServiceUnitLabel(service.unit)}</span>
                    <span>{formatCurrency(service.current_price)}</span>
                  </div>
                  <div className={styles.actions}>
                    <ServiceActiveToggle service={service} />
                  </div>
                  <details>
                    <summary>Editar</summary>
                    <div className={styles.panelStack}>
                      <ServiceForm mode="edit" service={service} />
                    </div>
                  </details>
                </article>
              ))}
            </div>

            <div className={`${styles.panel} ${styles.desktopOnly}`}>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Unidad</th>
                      <th>Precio</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((service) => (
                      <tr key={service.id}>
                        <td>{service.name}</td>
                        <td>{getServiceUnitLabel(service.unit)}</td>
                        <td>{formatCurrency(service.current_price)}</td>
                        <td>
                          <StatusBadge active={service.is_active} />
                        </td>
                        <td>
                          <div className={styles.actions}>
                            <details>
                              <summary>Editar</summary>
                              <div className={styles.panelStack}>
                                <ServiceForm mode="edit" service={service} />
                              </div>
                            </details>
                            <ServiceActiveToggle service={service} />
                          </div>
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
