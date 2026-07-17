"use client";

import { useActionState, useState } from "react";

import { Alert } from "@/components/ui/alert";
import styles from "@/components/ui/ui.module.css";
import type { ActionResult } from "@/lib/auth/types";
import {
  closeCashSessionAction,
  openCashSessionAction,
  setCashManagerPermissionAction,
} from "@/lib/cash/actions";
import type { CashOperator } from "@/lib/cash/queries";
import { formatCurrency } from "@/lib/format/money";

const initialState: ActionResult = { success: false, message: "" };

export function OpenCashSessionForm({
  operators,
  ownOperatorId,
}: {
  operators: CashOperator[];
  ownOperatorId?: string;
}) {
  const [state, action, pending] = useActionState(
    openCashSessionAction,
    initialState,
  );
  const [operationId] = useState(() => crypto.randomUUID());
  const eligible = operators.filter(
    (operator) => operator.is_active && operator.can_manage_cash_session,
  );

  return (
    <form action={action} className={styles.form} noValidate>
      <input type="hidden" name="operation_id" value={operationId} />
      {ownOperatorId ? (
        <input
          type="hidden"
          name="responsible_operator_id"
          value={ownOperatorId}
        />
      ) : (
        <div className={styles.field}>
          <label className={styles.label} htmlFor="responsible-operator">
            Empleada responsable
          </label>
          <select
            id="responsible-operator"
            className={styles.select}
            name="responsible_operator_id"
            required
            defaultValue=""
          >
            <option value="" disabled>
              Selecciona…
            </option>
            {eligible.map((operator) => (
              <option key={operator.id} value={operator.id}>
                {operator.full_name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="opening-cash">
          Efectivo inicial contado
        </label>
        <input
          id="opening-cash"
          className={styles.input}
          name="opening_cash"
          inputMode="decimal"
          placeholder="0.00"
          required
        />
      </div>
      <p className={styles.help}>
        La apertura se cuenta y registra manualmente; no se copia el cierre anterior.
      </p>
      {state.message ? (
        <Alert tone={state.success ? "success" : "error"}>{state.message}</Alert>
      ) : null}
      <button
        type="submit"
        className={`${styles.button} ${styles.buttonPrimary} ${styles.buttonAction}`}
        disabled={pending || (!ownOperatorId && eligible.length === 0)}
      >
        {pending ? "Abriendo…" : "Abrir caja"}
      </button>
    </form>
  );
}

export function CloseCashSessionForm({
  sessionId,
  expectedCash,
}: {
  sessionId: string;
  expectedCash: number;
}) {
  const [state, action, pending] = useActionState(
    closeCashSessionAction,
    initialState,
  );
  const [operationId] = useState(() => crypto.randomUUID());
  const [countedCash, setCountedCash] = useState("");
  const counted = Number(countedCash);
  const hasCounted = countedCash.trim() !== "" && Number.isFinite(counted);
  const difference = hasCounted ? counted - expectedCash : null;

  return (
    <form action={action} className={styles.form} noValidate>
      <input type="hidden" name="cash_session_id" value={sessionId} />
      <input type="hidden" name="operation_id" value={operationId} />

      <div className={styles.metric}>
        <p className={styles.metricLabel}>Efectivo esperado</p>
        <p className={styles.metricValue}>{formatCurrency(expectedCash)}</p>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={`counted-${sessionId}`}>
          Efectivo contado
        </label>
        <input
          id={`counted-${sessionId}`}
          className={styles.input}
          name="counted_cash"
          inputMode="decimal"
          value={countedCash}
          onChange={(event) => setCountedCash(event.target.value)}
          required
        />
      </div>

      {difference !== null ? (
        <div
          className={[
            styles.differenceBanner,
            difference === 0
              ? styles.differenceBannerOk
              : styles.differenceBannerWarn,
          ].join(" ")}
          aria-live="polite"
        >
          <div>
            <p className={styles.detailKpiLabel}>Diferencia estimada</p>
            <p className={styles.detailKpiValue}>
              {formatCurrency(difference)}
            </p>
          </div>
          <p className={styles.help}>
            {difference === 0
              ? "Cuadra con el esperado."
              : "Se registrará al cerrar la jornada."}
          </p>
        </div>
      ) : null}

      <div className={styles.field}>
        <label className={styles.label} htmlFor={`notes-${sessionId}`}>
          Notas de cierre
        </label>
        <textarea
          id={`notes-${sessionId}`}
          className={styles.textarea}
          name="closing_notes"
          maxLength={500}
        />
      </div>
      {state.message ? (
        <Alert tone={state.success ? "success" : "error"}>{state.message}</Alert>
      ) : null}
      <button
        type="submit"
        className={`${styles.button} ${styles.buttonDanger} ${styles.buttonAction}`}
        disabled={pending}
      >
        {pending ? "Cerrando…" : "Cerrar caja definitivamente"}
      </button>
    </form>
  );
}

export function CashPermissionForm({ operator }: { operator: CashOperator }) {
  const [state, action, pending] = useActionState(
    setCashManagerPermissionAction,
    initialState,
  );
  const next = !operator.can_manage_cash_session;
  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="profile_id" value={operator.id} />
      <input type="hidden" name="can_manage" value={String(next)} />
      <button
        type="submit"
        className={`${styles.button} ${
          next ? styles.buttonPrimary : styles.buttonSecondary
        }`}
        disabled={pending || !operator.is_active}
      >
        {pending
          ? "Guardando…"
          : next
            ? "Autorizar apertura y cierre"
            : "Retirar permiso"}
      </button>
      {state.message ? (
        <Alert tone={state.success ? "success" : "error"}>{state.message}</Alert>
      ) : null}
    </form>
  );
}

