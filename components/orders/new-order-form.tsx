"use client";

import Link from "next/link";
import {
  useActionState,
  useId,
  useMemo,
  useState,
} from "react";

import { Alert } from "@/components/ui/alert";
import orderStyles from "@/components/orders/orders.module.css";
import styles from "@/components/ui/ui.module.css";
import type { ActionResult, ServiceUnit } from "@/lib/auth/types";
import { createCustomer } from "@/lib/customers/actions";
import { formatCurrency } from "@/lib/format/money";
import { getDefaultScheduledForLocal } from "@/lib/orders/datetime";
import {
  createOrderAction,
  type CreateOrderActionResult,
} from "@/lib/orders/actions";
import { getServiceUnitLabel } from "@/lib/services/labels";

type CustomerOption = {
  id: string;
  name: string;
  phone: string | null;
};

type ServiceOption = {
  id: string;
  name: string;
  unit: ServiceUnit;
  current_price: number;
};

type DraftLine = {
  key: string;
  service_id: string;
  quantity: string;
};

type NewOrderFormProps = {
  customers: CustomerOption[];
  services: ServiceOption[];
  canManageServices: boolean;
};

const initialOrderState: CreateOrderActionResult = {
  success: false,
  message: "",
};

const initialCustomerState: ActionResult = {
  success: false,
  message: "",
};

function createOperationId(): string {
  return crypto.randomUUID();
}

function createLineKey(): string {
  return crypto.randomUUID();
}

export function NewOrderForm({
  customers: initialCustomers,
  services,
  canManageServices,
}: NewOrderFormProps) {
  const formId = useId();
  const [operationId] = useState(createOperationId);
  const [customers, setCustomers] = useState(initialCustomers);
  const [customerQuery, setCustomerQuery] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [appliedCustomerSuccessKey, setAppliedCustomerSuccessKey] = useState<
    string | null
  >(null);
  const [showQuickCustomer, setShowQuickCustomer] = useState(
    initialCustomers.length === 0,
  );
  const [scheduledFor, setScheduledFor] = useState(getDefaultScheduledForLocal);
  const [lines, setLines] = useState<DraftLine[]>([
    { key: createLineKey(), service_id: "", quantity: "1" },
  ]);
  const [quickName, setQuickName] = useState("");
  const [quickPhone, setQuickPhone] = useState("");
  const [orderState, orderAction, orderPending] = useActionState(
    createOrderAction,
    initialOrderState,
  );
  const [customerState, customerAction, customerPending] = useActionState(
    createCustomer,
    initialCustomerState,
  );

  const customerSuccessKey =
    customerState.success && customerState.customerId
      ? `${customerState.customerId}:${customerState.message}`
      : null;

  if (
    customerSuccessKey &&
    customerSuccessKey !== appliedCustomerSuccessKey &&
    customerState.success &&
    customerState.customerId
  ) {
    const created: CustomerOption = {
      id: customerState.customerId,
      name: quickName.trim() || "Cliente nuevo",
      phone: quickPhone.trim() || null,
    };

    setAppliedCustomerSuccessKey(customerSuccessKey);
    setCustomers((current) => {
      if (current.some((item) => item.id === created.id)) {
        return current;
      }
      return [created, ...current];
    });
    setSelectedCustomerId(created.id);
    setCustomerQuery(created.name);
    setShowQuickCustomer(false);
    setQuickName("");
    setQuickPhone("");
  }

  const filteredCustomers = useMemo(() => {
    const q = customerQuery.trim().toLowerCase();
    if (!q) {
      return customers.slice(0, 20);
    }
    return customers
      .filter(
        (customer) =>
          customer.name.toLowerCase().includes(q) ||
          (customer.phone ?? "").toLowerCase().includes(q),
      )
      .slice(0, 20);
  }, [customers, customerQuery]);

  const selectedServiceIds = useMemo(
    () => new Set(lines.map((line) => line.service_id).filter(Boolean)),
    [lines],
  );

  const estimatedSubtotal = useMemo(() => {
    return lines.reduce((sum, line) => {
      const service = services.find((item) => item.id === line.service_id);
      const quantity = Number(line.quantity);
      if (!service || !Number.isFinite(quantity) || quantity <= 0) {
        return sum;
      }
      return sum + service.current_price * quantity;
    }, 0);
  }, [lines, services]);

  if (services.length === 0) {
    return (
      <div className={styles.panelStack}>
        <Alert tone="info">
          No hay servicios activos en el catálogo. No se puede crear un pedido
          todavía.
        </Alert>
        {canManageServices ? (
          <Link
            href="/admin/servicios"
            className={`${styles.button} ${styles.buttonPrimary} ${styles.buttonAction}`}
          >
            Ir a Servicios
          </Link>
        ) : (
          <p className={styles.help}>
            Pide al administrador que configure el catálogo de servicios.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className={orderStyles.layout}>
      <div className={orderStyles.formWithSummary}>
        <div className={styles.panelStack}>
          <section className={`${styles.panel} ${styles.panelStack}`}>
            <h2 className={styles.cardTitle}>Cliente</h2>
            <div className={styles.field}>
              <label className={styles.label} htmlFor={`${formId}-customer-search`}>
                Buscar por nombre o teléfono
              </label>
              <input
                id={`${formId}-customer-search`}
                className={styles.input}
                value={customerQuery}
                onChange={(event) => setCustomerQuery(event.target.value)}
                placeholder="Ej. Ana o 999"
                autoComplete="off"
              />
            </div>

            {filteredCustomers.length > 0 ? (
              <div
                className={orderStyles.customerList}
                role="listbox"
                aria-label="Clientes"
              >
                {filteredCustomers.map((customer) => {
                  const selected = customer.id === selectedCustomerId;
                  return (
                    <button
                      key={customer.id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      className={[
                        orderStyles.customerOption,
                        selected ? orderStyles.customerOptionSelected : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => {
                        setSelectedCustomerId(customer.id);
                        setCustomerQuery(customer.name);
                      }}
                    >
                      <span className={orderStyles.customerOptionName}>
                        {customer.name}
                      </span>
                      <span className={orderStyles.customerOptionMeta}>
                        {customer.phone ?? "Sin teléfono"}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className={styles.help}>
                No hay clientes que coincidan. Puedes crear uno rápidamente.
              </p>
            )}

            <button
              type="button"
              className={`${styles.button} ${styles.buttonSecondary}`}
              onClick={() => setShowQuickCustomer((value) => !value)}
            >
              {showQuickCustomer ? "Ocultar alta rápida" : "Crear cliente"}
            </button>

            {showQuickCustomer ? (
              <form action={customerAction} className={styles.form} noValidate>
                <div className={`${styles.formGrid} ${styles.formGridTwo}`}>
                  <div className={styles.field}>
                    <label
                      className={styles.label}
                      htmlFor={`${formId}-quick-name`}
                    >
                      Nombre
                    </label>
                    <input
                      id={`${formId}-quick-name`}
                      className={styles.input}
                      name="name"
                      required
                      maxLength={160}
                      value={quickName}
                      onChange={(event) => setQuickName(event.target.value)}
                    />
                  </div>
                  <div className={styles.field}>
                    <label
                      className={styles.label}
                      htmlFor={`${formId}-quick-phone`}
                    >
                      Teléfono
                    </label>
                    <input
                      id={`${formId}-quick-phone`}
                      className={styles.input}
                      name="phone"
                      inputMode="tel"
                      value={quickPhone}
                      onChange={(event) => setQuickPhone(event.target.value)}
                    />
                  </div>
                </div>
                {customerState.message ? (
                  <Alert tone={customerState.success ? "success" : "error"}>
                    {customerState.message}
                  </Alert>
                ) : null}
                <button
                  type="submit"
                  className={`${styles.button} ${styles.buttonPrimary}`}
                  disabled={customerPending}
                >
                  {customerPending ? "Creando…" : "Guardar cliente"}
                </button>
              </form>
            ) : null}

            {!selectedCustomerId ? (
              <p className={styles.help}>Selecciona un cliente para continuar.</p>
            ) : null}
          </section>

          <section className={`${styles.panel} ${styles.panelStack}`}>
            <div className={styles.headerRow}>
              <h2 className={styles.cardTitle}>Servicios</h2>
              <button
                type="button"
                className={`${styles.button} ${styles.buttonSecondary}`}
                onClick={() =>
                  setLines((current) => [
                    ...current,
                    { key: createLineKey(), service_id: "", quantity: "1" },
                  ])
                }
                disabled={lines.length >= 100}
              >
                Añadir línea
              </button>
            </div>

            {lines.map((line, index) => {
              const service = services.find((item) => item.id === line.service_id);
              return (
                <div key={line.key} className={orderStyles.lineCard}>
                  <div className={orderStyles.lineHeader}>
                    <h3 className={orderStyles.lineTitle}>Línea {index + 1}</h3>
                    {lines.length > 1 ? (
                      <button
                        type="button"
                        className={`${styles.button} ${styles.buttonDanger}`}
                        onClick={() =>
                          setLines((current) =>
                            current.filter((item) => item.key !== line.key),
                          )
                        }
                        aria-label={`Quitar línea ${index + 1}`}
                      >
                        Quitar
                      </button>
                    ) : null}
                  </div>

                  <div className={`${styles.formGrid} ${styles.formGridTwo}`}>
                    <div className={styles.field}>
                      <label
                        className={styles.label}
                        htmlFor={`${formId}-service-${line.key}`}
                      >
                        Servicio
                      </label>
                      <select
                        id={`${formId}-service-${line.key}`}
                        className={styles.select}
                        value={line.service_id}
                        onChange={(event) => {
                          const nextId = event.target.value;
                          setLines((current) =>
                            current.map((item) =>
                              item.key === line.key
                                ? { ...item, service_id: nextId }
                                : item,
                            ),
                          );
                        }}
                        required
                      >
                        <option value="">Selecciona…</option>
                        {services.map((option) => {
                          const taken =
                            selectedServiceIds.has(option.id) &&
                            option.id !== line.service_id;
                          return (
                            <option
                              key={option.id}
                              value={option.id}
                              disabled={taken}
                            >
                              {option.name}
                              {taken ? " (ya agregado)" : ""}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className={styles.field}>
                      <label
                        className={styles.label}
                        htmlFor={`${formId}-qty-${line.key}`}
                      >
                        Cantidad
                        {service
                          ? ` (${getServiceUnitLabel(service.unit)})`
                          : ""}
                      </label>
                      <input
                        id={`${formId}-qty-${line.key}`}
                        className={styles.input}
                        inputMode="decimal"
                        value={line.quantity}
                        onChange={(event) => {
                          const next = event.target.value;
                          setLines((current) =>
                            current.map((item) =>
                              item.key === line.key
                                ? { ...item, quantity: next }
                                : item,
                            ),
                          );
                        }}
                        required
                      />
                    </div>
                  </div>

                  {service ? (
                    <p className={styles.help}>
                      Precio de referencia: {formatCurrency(service.current_price)}{" "}
                      · estimado línea:{" "}
                      {formatCurrency(
                        service.current_price * (Number(line.quantity) || 0),
                      )}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </section>

          <section className={`${styles.panel} ${styles.panelStack}`}>
            <h2 className={styles.cardTitle}>Entrega programada</h2>
            <div className={styles.field}>
              <label className={styles.label} htmlFor={`${formId}-scheduled`}>
                Fecha y hora (hora de Lima)
              </label>
              <input
                id={`${formId}-scheduled`}
                className={styles.input}
                type="datetime-local"
                value={scheduledFor}
                onChange={(event) => setScheduledFor(event.target.value)}
                required
              />
            </div>
          </section>
        </div>

        <aside className={orderStyles.summarySticky} aria-live="polite">
          <div className={styles.panelStack}>
            <h2 className={styles.cardTitle}>Resumen</h2>
            <div className={orderStyles.totalsRow}>
              <span>Subtotal estimado</span>
              <strong className={orderStyles.totalsStrong}>
                {formatCurrency(estimatedSubtotal)}
              </strong>
            </div>
            <p className={styles.help}>
              El total definitivo lo calcula el servidor al confirmar el pedido.
            </p>

            <form
              action={orderAction}
              className={styles.form}
              onSubmit={(event) => {
                if (orderPending) {
                  event.preventDefault();
                }
              }}
            >
              <input type="hidden" name="operation_id" value={operationId} />
              <input
                type="hidden"
                name="customer_id"
                value={selectedCustomerId}
              />
              <input type="hidden" name="scheduled_for" value={scheduledFor} />
              <input
                type="hidden"
                name="items"
                value={JSON.stringify(
                  lines
                    .filter((line) => line.service_id)
                    .map((line) => ({
                      service_id: line.service_id,
                      quantity: line.quantity,
                    })),
                )}
              />

              {orderState.message ? (
                <Alert tone={orderState.success ? "success" : "error"}>
                  {orderState.message}
                </Alert>
              ) : null}

              <button
                type="submit"
                className={`${styles.button} ${styles.buttonPrimary} ${styles.buttonAction}`}
                disabled={
                  orderPending ||
                  !selectedCustomerId ||
                  lines.every((line) => !line.service_id)
                }
              >
                {orderPending ? "Confirmando pedido…" : "Confirmar pedido"}
              </button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}
