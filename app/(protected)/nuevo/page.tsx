import { NewOrderForm } from "@/components/orders/new-order-form";
import styles from "@/components/ui/ui.module.css";
import { canManageServices } from "@/lib/auth/authorization";
import { requireCurrentProfile } from "@/lib/auth/get-current-profile";
import {
  listActiveCustomersForOrder,
  listActiveServicesForOrder,
} from "@/lib/orders/queries";

export default async function NewOrderPage() {
  const profile = await requireCurrentProfile();
  const [customers, services] = await Promise.all([
    listActiveCustomersForOrder(),
    listActiveServicesForOrder(),
  ]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Nuevo pedido</h1>
        <p className={styles.subtitle}>
          Selecciona cliente, servicios y fecha programada. Los precios
          definitivos los calcula el servidor.
        </p>
      </header>

      <NewOrderForm
        customers={customers.map((customer) => ({
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
        }))}
        services={services.map((service) => ({
          id: service.id,
          name: service.name,
          unit: service.unit,
          current_price: service.current_price,
        }))}
        canManageServices={canManageServices(profile.role)}
      />
    </div>
  );
}
