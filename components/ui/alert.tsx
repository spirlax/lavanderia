import type { ReactNode } from "react";

import styles from "@/components/ui/ui.module.css";

type AlertProps = {
  tone: "success" | "error" | "info";
  children: ReactNode;
};

export function Alert({ tone, children }: AlertProps) {
  const toneClass =
    tone === "success"
      ? styles.alertSuccess
      : tone === "error"
        ? styles.alertError
        : styles.alertInfo;

  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`${styles.alert} ${toneClass}`}
    >
      {children}
    </p>
  );
}
