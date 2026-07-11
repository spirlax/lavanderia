"use client";

import Link from "next/link";
import { useActionState, useId, useMemo, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { PaymentMethodSegmented } from "@/components/payments/payment-method-segmented";
import orderStyles from "@/components/orders/orders.module.css";
import styles from "@/components/ui/ui.module.css";
import type {
  ActionResult,
  PaymentMethod,
  ServiceUnit,
} from "@/lib/auth/types";
import { createCustomer } from "@/lib/customers/actions";
import { formatCurrency } from "@/lib/format/money";
import { getDefaultScheduledForLocal } from "@/lib/orders/datetime";
import {
  createOrderAction,
  type CreateOrderActionResult,
} from "@/lib/orders/actions";
import { getPaymentMethodLabel } from "@/lib/payments/labels";
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
  hasOpenCashSession: boolean;
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
  hasOpenCashSession,
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
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashReceived, setCashReceived] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
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

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === selectedCustomerId),
    [customers, selectedCustomerId],
  );

  const selectedServiceIds = useMemo(
    () => new Set(lines.map((line) => line.service_id).filter(Boolean)),
    [lines],
  );

  const summaryLines = useMemo(() => {
    return lines
      .map((line) => {
        const service = services.find((item) => item.id === line.service_id);
        const quantity = Number(line.quantity);
        if (!service || !Number.isFinite(quantity) || quantity <= 0) {
          return null;
        }
        return {
          key: line.key,
          name: service.name,
          quantity,
          unit: getServiceUnitLabel(service.unit),
          amount: service.current_price * quantity,
        };
      })
      .filter((line): line is NonNullable<typeof line> => line !== null);
  }, [lines, services]);

  const estimatedSubtotal = useMemo(
    () => summaryLines.reduce((sum, line) => sum + line.amount, 0),
    [summaryLines],
  );

  const estimatedChange = Math.max(
    0,
    (Number(cashReceived) || 0) - estimatedSubtotal,
  );

  if (!hasOpenCashSession) {
    return (
      <div className={styles.panelStack}>
        <Alert tone="info">
          La caja debe estar abierta para registrar y cobrar pedidos.
        </Alert>
        <Link
          href="/caja"
          className={`${styles.button} ${styles.buttonPrimary} ${styles.buttonAction}`}
        >
          Ir a Caja
        </Link>
      </div>
    );
  }

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

  const canSubmit =
    Boolean(selectedCustomerId) &&
    summaryLines.length > 0 &&
    !(paymentMethod === "cash" && !cashReceived);

  return (
    <div className={orderStyles.layout}>
      <div className={orderStyles.formWithSummary}>
        <div className={orderStyles.formColumn}>
          <section className={`${styles.panel} ${styles.panelStack}`}>
            <h2 className={`${styles.sectionTitle} ${orderStyles.stepTitle}`}>
              <span className={orderStyles.stepIndex} aria-hidden="true">
                1
              </span>
              Cliente
            </h2>

            {selectedCustomer ? (
              <div className={orderStyles.selectedCustomer}>
                <p className={orderStyles.selectedCustomerName}>
                  {selectedCustomer.name}
                </p>
                <p className={orderStyles.selectedCustomerMeta}>
                  {selectedCustomer.phone ?? "Sin teléfono"}
                </p>
              </div>
            ) : null}

            <div className={styles.field}>
              <label
                className={styles.label}
                htmlFor={`${formId}-customer-search`}
              >
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
              <p className={styles.help}>
                Selecciona un cliente para continuar.
              </p>
            ) : null}
          </section>

          <section className={`${styles.panel} ${styles.panelStack}`}>
            <div className={styles.headerRow}>
              <h2 className={`${styles.sectionTitle} ${orderStyles.stepTitle}`}>
                <span className={orderStyles.stepIndex} aria-hidden="true">
                  2
                </span>
                Servicios
              </h2>
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
              const service = services.find(
                (item) => item.id === line.service_id,
              );
              const lineTotal =
                service && Number(line.quantity) > 0
                  ? service.current_price * Number(line.quantity)
                  : null;

              return (
                <div key={line.key} className={orderStyles.lineCard}>
                  <div className={orderStyles.lineHeader}>
                    <h3 className={orderStyles.lineTitle}>
                      Línea {index + 1}
                    </h3>
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
                      Precio: {formatCurrency(service.current_price)}
                      {lineTotal !== null ? (
                        <>
                          {" "}
                          ·{" "}
                          <span className={orderStyles.lineEstimate}>
                            {formatCurrency(lineTotal)}
                          </span>
                        </>
                      ) : null}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </section>

          <section className={`${styles.panel} ${styles.panelStack}`}>
            <h2 className={`${styles.sectionTitle} ${orderStyles.stepTitle}`}>
              <span className={orderStyles.stepIndex} aria-hidden="true">
                3
              </span>
              Pago completo
            </h2>
            <PaymentMethodSegmented
              id={`${formId}-payment-method`}
              value={paymentMethod}
              onChange={(method) => {
                setPaymentMethod(method);
                setCashReceived("");
                setPaymentReference("");
              }}
            />

            {paymentMethod === "cash" ? (
              <>
                <div className={styles.field}>
                  <label
                    className={styles.label}
                    htmlFor={`${formId}-cash-received`}
                  >
                    Efectivo recibido
                  </label>
                  <input
                    id={`${formId}-cash-received`}
                    className={styles.input}
                    inputMode="decimal"
                    value={cashReceived}
                    onChange={(event) => setCashReceived(event.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className={orderStyles.changeDisplay} aria-live="polite">
                  <span>Vuelto estimado</span>
                  <strong>{formatCurrency(estimatedChange)}</strong>
                </div>
              </>
            ) : (
              <div className={styles.field}>
                <label
                  className={styles.label}
                  htmlFor={`${formId}-payment-reference`}
                >
                  Referencia opcional
                </label>
                <input
                  id={`${formId}-payment-reference`}
                  className={styles.input}
                  value={paymentReference}
                  onChange={(event) => setPaymentReference(event.target.value)}
                  maxLength={80}
                  autoComplete="off"
                />
              </div>
            )}
          </section>

          <section className={`${styles.panel} ${styles.panelStack}`}>
            <h2 className={`${styles.sectionTitle} ${orderStyles.stepTitle}`}>
              <span className={orderStyles.stepIndex} aria-hidden="true">
                4
              </span>
              Fecha programada
            </h2>
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
          <div className={orderStyles.summaryHeader}>
            <p className={orderStyles.summaryTotalLabel}>Total estimado</p>
            <p className={orderStyles.summaryTotalValue}>
              {formatCurrency(estimatedSubtotal)}
            </p>
            <p className={styles.help}>
              El total definitivo lo confirma el servidor al guardar.
            </p>
          </div>

          <div className={orderStyles.summaryBlock}>
            <p className={styles.label}>Cliente</p>
            {selectedCustomer ? (
              <>
                <p className={orderStyles.selectedCustomerName}>
                  {selectedCustomer.name}
                </p>
                <p className={styles.help}>
                  {selectedCustomer.phone ?? "Sin teléfono"}
                </p>
              </>
            ) : (
              <p className={styles.help}>Sin cliente seleccionado</p>
            )}
          </div>

          <div className={orderStyles.summaryBlock}>
            <p className={styles.label}>Servicios</p>
            {summaryLines.length > 0 ? (
              <ul className={orderStyles.summaryLines}>
                {summaryLines.map((line) => (
                  <li key={line.key} className={orderStyles.summaryLine}>
                    <span className={orderStyles.summaryLineName}>
                      {line.name} · {line.quantity} {line.unit}
                    </span>
                    <span className={orderStyles.summaryLineAmount}>
                      {formatCurrency(line.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.help}>Añade al menos un servicio</p>
            )}
          </div>

          <div className={orderStyles.summaryBlock}>
            <div className={orderStyles.totalsRow}>
              <span>Método</span>
              <strong>{getPaymentMethodLabel(paymentMethod)}</strong>
            </div>
            {paymentMethod === "cash" && cashReceived ? (
              <div className={orderStyles.totalsRow}>
                <span>Vuelto</span>
                <strong>{formatCurrency(estimatedChange)}</strong>
              </div>
            ) : null}
          </div>

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
            <input type="hidden" name="payment_method" value={paymentMethod} />
            <input type="hidden" name="cash_received" value={cashReceived} />
            <input
              type="hidden"
              name="payment_reference"
              value={paymentReference}
            />
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
              disabled={orderPending || !canSubmit}
            >
              {orderPending
                ? "Guardando pedido y pago…"
                : "Guardar pedido y pago"}
            </button>
            <p className={styles.help}>
              Al confirmar, se abre el detalle del pedido creado.
            </p>
          </form>
        </aside>
      </div>
    </div>
  );
}
