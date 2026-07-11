"use client";

import { useActionState, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { PaymentMethodSegmented } from "@/components/payments/payment-method-segmented";
import orderStyles from "@/components/orders/orders.module.css";
import styles from "@/components/ui/ui.module.css";
import type { ActionResult, PaymentMethod } from "@/lib/auth/types";
import { formatCurrency } from "@/lib/format/money";
import {
  payOrderBalanceAction,
  voidPaymentAction,
} from "@/lib/payments/actions";

const initialState: ActionResult = { success: false, message: "" };

export function PayBalanceForm({
  orderId,
  balanceDue,
  hasOpenCashSession,
}: {
  orderId: string;
  balanceDue: number;
  hasOpenCashSession: boolean;
}) {
  const [state, action, pending] = useActionState(
    payOrderBalanceAction,
    initialState,
  );
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [cashReceived, setCashReceived] = useState("");
  const [operationId] = useState(() => crypto.randomUUID());
  const change = Math.max(0, (Number(cashReceived) || 0) - balanceDue);

  if (!hasOpenCashSession) {
    return <Alert tone="info">Abre la caja del día para pagar este saldo.</Alert>;
  }

  return (
    <form action={action} className={styles.form} noValidate>
      <input type="hidden" name="order_id" value={orderId} />
      <input type="hidden" name="operation_id" value={operationId} />
      <input type="hidden" name="payment_method" value={method} />
      <PaymentMethodSegmented
        id="balance-payment-method"
        label="Método"
        value={method}
        onChange={(next) => {
          setMethod(next);
          setCashReceived("");
        }}
      />
      {method === "cash" ? (
        <>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="balance-cash-received">
              Efectivo recibido
            </label>
            <input
              id="balance-cash-received"
              className={styles.input}
              name="cash_received"
              inputMode="decimal"
              value={cashReceived}
              onChange={(event) => setCashReceived(event.target.value)}
              required
            />
          </div>
          <div className={orderStyles.changeDisplay} aria-live="polite">
            <span>Vuelto</span>
            <strong>{formatCurrency(change)}</strong>
          </div>
        </>
      ) : (
        <div className={styles.field}>
          <label className={styles.label} htmlFor="balance-payment-reference">
            Referencia opcional
          </label>
          <input
            id="balance-payment-reference"
            className={styles.input}
            name="payment_reference"
            maxLength={80}
            autoComplete="off"
          />
        </div>
      )}
      {state.message ? (
        <Alert tone={state.success ? "success" : "error"}>{state.message}</Alert>
      ) : null}
      <button
        type="submit"
        className={`${styles.button} ${styles.buttonPrimary} ${styles.buttonAction}`}
        disabled={pending || (method === "cash" && !cashReceived)}
      >
        {pending ? "Registrando…" : `Pagar ${formatCurrency(balanceDue)}`}
      </button>
    </form>
  );
}

export function VoidPaymentForm({ paymentId }: { paymentId: string }) {
  const [state, action, pending] = useActionState(voidPaymentAction, initialState);
  const [operationId] = useState(() => crypto.randomUUID());
  return (
    <form action={action} className={styles.form} noValidate>
      <input type="hidden" name="payment_id" value={paymentId} />
      <input type="hidden" name="operation_id" value={operationId} />
      <div className={styles.field}>
        <label className={styles.label} htmlFor={`void-${paymentId}`}>
          Motivo de anulación/devolución
        </label>
        <textarea
          id={`void-${paymentId}`}
          className={styles.textarea}
          name="reason"
          maxLength={500}
          required
        />
      </div>
      {state.message ? (
        <Alert tone={state.success ? "success" : "error"}>{state.message}</Alert>
      ) : null}
      <button
        type="submit"
        className={`${styles.button} ${styles.buttonDanger}`}
        disabled={pending}
      >
        {pending ? "Anulando…" : "Anular pago completo"}
      </button>
    </form>
  );
}
