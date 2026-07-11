import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminLoginForm } from "@/app/admin/login/login-form";
import styles from "@/components/ui/ui.module.css";
import { getHomePathForRole } from "@/lib/auth/authorization";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";

export default async function AdminLoginPage() {
  const authentication = await getCurrentProfile();
  if (authentication.status === "authenticated") {
    redirect(getHomePathForRole(authentication.profile.role));
  }

  return (
    <main className={styles.authShell}>
      <section className={`${styles.authSection} ${styles.authCard}`}>
        <header className={styles.authHeader}>
          <Link className={styles.textLink} href="/login">
            ← Cambiar acceso
          </Link>
          <h1 className={styles.displayTitle}>Acceso administrador</h1>
        </header>
        <AdminLoginForm />
      </section>
    </main>
  );
}
