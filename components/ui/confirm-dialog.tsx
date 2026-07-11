"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

import styles from "@/components/ui/ui.module.css";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  pending?: boolean;
  confirmTone?: "danger" | "primary";
  onCancel: () => void;
  onConfirm: () => void;
  children?: ReactNode;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  pending = false,
  confirmTone = "danger",
  onCancel,
  onConfirm,
  children,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    confirmRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) {
        onCancel();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel, pending]);

  if (!open) {
    return null;
  }

  return (
    <div
      className={styles.dialogBackdrop}
      role="presentation"
      onClick={() => {
        if (!pending) {
          onCancel();
        }
      }}
    >
      <div
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className={styles.cardTitle}>
          {title}
        </h2>
        <p id={descriptionId} className={styles.help}>
          {description}
        </p>
        {children}
        <div className={styles.dialogActions}>
          <button
            type="button"
            className={`${styles.button} ${styles.buttonSecondary}`}
            onClick={onCancel}
            disabled={pending}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            className={`${styles.button} ${confirmTone === "primary" ? styles.buttonPrimary : styles.buttonDanger}`}
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? "Procesando…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
