import { notFound } from "next/navigation";

import {
  CustomerActiveToggle,
  CustomerForm,
} from "@/components/customers/customer-form";
import { Alert } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/status-badge";
import styles from "@/components/ui/ui.module.css";
import { canUpdateCustomer } from "@/lib/auth/authorization";
import { requireCurrentProfile } from "@/lib/auth/get-current-profile";
import { getCustomerById } from "@/lib/data/catalog";

type CustomerDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  const profile = await requireCurrentProfile();
  const { id } = await params;

  if (!isUuid(id)) {
    notFound();
  }

  const customer = await getCustomerById(id);

  if (!customer) {
    notFound();
  }

  const canManage = canUpdateCustomer(profile.role);

  return (
    <div className={styles.page}>
      <header className={styles.headerRow}>
        <div className={styles.header}>
          <h1 className={styles.title}>{customer.name}</h1>
          <p className={styles.subtitle}>Ficha de cliente</p>
        </div>
        <StatusBadge active={customer.is_active} />
      </header>

      <section className={`${styles.panel} ${styles.panelStack}`}>
        <h2 className={styles.cardTitle}>Datos</h2>
        <dl className={styles.meta}>
          <div>
            <dt>Teléfono</dt>
            <dd>{customer.phone ?? "Sin teléfono"}</dd>
          </div>
          <div>
            <dt>Correo</dt>
            <dd>{customer.email ?? "Sin correo"}</dd>
          </div>
          <div>
            <dt>Notas</dt>
            <dd>{customer.notes ?? "Sin notas"}</dd>
          </div>
        </dl>
      </section>

      {canManage ? (
        <>
          <section className={`${styles.panel} ${styles.panelStack}`}>
            <h2 className={styles.cardTitle}>Editar</h2>
            <CustomerForm
              mode="edit"
              customer={customer}
              canEditActive
            />
          </section>
          <section className={styles.actions}>
            <CustomerActiveToggle customer={customer} />
          </section>
        </>
      ) : (
        <Alert tone="info">
          Puedes consultar este cliente. La edición, activación y desactivación
          están disponibles solo para el Administrador.
        </Alert>
      )}
    </div>
  );
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
