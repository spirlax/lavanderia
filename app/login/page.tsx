import Link from "next/link";
import { redirect } from "next/navigation";

import styles from "@/components/ui/ui.module.css";
import { getHomePathForRole } from "@/lib/auth/authorization";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";

export default async function LoginPage() {
  const authentication = await getCurrentProfile();
  if (authentication.status === "authenticated") {
    redirect(getHomePathForRole(authentication.profile.role));
  }
  if (authentication.status === "access_not_enabled") {
    redirect("/auth/signout-invalid");
  }

  return (
    <main className={styles.authShell}>
      <section className={`${styles.authSection} ${styles.authSectionWide}`}>
        <header className={`${styles.authHeader} ${styles.authHeaderCentered}`}>
          <p className={styles.eyebrow}>Lavandería</p>
          <h1 className={styles.displayTitle}>¿Cómo deseas ingresar?</h1>
        </header>

        <div className={styles.roleChoiceGrid}>
          <Link href="/operadora" className={styles.roleChoiceCard}>
            <span className={styles.roleChoiceMark} aria-hidden="true">
              ◉
            </span>
            <h2 className={styles.roleChoiceTitle}>Soy operadora</h2>
            <p className={styles.roleChoiceText}>
              Ingresa con tu identidad y PIN.
            </p>
          </Link>
          <Link href="/admin/login" className={styles.roleChoiceCard}>
            <span className={styles.roleChoiceMark} aria-hidden="true">
              ▣
            </span>
            <h2 className={styles.roleChoiceTitle}>Soy administrador</h2>
            <p className={styles.roleChoiceText}>
              Accede con correo y contraseña.
            </p>
          </Link>
        </div>
      </section>
    </main>
  );
}
