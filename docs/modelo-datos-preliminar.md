# Diseño formal del modelo de datos

## Alcance por migración futura

Este documento es un diseño conceptual/lógico; no contiene SQL ni autoriza migraciones.

| Etapa | Entidades |
| --- | --- |
| Primera migración: núcleo operativo | `profiles`, `customers`, `services`, `orders`, `order_items`, `order_status_history` |
| Migración posterior: pagos y caja | `cash_sessions`, `payments`, `cash_movements` |
| Migración posterior: históricos y BI | `import_batches`, `historical_summaries`, `report_runs` |
| Diferidas, fuera de primera migración | `machines`, `system_settings`, `audit_events`, `service_prices`, `cash_registers`, `cash_register_assignments` |

Las entidades diferidas siguen siendo parte del diseño general, pero no deben aparecer en la primera migración.

## Convenciones técnicas aprobadas

- PK: `uuid` generado en servidor.
- Dinero: `numeric(12,2)` en PEN.
- Cantidades: `numeric(12,3)`.
- Subtotal: cantidad × precio, redondeado a dos decimales.
- Total de pedido: suma de subtotales de línea.
- Instantes exactos: `timestamptz`, interpretados en `America/Lima` para operación y reportes.
- Fechas históricas sin hora: `date`.
- Unidades de servicio: `kg`, `unit`, `pair`, `set`, `other`.
- Estados controlados mediante enum conceptual o restricción equivalente.
- Toda entrada externa se valida antes de persistirse.

## Tipos conceptuales controlados

| Tipo | Valores |
| --- | --- |
| `user_role` | `admin`, `operator` |
| `service_unit` | `kg`, `unit`, `pair`, `set`, `other` |
| `order_status` | `received`, `in_process`, `ready`, `delivered`, `cancelled` |
| `data_source` | `platform`, `historical_detailed` |
| `payment_method` | `cash`, `card`, `bank_transfer`, `digital_wallet`, `other` |
| `record_status` | `posted`, `voided` |
| `cash_session_status` | `open`, `closed` |
| `cash_movement_type` | `payment_in`, `payment_void_out`, `manual_income`, `manual_expense`, `adjustment_in`, `adjustment_out` |
| `import_kind` | `historical_detailed`, `historical_daily`, `historical_monthly` |
| `report_run_status` | `started`, `completed`, `failed` |

## Primera migración: núcleo operativo

### `profiles`

| Campo | Tipo | Regla |
| --- | --- | --- |
| `id` | `uuid` | PK; relación 1:1 futura con identidad autenticada. |
| `role` | `user_role` | Obligatorio. |
| `full_name` | `text` | Obligatorio. |
| `active` | `boolean` | Obligatorio. |
| `created_at`, `updated_at` | `timestamptz` | Obligatorios. |
| `created_by`, `updated_by` | `uuid` | FK nullable a `profiles`; bootstrap del primer admin queda pendiente. |

No se elimina un perfil con referencias operativas. El rol se controla en servidor y base de datos, no en `user_metadata`.

### `customers`

| Campo | Tipo | Regla |
| --- | --- | --- |
| `id` | `uuid` | PK. |
| `name` | `text` | Obligatorio. |
| `phone` | `text` | Opcional y no único. |
| `email` | `text` | Opcional; validado si existe. |
| `notes` | `text` | Opcional. |
| `active` | `boolean` | Obligatorio. |
| `created_at`, `updated_at` | `timestamptz` | Obligatorios. |
| `created_by`, `updated_by` | `uuid` | FK a `profiles`. |

No hay fusión de duplicados en esta etapa. Desactivar no elimina pedidos históricos.

### `services`

| Campo | Tipo | Regla |
| --- | --- | --- |
| `id` | `uuid` | PK. |
| `name` | `text` | Obligatorio. |
| `description` | `text` | Opcional. |
| `unit` | `service_unit` | Obligatorio. |
| `current_unit_price` | `numeric(12,2)` | Obligatorio, mayor o igual a cero. |
| `active` | `boolean` | Obligatorio. |
| `created_at`, `updated_at` | `timestamptz` | Obligatorios. |
| `created_by`, `updated_by` | `uuid` | FK a `profiles`. |

El historial de precios se resolverá después mediante `service_prices`; en la primera migración no se reescriben snapshots de pedidos anteriores.

### `orders`

| Campo | Tipo | Regla |
| --- | --- | --- |
| `id` | `uuid` | PK. |
| `order_number` | `text` | Obligatorio y único; formato pendiente. |
| `customer_id` | `uuid` | FK obligatoria a `customers`. |
| `current_status` | `order_status` | Obligatorio; coincide con el último historial válido. |
| `scheduled_for` | `timestamptz` | Obligatorio para pedidos programados por plataforma; referencia de jornada. |
| `received_at` | `timestamptz` | Obligatorio para plataforma. |
| `source_type` | `data_source` | Obligatorio; inicialmente `platform`. |
| `total_amount` | `numeric(12,2)` | Igual a suma de subtotales. |
| `notes` | `text` | Opcional. |
| `created_at` | `timestamptz` | Obligatorio. |
| `created_by` | `uuid` | FK obligatoria a `profiles`. |

Restricciones: al menos un detalle; no borrar físicamente; ningún cambio de estado directo sin historial; un pedido con saldo pendiente solo puede llegar a `delivered` por autorización administrativa con motivo.

### `order_items`

| Campo | Tipo | Regla |
| --- | --- | --- |
| `id` | `uuid` | PK. |
| `order_id` | `uuid` | FK obligatoria a `orders`. |
| `service_id` | `uuid` | FK obligatoria a `services`. |
| `service_name_snapshot` | `text` | Obligatorio. |
| `unit_snapshot` | `service_unit` | Obligatorio. |
| `quantity` | `numeric(12,3)` | Mayor que cero. |
| `unit_price` | `numeric(12,2)` | Mayor o igual a cero. |
| `line_subtotal` | `numeric(12,2)` | Cantidad × precio, redondeado a dos decimales. |
| `created_at` | `timestamptz` | Obligatorio. |
| `created_by` | `uuid` | FK a `profiles`. |

Los snapshots y subtotales de un pedido confirmado no se eliminan ni cambian silenciosamente.

### `order_status_history`

| Campo | Tipo | Regla |
| --- | --- | --- |
| `id` | `uuid` | PK. |
| `order_id` | `uuid` | FK obligatoria a `orders`. |
| `from_status` | `order_status` | Nulo solo en creación. |
| `to_status` | `order_status` | Obligatorio. |
| `changed_at` | `timestamptz` | Obligatorio para plataforma. |
| `changed_by` | `uuid` | FK a `profiles`. |
| `actor_role_snapshot` | `user_role` | Obligatorio. |
| `reason` | `text` | Obligatorio en cancelación, reproceso y entrega administrativa con saldo. |
| `operation_id` | `uuid` | Obligatorio y único para idempotencia. |

Es inmutable y permite obtener instantes de `ready`, `delivered` y `cancelled` para indicadores.

## Migración posterior: pagos y caja

### `cash_sessions`

| Campo | Tipo | Regla |
| --- | --- | --- |
| `id` | `uuid` | PK. |
| `operator_id` | `uuid` | FK a `profiles`; responsable de sesión. |
| `status` | `cash_session_status` | Obligatorio. |
| `opening_amount` | `numeric(12,2)` | Mayor o igual a cero. |
| `opened_at`, `closed_at` | `timestamptz` | Apertura obligatoria; cierre al cerrar. |
| `expected_closing_amount` | `numeric(12,2)` | Se guarda al cierre. |
| `counted_closing_amount` | `numeric(12,2)` | Se guarda al cierre. |
| `difference_amount` | `numeric(12,2)` | Contado − esperado. |
| `opened_by`, `closed_by` | `uuid` | FK a `profiles`. |
| `closing_notes` | `text` | Opcional. |

Restricción principal: una sola sesión `open` por `operator`. Las cajas físicas y asignaciones se difieren.

### `payments`

| Campo | Tipo | Regla |
| --- | --- | --- |
| `id` | `uuid` | PK. |
| `order_id` | `uuid` | FK obligatoria a `orders`. |
| `cash_session_id` | `uuid` | FK obligatoria para pago operativo. |
| `amount` | `numeric(12,2)` | Mayor que cero y no mayor al saldo vigente. |
| `method` | `payment_method` | Obligatorio. |
| `method_detail` | `text` | Obligatorio si método es `other`. |
| `status` | `record_status` | Obligatorio. |
| `paid_at` | `timestamptz` | Obligatorio. |
| `external_reference` | `text` | Opcional, sin secretos. |
| `created_at`, `created_by` | tiempo/FK | Obligatorios. |
| `voided_at`, `voided_by`, `void_reason` | tiempo/FK/text | Obligatorios si se anula. |

Pago total, adelanto y saldo se derivan, no son campos mutables. No se borra ni edita un pago.

### `cash_movements`

| Campo | Tipo | Regla |
| --- | --- | --- |
| `id` | `uuid` | PK. |
| `cash_session_id` | `uuid` | FK a sesión abierta. |
| `movement_type` | `cash_movement_type` | Obligatorio. |
| `amount` | `numeric(12,2)` | Positivo; el tipo define sentido. |
| `payment_id` | `uuid` | FK nullable; obligatoria para pago/reverso de efectivo. |
| `reason` | `text` | Obligatorio en manuales, anulaciones y ajustes. |
| `status` | `record_status` | Obligatorio. |
| `occurred_at`, `created_by` | tiempo/FK | Obligatorios. |
| `voided_at`, `voided_by`, `void_reason` | tiempo/FK/text | Obligatorios si se anula. |

`operator` registra únicamente `payment_in`, `manual_income` y `manual_expense` en su sesión abierta. Solo `admin` anula o registra ajustes. Pagos no efectivos no generan ingreso de efectivo.

## Migración posterior: históricos y BI

### `import_batches`

Campos: `id` (PK), `kind`, `source_file_name`, `source_file_hash`, `mapping_version`, `source_timezone` nullable, conteos de filas, resumen de validación, `imported_at`, `imported_by`, estado y datos de reversión justificada.

Solo `admin` importa. La combinación de tipo y huella evita duplicados accidentales.

### Extensión histórica de pedidos y pagos

Una migración histórica agregará a pedidos, detalles, historiales y pagos evidencia de origen: `source_type`, `import_batch_id`, `source_reference`, `source_row_number` y fechas `date` cuando no exista hora. Los pedidos históricos detallados usan estas entidades solo si existe evidencia individual.

### `historical_summaries`

Campos: `id` (PK), `import_batch_id` (FK), `granularity` (`day`/`month`), `period_start`, `period_end`, conteo de pedidos y monto de ingresos solo cuando existan en la fuente, `source_values`, fila/referencia de origen y `created_at`.

No tiene FK a customers, pedidos, pagos, sesiones o movimientos. Nunca representa operaciones ficticias.

### `report_runs`

| Campo | Tipo | Regla |
| --- | --- | --- |
| `id` | `uuid` | PK. |
| `started_at`, `completed_at` | `timestamptz` | Obligatorios según estado. |
| `duration_ms` | entero no negativo | `completed_at − started_at` en milisegundos. |
| `report_type` | `text` | Obligatorio. |
| `filters` | `jsonb` | Filtros validados sin secretos. |
| `status` | `report_run_status` | Obligatorio. |
| `requested_by` | `uuid` | FK nullable a `profiles`. |

Se conservará para la medición semanal del tiempo de generación de reportes.

## Entidades diferidas del diseño general

| Entidad | Propósito | Condición para incorporarla |
| --- | --- | --- |
| `service_prices` | Vigencia e historial de precios | Cuando la operación confirme cambios de precio y vigencias. |
| `cash_registers` | Caja física/lógica | Cuando se definan cajas reales. |
| `cash_register_assignments` | Asignación de caja física a persona | Después de definir cajas reales y turnos. |
| `machines` | Catálogo de máquinas | Sin relación con pedidos hasta que exista necesidad validada. |
| `system_settings` | Configuración funcional no secreta | Tras definir parámetros operativos reales. |
| `audit_events` | Bitácora transversal | Cuando se implemente auditoría técnica centralizada. |

## Relaciones y cardinalidades

- `profiles` 1 — 0..N registros operativos creados o modificados.
- `customers` 1 — 0..N `orders`; cada pedido tiene un customer.
- `services` 1 — 0..N `order_items`.
- `orders` 1 — 1..N `order_items`, 1 — 1..N `order_status_history` y 1 — 0..N `payments`.
- `cash_sessions` 1 — 0..N `payments` y 1 — 0..N `cash_movements`.
- `payments` 1 — 0..N movimientos; solo efectivo genera movimientos de caja.
- `import_batches` 1 — 0..N pedidos históricos detallados o resúmenes según tipo.
- `historical_summaries` permanece separada de operaciones individuales.

## Restricciones e índices previsibles

- Único: `orders.order_number`, `order_status_history.operation_id`, una sesión abierta por operator y huella/tipo de importación.
- Índices: pedidos por `customer_id`, `scheduled_for`, estado y fecha; historial por pedido/fecha/estado; pagos por pedido/sesión/fecha; movimientos por sesión/fecha; reportes por tipo/fecha/estado.
- Restricciones transaccionales: total de pedido = suma de subtotales; saldo no negativo; transición válida; sesión abierta requerida; anulación con motivo.
- No hay cascadas destructivas desde customers, pedidos, perfiles, sesiones o lotes.

## Eliminación y datos auditables

- Profiles, customers y servicios se desactivan cuando haya referencias.
- Pedidos, detalles confirmados, historiales, pagos, sesiones, movimientos, lotes, resúmenes y ejecuciones de reporte no se eliminan físicamente.
- Se auditan cambios de rol, servicios, pedidos, transiciones, entregas con saldo, pagos, anulaciones, sesiones, movimientos, importaciones y reportes.
- La auditoría no conservará contraseñas, tokens, claves, números completos de tarjeta ni secretos.

## Seguridad futura en Supabase

Las tablas expuestas tendrán RLS y políticas específicas por fila, operación y rol. La autorización de servidor y RLS se probarán juntas; `authenticated` por sí solo no concede acceso global. La exposición Data API y los privilegios se revisarán separadamente de RLS. Esta fase no crea tablas, políticas, funciones, vistas ni SQL.
