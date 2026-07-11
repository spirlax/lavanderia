/**
 * Self-check for order validation helpers (creación + transiciones + búsqueda).
 * Run: pnpm exec tsx --no-cache scripts/verify-2c1-order-validation.ts
 * Or via: pnpm verify:2c1
 *
 * No database writes. No seed data.
 */

import assert from "node:assert/strict";

import {
  mapCreateOrderError,
  mapTransitionOrderError,
} from "../lib/orders/errors";
import {
  limaDateBoundsUtc,
  limaDateTimeLocalToTimestamptz,
} from "../lib/orders/datetime";
import {
  createOrderSchema,
  searchOrdersSchema,
  toCreateOrderRpcItems,
  transitionOrderSchema,
} from "../lib/orders/validation";
import {
  ACTIVE_ORDER_STATUSES,
  isActiveOrderStatus,
} from "../lib/orders/status";
import {
  assertTransitionAllowed,
  listAvailableTransitions,
} from "../lib/orders/transitions";

const validCustomer = "11111111-1111-4111-8111-111111111111";
const serviceA = "22222222-2222-4222-8222-222222222222";
const serviceB = "33333333-3333-4333-8333-333333333333";
const operationId = "44444444-4444-4444-8444-444444444444";
const orderId = "55555555-5555-4555-8555-555555555555";

function expectFail(input: unknown, messageIncludes?: string) {
  const result = createOrderSchema.safeParse(input);
  assert.equal(result.success, false);
  if (messageIncludes && !result.success) {
    const flat = JSON.stringify(result.error.flatten());
    assert.ok(
      flat.toLowerCase().includes(messageIncludes.toLowerCase()) ||
        result.error.message
          .toLowerCase()
          .includes(messageIncludes.toLowerCase()),
      `Expected failure mentioning "${messageIncludes}", got ${flat}`,
    );
  }
}

// datetime Lima
assert.equal(
  limaDateTimeLocalToTimestamptz("2026-07-10T15:30"),
  "2026-07-10T15:30:00-05:00",
);
assert.equal(limaDateTimeLocalToTimestamptz("not-a-date"), null);

const dayBounds = limaDateBoundsUtc("2026-07-10");
assert.ok(dayBounds);
assert.equal(
  dayBounds.startIso,
  new Date("2026-07-10T00:00:00-05:00").toISOString(),
);
assert.equal(
  dayBounds.endIso,
  new Date("2026-07-11T00:00:00-05:00").toISOString(),
);

// empty items
expectFail({
  customer_id: validCustomer,
  scheduled_for: "2026-07-10T15:30",
  operation_id: operationId,
  items: [],
});

// quantity zero
expectFail({
  customer_id: validCustomer,
  scheduled_for: "2026-07-10T15:30",
  operation_id: operationId,
  items: [{ service_id: serviceA, quantity: "0" }],
});

// negative quantity
expectFail({
  customer_id: validCustomer,
  scheduled_for: "2026-07-10T15:30",
  operation_id: operationId,
  items: [{ service_id: serviceA, quantity: "-1" }],
});

// duplicate services
expectFail({
  customer_id: validCustomer,
  scheduled_for: "2026-07-10T15:30",
  operation_id: operationId,
  items: [
    { service_id: serviceA, quantity: "1" },
    { service_id: serviceA, quantity: "2" },
  ],
});

// valid payload strips to service_id + quantity only for RPC
const ok = createOrderSchema.safeParse({
  customer_id: validCustomer,
  scheduled_for: "2026-07-10T15:30",
  operation_id: operationId,
  items: [
    { service_id: serviceA, quantity: "1.5" },
    { service_id: serviceB, quantity: "2" },
  ],
});
assert.equal(ok.success, true);
if (ok.success) {
  const rpcItems = toCreateOrderRpcItems(ok.data.items);
  assert.deepEqual(rpcItems, [
    { service_id: serviceA, quantity: 1.5 },
    { service_id: serviceB, quantity: 2 },
  ]);
  for (const item of rpcItems) {
    assert.deepEqual(Object.keys(item).sort(), ["quantity", "service_id"]);
  }
}

// active statuses
assert.deepEqual([...ACTIVE_ORDER_STATUSES], [
  "received",
  "in_process",
  "ready",
]);
assert.equal(isActiveOrderStatus("delivered"), false);
assert.equal(isActiveOrderStatus("ready"), true);

// friendly error mapping
assert.match(
  mapCreateOrderError({ message: "active customer required" }),
  /cliente/i,
);
assert.match(
  mapCreateOrderError({ message: "items[1] duplicates service_id" }),
  /repetir/i,
);
assert.match(
  mapCreateOrderError({ message: "at least one order item is required" }),
  /menos un servicio/i,
);

assert.match(
  mapTransitionOrderError({
    message: "operator cannot deliver an order with outstanding balance",
  }),
  /saldo/i,
);
assert.match(
  mapTransitionOrderError({ message: "cancellation requires a reason" }),
  /motivo/i,
);

// transition schema
const transitionOk = transitionOrderSchema.safeParse({
  order_id: orderId,
  to_status: "in_process",
  operation_id: operationId,
  reason: "",
});
assert.equal(transitionOk.success, true);
if (transitionOk.success) {
  assert.equal(transitionOk.data.reason, null);
}

// search schema
const searchOk = searchOrdersSchema.safeParse({
  q: " Ana ",
  status: "",
  date: "2026-07-10",
});
assert.equal(searchOk.success, true);
if (searchOk.success) {
  assert.equal(searchOk.data.q, "Ana");
  assert.equal(searchOk.data.status, undefined);
  assert.equal(searchOk.data.date, "2026-07-10");
}

// role transition matrix (UI + server gate)
const operatorReceived = listAvailableTransitions("operator", "received", 9);
assert.deepEqual(
  operatorReceived.map((a) => a.toStatus),
  ["in_process"],
);

const operatorReadyWithBalance = listAvailableTransitions(
  "operator",
  "ready",
  9,
);
assert.equal(operatorReadyWithBalance.length, 0);

const adminReadyWithBalance = listAvailableTransitions("admin", "ready", 9);
assert.ok(
  adminReadyWithBalance.some(
    (a) => a.toStatus === "delivered" && a.requiresReason,
  ),
);
assert.ok(
  adminReadyWithBalance.some(
    (a) => a.toStatus === "in_process" && a.requiresReason,
  ),
);
assert.ok(
  adminReadyWithBalance.some(
    (a) => a.toStatus === "cancelled" && a.requiresReason,
  ),
);

assert.equal(
  assertTransitionAllowed({
    role: "operator",
    fromStatus: "ready",
    toStatus: "delivered",
    balanceDue: 9,
    reason: null,
  }).ok,
  false,
);

assert.equal(
  assertTransitionAllowed({
    role: "admin",
    fromStatus: "ready",
    toStatus: "delivered",
    balanceDue: 9,
    reason: "Cliente pagará después",
  }).ok,
  true,
);

assert.equal(
  assertTransitionAllowed({
    role: "admin",
    fromStatus: "ready",
    toStatus: "cancelled",
    balanceDue: 0,
    reason: null,
  }).ok,
  false,
);

console.log("verify-2c1-order-validation: ok");
