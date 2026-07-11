"use client";

import { useActionState, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import styles from "@/components/ui/ui.module.css";
import type { ActionResult } from "@/lib/auth/types";
import {
  createCustomer,
  setCustomerActive,
  updateCustomer,
} from "@/lib/customers/actions";
import type { CustomerRow } from "@/lib/data/catalog";

const initialState: ActionResult = {
  success: false,
  message: "",
};

type CustomerFormProps = {
  mode: "create" | "edit";
  customer?: CustomerRow;
  canEditActive?: boolean;
};

export function CustomerForm({
  mode,
  customer,
  canEditActive = false,
}: CustomerFormProps) {
  const action = mode === "create" ? createCustomer : updateCustomer;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className={styles.form} noValidate>
      {mode === "edit" && customer ? (
        <input type="hidden" name="id" value={customer.id} />
      ) : null}

      <div className={`${styles.formGrid} ${styles.formGridTwo}`}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${mode}-customer-name`}>
            Nombre
          </label>
          <input
            id={`${mode}-customer-name`}
            className={styles.input}
            name="name"
            defaultValue={customer?.name ?? ""}
            required
            maxLength={160}
            aria-invalid={Boolean(state.success === false && state.fieldErrors?.name)}
          />
          {state.success === false && state.fieldErrors?.name ? (
            <p className={styles.error}>{state.fieldErrors.name}</p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${mode}-customer-phone`}>
            Teléfono
          </label>
          <input
            id={`${mode}-customer-phone`}
            className={styles.input}
            name="phone"
            defaultValue={customer?.phone ?? ""}
            inputMode="tel"
            autoComplete="tel"
            aria-invalid={Boolean(state.success === false && state.fieldErrors?.phone)}
          />
          {state.success === false && state.fieldErrors?.phone ? (
            <p className={styles.error}>{state.fieldErrors.phone}</p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={`${mode}-customer-email`}>
            Correo
          </label>
          <input
            id={`${mode}-customer-email`}
            className={styles.input}
            name="email"
            type="email"
            defaultValue={customer?.email ?? ""}
            autoComplete="email"
            aria-invalid={Boolean(state.success === false && state.fieldErrors?.email)}
          />
          {state.success === false && state.fieldErrors?.email ? (
            <p className={styles.error}>{state.fieldErrors.email}</p>
          ) : null}
        </div>

        {mode === "edit" && canEditActive ? (
          <div className={styles.field}>
            <label
              className={styles.checkboxRow}
              htmlFor={`${mode}-customer-active`}
            >
              <input
                id={`${mode}-customer-active`}
                className={styles.checkbox}
                type="checkbox"
                name="is_active"
                value="true"
                defaultChecked={customer?.is_active ?? true}
              />
              Cliente activo
            </label>
          </div>
        ) : null}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor={`${mode}-customer-notes`}>
          Notas
        </label>
        <textarea
          id={`${mode}-customer-notes`}
          className={styles.textarea}
          name="notes"
          defaultValue={customer?.notes ?? ""}
          maxLength={1000}
          aria-invalid={Boolean(state.success === false && state.fieldErrors?.notes)}
        />
        {state.success === false && state.fieldErrors?.notes ? (
          <p className={styles.error}>{state.fieldErrors.notes}</p>
        ) : null}
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
            ? "Crear cliente"
            : "Guardar cambios"}
      </button>
    </form>
  );
}

export function CustomerActiveToggle({ customer }: { customer: CustomerRow }) {
  const [state, formAction, pending] = useActionState(
    setCustomerActive,
    initialState,
  );
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (customer.is_active) {
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
          title="Desactivar cliente"
          description={`¿Desactivar a “${customer.name}”? No se eliminará el registro.`}
          confirmLabel="Desactivar"
          pending={pending}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            const formData = new FormData();
            formData.set("id", customer.id);
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
      <input type="hidden" name="id" value={customer.id} />
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
