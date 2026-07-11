import Link from "next/link";

import styles from "@/components/ui/ui.module.css";
import { getHomePathForRole } from "@/lib/auth/authorization";
import { requireCurrentProfile } from "@/lib/auth/get-current-profile";

export default async function AccessDeniedPage() {
  const profile = await requireCurrentProfile();
  const allowedArea = getHomePathForRole(profile.role);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Acceso denegado</h1>
        <p className={styles.subtitle}>
          Tu perfil no tiene permisos para acceder a esta sección.
        </p>
      </header>
      <Link
        href={allowedArea}
        className={`${styles.button} ${styles.buttonPrimary} ${styles.buttonAction}`}
      >
        Volver al área permitida
      </Link>
    </div>
  );
}
