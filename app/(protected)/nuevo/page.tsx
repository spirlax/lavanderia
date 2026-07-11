import { NewOrderForm } from "@/components/orders/new-order-form";
import styles from "@/components/ui/ui.module.css";
import { canManageServices } from "@/lib/auth/authorization";
import { requireCurrentProfile } from "@/lib/auth/get-current-profile";
import {
  listActiveCustomersForOrder,
  listActiveServicesForOrder,
} from "@/lib/orders/queries";
import { getOpenCashSession } from "@/lib/cash/queries";

export default async function NewOrderPage() {
  const profile = await requireCurrentProfile();
  const [customers, services, cashSession] = await Promise.all([
    listActiveCustomersForOrder(),
    listActiveServicesForOrder(),
    getOpenCashSession(),
  ]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Nuevo pedido</h1>
        <p className={styles.subtitle}>
          Cliente, servicios y pago completo en una sola operación.
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
        hasOpenCashSession={Boolean(cashSession)}
      />
    </div>
  );
}
