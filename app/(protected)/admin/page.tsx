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
          Hola, {profile.full_name}. Gestiona el catálogo y vuelve a operación
          cuando lo necesites.
        </p>
      </header>

      <div className={styles.gridCards}>
        <Link href="/admin/servicios" className={styles.linkCard}>
          <h2 className={styles.linkCardTitle}>Servicios</h2>
          <p className={styles.linkCardText}>
            Crear, editar y activar o desactivar el catálogo de servicios.
          </p>
        </Link>
        <Link href="/clientes" className={styles.linkCard}>
          <h2 className={styles.linkCardTitle}>Clientes</h2>
          <p className={styles.linkCardText}>
            Consultar, crear y administrar la ficha de clientes.
          </p>
        </Link>
        <Link href="/" className={styles.linkCard}>
          <h2 className={styles.linkCardTitle}>Operación</h2>
          <p className={styles.linkCardText}>
            Entrar al área operativa para el trabajo diario.
          </p>
        </Link>
      </div>
    </div>
  );
}
