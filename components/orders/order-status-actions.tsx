"use client";

import { useRouter } from "next/navigation";
import { useActionState, useId, useState, useTransition } from "react";

import { Alert } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import styles from "@/components/ui/ui.module.css";
import orderStyles from "@/components/orders/orders.module.css";
import type { OrderStatus, Role } from "@/lib/auth/types";
import {
  transitionOrderAction,
  type TransitionOrderActionResult,
} from "@/lib/orders/actions";
import {
  listAvailableTransitions,
  type AvailableTransition,
} from "@/lib/orders/transitions";
import { formatCurrency } from "@/lib/format/money";

const initialState: TransitionOrderActionResult = {
  success: false,
  message: "",
};

function createOperationId(): string {
  return crypto.randomUUID();
}

type OrderStatusActionsProps = {
  orderId: string;
  status: OrderStatus;
  balanceDue: number;
  role: Role;
};

export function OrderStatusActions({
  orderId,
  status,
  balanceDue,
  role,
}: OrderStatusActionsProps) {
  const router = useRouter();
  const reasonId = useId();
  const [isRefreshing, startRefresh] = useTransition();
  const [active, setActive] = useState<AvailableTransition | null>(null);
  const [operationId, setOperationId] = useState(createOperationId);
  const [reason, setReason] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const [state, formAction, pending] = useActionState(
    async (
      prev: TransitionOrderActionResult | undefined,
      formData: FormData,
    ): Promise<TransitionOrderActionResult> => {
      const result = await transitionOrderAction(prev, formData);
      if (result.success) {
        setActive(null);
        setReason("");
        setLocalError(null);
        startRefresh(() => {
          router.refresh();
        });
      }
      return result;
    },
    initialState,
  );

  const actions = listAvailableTransitions(role, status, balanceDue);
  const operatorBlockedByBalance =
    role === "operator" && status === "ready" && balanceDue > 0;
  const busy = pending || isRefreshing;

  const feedbackMessage = localError ?? (state.message || null);
  const feedbackSuccess = localError ? false : state.success;

  function openAction(action: AvailableTransition) {
    setActive(action);
    setOperationId(createOperationId());
    setReason("");
    setLocalError(null);
  }

  function closeAction() {
    if (busy) {
      return;
    }
    setActive(null);
    setReason("");
    setLocalError(null);
  }

  function confirmAction() {
    if (!active || busy) {
      return;
    }

    if (active.requiresReason && !reason.trim()) {
      setLocalError("Indica un motivo para continuar.");
      return;
    }

    setLocalError(null);
    const formData = new FormData();
    formData.set("order_id", orderId);
    formData.set("to_status", active.toStatus);
    formData.set("operation_id", operationId);
    if (reason.trim()) {
      formData.set("reason", reason.trim());
    }
    formAction(formData);
  }

  if (actions.length === 0 && !operatorBlockedByBalance) {
    return null;
  }

  return (
    <section
      className={`${styles.panel} ${styles.panelStack}`}
      aria-labelledby="order-actions"
    >
      <h2 id="order-actions" className={styles.cardTitle}>
        Acciones
      </h2>

      {operatorBlockedByBalance ? (
        <Alert tone="info">
          Hay un saldo pendiente de {formatCurrency(balanceDue)}. Un operador no
          puede entregar hasta que el saldo sea cero.
        </Alert>
      ) : null}

      {feedbackMessage ? (
        <Alert tone={feedbackSuccess ? "success" : "error"}>
          {feedbackMessage}
        </Alert>
      ) : null}

      {actions.length > 0 ? (
        <div className={orderStyles.actionsRow}>
          {actions.map((action) => (
            <button
              key={`${action.toStatus}-${action.label}`}
              type="button"
              className={`${styles.button} ${styles.buttonAction} ${
                action.tone === "danger"
                  ? styles.buttonDanger
                  : action.tone === "secondary"
                    ? styles.buttonSecondary
                    : styles.buttonPrimary
              }`}
              onClick={() => openAction(action)}
              disabled={busy}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(active)}
        title={active?.label ?? "Confirmar"}
        description={active?.description ?? ""}
        confirmLabel={active?.confirmLabel ?? "Confirmar"}
        cancelLabel="Volver"
        pending={busy}
        confirmTone={active?.tone === "danger" ? "danger" : "primary"}
        onCancel={closeAction}
        onConfirm={confirmAction}
      >
        {active?.requiresReason ? (
          <div className={styles.field}>
            <label className={styles.label} htmlFor={reasonId}>
              Motivo
            </label>
            <textarea
              id={reasonId}
              className={styles.textarea}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              maxLength={500}
              required
              disabled={busy}
              aria-invalid={Boolean(localError)}
            />
            {localError ? <p className={styles.error}>{localError}</p> : null}
          </div>
        ) : null}
      </ConfirmDialog>
    </section>
  );
}
