import Link from "next/link";
import { redirect } from "next/navigation";

import { OperatorAccess } from "@/app/operadora/operator-access";
import styles from "@/components/ui/ui.module.css";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { createClient } from "@/lib/supabase/server";

export default async function OperatorPage() {
  const authentication = await getCurrentProfile();
  if (authentication.status === "authenticated") {
    redirect(authentication.profile.role === "admin" ? "/admin" : "/");
  }

  const supabase = await createClient();
  const { data } = await supabase.rpc("list_active_operator_directory");

  return (
    <main className={styles.authShell}>
      <section className={styles.authSection}>
        <Link className={styles.textLink} href="/login">
          ← Cambiar acceso
        </Link>
        <header className={styles.authHeader}>
          <p className={styles.eyebrow}>Lavandería</p>
          <h1 className={styles.displayTitle}>Acceso de empleada</h1>
        </header>
        <OperatorAccess operators={data ?? []} />
      </section>
    </main>
  );
}
