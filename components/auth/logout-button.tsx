"use client";

import { logoutAction } from "@/lib/auth/actions";
import styles from "@/components/ui/ui.module.css";

type LogoutButtonProps = {
  className?: string;
};

export function LogoutButton({ className }: LogoutButtonProps) {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className={[styles.button, styles.buttonSecondary, className]
          .filter(Boolean)
          .join(" ")}
      >
        Cerrar sesión
      </button>
    </form>
  );
}
