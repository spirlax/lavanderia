"use client";

import { useActionState, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import styles from "@/components/ui/ui.module.css";
import type { ActionResult } from "@/lib/auth/types";
import type { ServiceRow } from "@/lib/data/catalog";
import {
  createService,
  setServiceActive,
  updateService,
} from "@/lib/services/actions";
import { SERVICE_UNIT_OPTIONS } from "@/lib/services/labels";

const initialState: ActionResult = {
  success: false,
  message: "",
};

type ServiceFormProps = {
  mode: "create" | "edit";
  service?: ServiceRow;
};

export function ServiceForm({ mode, service }: ServiceFormProps) {
  const action = mode === "create" ? createService : updateService;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className={styles.form} noValidate>
      {mode === "edit" && service ? (
        <input type="hidden" name="id" value={service.id} />
      ) : null}

      <div className={`${styles.formGrid} ${styles.formGridTwo}`}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${mode}-service-name`}>
            Nombre
          </label>
          <input
            id={`${mode}-service-name`}
            className={styles.input}
            name="name"
            defaultValue={service?.name ?? ""}
            required
            maxLength={120}
            aria-invalid={Boolean(state.success === false && state.fieldErrors?.name)}
          />
          {state.success === false && state.fieldErrors?.name ? (
            <p className={styles.error}>{state.fieldErrors.name}</p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${mode}-service-unit`}>
            Unidad
          </label>
          <select
            id={`${mode}-service-unit`}
            className={styles.select}
            name="unit"
            defaultValue={service?.unit ?? "kg"}
            required
            aria-invalid={Boolean(state.success === false && state.fieldErrors?.unit)}
          >
            {SERVICE_UNIT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {state.success === false && state.fieldErrors?.unit ? (
            <p className={styles.error}>{state.fieldErrors.unit}</p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${mode}-service-price`}>
            Precio actual (S/)
          </label>
          <input
            id={`${mode}-service-price`}
            className={styles.input}
            name="current_price"
            inputMode="decimal"
            defaultValue={
              service ? formatPriceInput(service.current_price) : ""
            }
            required
            aria-invalid={Boolean(
              state.success === false && state.fieldErrors?.current_price,
            )}
          />
          {state.success === false && state.fieldErrors?.current_price ? (
            <p className={styles.error}>{state.fieldErrors.current_price}</p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label className={styles.checkboxRow} htmlFor={`${mode}-service-active`}>
            <input
              id={`${mode}-service-active`}
              className={styles.checkbox}
              type="checkbox"
              name="is_active"
              value="true"
              defaultChecked={service?.is_active ?? true}
            />
            Servicio activo
          </label>
        </div>
      </div>

      {state.message ? (
        <Alert tone={state.success ? "success" : "error"}>{state.message}</Alert>
      ) : null}

      <button
        type="submit"
        className={`${styles.button} ${styles.buttonPrimary} ${styles.buttonAction}`}
        disabled={pending}
      >
        {pending
          ? "Guardando…"
          : mode === "create"
            ? "Crear servicio"
            : "Guardar cambios"}
      </button>
    </form>
  );
}

type DeactivateServiceButtonProps = {
  service: ServiceRow;
};

export function ServiceActiveToggle({ service }: DeactivateServiceButtonProps) {
  const [state, formAction, pending] = useActionState(
    setServiceActive,
    initialState,
  );
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (service.is_active) {
    return (
      <>
        <button
          type="button"
          className={`${styles.button} ${styles.buttonDanger}`}
          onClick={() => setConfirmOpen(true)}
          disabled={pending}
        >
          Desactivar
        </button>
        <ConfirmDialog
          open={confirmOpen}
          title="Desactivar servicio"
          description={`¿Desactivar “${service.name}”? Seguirá visible para administración, pero no se ofrecerá en operación.`}
          confirmLabel="Desactivar"
          pending={pending}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            const formData = new FormData();
            formData.set("id", service.id);
            formData.set("is_active", "false");
            formAction(formData);
            setConfirmOpen(false);
          }}
        />
        {state.message ? (
          <Alert tone={state.success ? "success" : "error"}>{state.message}</Alert>
        ) : null}
      </>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="id" value={service.id} />
      <input type="hidden" name="is_active" value="true" />
      <button
        type="submit"
        className={`${styles.button} ${styles.buttonSecondary}`}
        disabled={pending}
      >
        {pending ? "Activando…" : "Activar"}
      </button>
      {state.message ? (
        <Alert tone={state.success ? "success" : "error"}>{state.message}</Alert>
      ) : null}
    </form>
  );
}

function formatPriceInput(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
