import Link from "next/link";

import styles from "@/components/ui/ui.module.css";
import { requireCurrentProfile } from "@/lib/auth/get-current-profile";

export default async function AdminPage() {
  const profile = await requireCurrentProfile();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Panel administrativo</h1>
        <p className={styles.subtitle}>
          Hola, {profile.full_name}. Supervisa la operación y administra los
          servicios y precios desde las funciones disponibles.
        </p>
      </header>

      <div className={styles.adminGrid}>
        <Link href="/" className={styles.linkCard}>
          <h2 className={styles.linkCardTitle}>Operación</h2>
          <p className={styles.linkCardText}>
            Revisar pedidos activos, estados y saldos pendientes.
          </p>
        </Link>
        <Link href="/nuevo" className={styles.linkCard}>
          <h2 className={styles.linkCardTitle}>Nuevo pedido</h2>
          <p className={styles.linkCardText}>
            Registrar un pedido con los servicios y precios del catálogo.
          </p>
        </Link>
        <Link href="/buscar" className={styles.linkCard}>
          <h2 className={styles.linkCardTitle}>Buscar pedidos</h2>
          <p className={styles.linkCardText}>
            Consultar pedidos por número, cliente, teléfono, estado o fecha.
          </p>
        </Link>
        <Link href="/clientes" className={styles.linkCard}>
          <h2 className={styles.linkCardTitle}>Clientes</h2>
          <p className={styles.linkCardText}>
            Consultar, crear, editar, activar y desactivar clientes.
          </p>
        </Link>
        <Link href="/admin/servicios" className={styles.linkCard}>
          <h2 className={styles.linkCardTitle}>Servicios y precios</h2>
          <p className={styles.linkCardText}>
            Crear, editar, activar o desactivar el catálogo vigente.
          </p>
        </Link>
      </div>
    </div>
  );
}
