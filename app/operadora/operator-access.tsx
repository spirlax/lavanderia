"use client";

import { useActionState, useState } from "react";

import styles from "@/components/ui/ui.module.css";
import {
  operatorPinLoginAction,
  type OperatorPinState,
} from "@/lib/auth/operator-pin-login";

type OperatorOption = {
  id: string;
  full_name: string;
};

export function OperatorAccess({
  operators,
}: {
  operators: OperatorOption[];
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const selectedOperator =
    operators.find((operator) => operator.id === selected) ?? operators[0];

  if (selected && selectedOperator) {
    return (
      <OperatorPinForm
        operator={selectedOperator}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div className={styles.operatorPickGrid}>
      {operators.map((operator) => (
        <button
          key={operator.id}
          className={styles.operatorPickButton}
          type="button"
          onClick={() => setSelected(operator.id)}
        >
          <span className={styles.operatorPickName}>{operator.full_name}</span>
          <span className={styles.operatorPickHint}>Seleccionar operadora</span>
        </button>
      ))}
    </div>
  );
}

function OperatorPinForm({
  operator,
  onBack,
}: {
  operator: OperatorOption;
  onBack: () => void;
}) {
  const action = operatorPinLoginAction.bind(null, operator.id);
  const [state, formAction, pending] = useActionState<
    OperatorPinState,
    FormData
  >(action, { status: "idle" });
  const [pin, setPin] = useState("");

  const add = (digit: string) => {
    if (pin.length < 6) {
      setPin((current) => current + digit);
    }
  };

  return (
    <form
      className={styles.stack}
      action={(data) => {
        data.set("pin", pin);
        formAction(data);
      }}
    >
      <button className={styles.textLink} onClick={onBack} type="button">
        ← Cambiar operadora
      </button>

      <div className={styles.pinStatus}>
        <p className={styles.help}>Operadora seleccionada</p>
        <h2 className={styles.sectionTitle}>{operator.full_name}</h2>
        <p
          className={styles.pinDots}
          aria-label={`${pin.length} de 6 dígitos`}
        >
          {Array.from({ length: 6 }, (_, index) =>
            index < pin.length ? "●" : "○",
          ).join(" ")}
        </p>
      </div>

      <div className={styles.pinKeypad}>
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
          <button
            key={digit}
            className={styles.pinKey}
            type="button"
            onClick={() => add(digit)}
          >
            {digit}
          </button>
        ))}
        <span className={styles.pinKeySpacer} aria-hidden="true" />
        <button
          className={styles.pinKey}
          type="button"
          onClick={() => add("0")}
        >
          0
        </button>
        <button
          className={`${styles.pinKey} ${styles.pinKeyMuted}`}
          type="button"
          onClick={() => setPin((current) => current.slice(0, -1))}
        >
          Borrar
        </button>
      </div>

      {state.message ? (
        <p className={styles.error} role="alert">
          {state.message}
        </p>
      ) : null}

      <button
        className={`${styles.button} ${styles.buttonPrimary} ${styles.buttonAction} ${styles.buttonBlock}`}
        disabled={pending || pin.length !== 6}
        type="submit"
      >
        {pending ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
