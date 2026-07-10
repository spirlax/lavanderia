# Revisión de la migración 001

## Alcance

Archivo revisado: `supabase/migrations/001_initial_core_schema.sql`.

La migración crea únicamente el núcleo operativo aprobado: `profiles`, `customers`, `services`, `orders`, `order_items` y `order_status_history`. No incluye pagos, caja, importaciones, resúmenes, reportes, máquinas, configuración, auditoría transversal, historial de precios ni cajas físicas.

No se ejecutó SQL, no se enlazó la CLI y no se modificó el proyecto remoto de Supabase.

## Extensiones y tipos controlados

No se instala ninguna extensión. `gen_random_uuid()` está disponible de forma nativa en PostgreSQL 15 o posterior, versión compatible con la plataforma actual de Supabase.

Se crean cuatro enums en `public`:

- `user_role`: `admin`, `operator`.
- `service_unit`: `kg`, `unit`, `pair`, `set`, `other`.
- `order_status`: `received`, `in_process`, `ready`, `delivered`, `cancelled`.
- `order_source`: `platform`, `historical_detailed`.

El esquema usa `numeric(12,2)` para importes, `numeric(12,3)` para cantidades y `timestamptz` para momentos exactos. Los importes son PEN. `America/Lima` es una regla de interpretación de negocio y no se fuerza como zona horaria global de la base de datos.

## Tablas y relaciones

### `profiles`

- PK y FK 1:1: `id` → `auth.users.id` con `ON DELETE RESTRICT`.
- Rol, nombre completo y estado activo obligatorios.
- No usa `user_metadata` para autorización.

La restricción de borrado preserva actores referenciados. El alta segura del primer `admin` continúa pendiente.

### `customers`

- PK UUID generada en base de datos.
- `created_by` → `profiles.id` con borrado restringido.
- Nombre obligatorio; teléfono, correo y notas opcionales.
- El teléfono no tiene restricción única.
- `is_active` permite desactivar sin borrar.

### `services`

- PK UUID generada en base de datos.
- Unidad restringida al enum aprobado.
- Precio actual no negativo en PEN.
- `is_active` permite retirar servicios del catálogo sin alterar pedidos previos.

### `orders`

- PK UUID generada en base de datos.
- `customer_id` → `customers.id`, `created_by` → `profiles.id` y autorización de saldo → `profiles.id`, todas con borrado restringido.
- `order_number` es obligatorio y globalmente único. El formato futuro recomendado para pedidos de plataforma es `LAV-AAAA-NNNNNN`; su generación definitiva se implementará en una función transaccional posterior y no se insertan números ficticios.
- Fuente restringida a plataforma o histórico detallado.
- `received_at` es obligatorio para cualquier estado. Para `platform`, `scheduled_for` también es obligatorio; este último permanece anulable solo para históricos detallados cuya fuente no lo contenga.
- Los estados y sus timestamps se validan de forma coherente. `ready_at` puede conservarse después de `ready`, incluso si el pedido se entrega o se cancela desde ese estado; timestamps de estados futuros no se admiten en estados anteriores.
- Para una cancelación que conserve `ready_at`, la futura función transaccional deberá comprobar que el historial contiene la transición previa a `ready`; la restricción local también exige que `cancelled_at >= ready_at`.
- Los cinco importes son no negativos; `total = subtotal - discount`, `amount_paid <= total` y `balance_due = greatest(total - amount_paid, 0)`.
- `amount_paid` y `balance_due` tienen valor inicial predeterminado cero. Al crear un pedido con total positivo, la operación transaccional debe fijar `balance_due` de forma coherente. En la fase de pagos, únicamente funciones transaccionales del servidor podrán actualizar ambos acumulados; no serán columnas controlables directamente por el cliente.
- Una entrega con saldo exige actor autorizador y motivo. La comprobación de que el actor sea un `admin` activo queda para la función transaccional futura.
- Triggers impiden `DELETE` y `TRUNCATE`.

### `order_items`

- `order_id` → `orders.id` con borrado restringido.
- `service_id` es opcional y usa `ON DELETE SET NULL`; los snapshots preservan nombre, unidad y precio aplicados.
- La cantidad es positiva y los importes no son negativos.
- `line_total` debe ser `round(quantity * unit_price, 2)`.

### `order_status_history`

- `order_id` → `orders.id` y `changed_by` → `profiles.id`, ambos con borrado restringido.
- El primer registro permite `from_status` nulo para conservar el primer estado realmente conocido de un histórico sin inventar movimientos.
- Los pares posteriores se limitan a las transiciones aprobadas.
- Cancelación y retorno de `ready` a `in_process` exigen motivo.
- `actor_role_snapshot` conserva el rol registrado durante la operación.
- `operation_id` único prepara idempotencia.
- Triggers impiden actualización, eliminación y truncado.

Las duplicaciones del modelo son deliberadas: los snapshots conservan lo vendido aunque cambie el catálogo; `orders.status` permite consultar la situación actual sin reconstruir todo el historial; y `actor_role_snapshot` conserva el contexto de auditoría. Su sincronía debe garantizarse mediante las operaciones transaccionales futuras descritas más adelante.

## Índices

- Todos los campos FK tienen índice, incluida la FK opcional a servicios mediante índice parcial.
- `orders` tiene índices para customer, creador, autorizador, jornada y cola de estados activos.
- `order_status_history` tiene índices por pedido/fecha, actor y estado destino/fecha.
- Customers y servicios activos tienen índices parciales por nombre.
- Las restricciones únicas de `order_number` y `operation_id` crean sus propios índices.

Estos índices cubren las consultas operativas previsibles y los datos requeridos por los indicadores. Su ajuste final dependerá de consultas y volumen reales.

## RLS y exposición futura

RLS queda habilitado en las seis tablas. Esta migración no crea políticas ni concede privilegios de Data API.

Mientras no existan políticas, `anon` y `authenticated` no obtienen acceso por filas aunque el proyecto conserve grants heredados. Una migración posterior debe revisar conjuntamente:

- grants explícitos según la configuración vigente de Data API;
- políticas de lectura y escritura para `admin` y `operator`;
- `USING` y `WITH CHECK` para actualizaciones;
- autorización basada en `profiles.role`, nunca en `user_metadata`;
- pruebas de acceso denegado y permitido por operación.

Las políticas y los privilegios futuros deberán impedir actualizaciones directas del cliente sobre `amount_paid`, `balance_due`, estado, timestamps y campos de autorización. Los cambios se expondrán mediante operaciones transaccionales de servidor con permisos mínimos.

## Inventario exacto auditado

### Restricciones `CHECK`

- `profiles_full_name_not_blank_check`.
- `customers_name_not_blank_check`, `customers_phone_not_blank_check`, `customers_email_not_blank_check`.
- `services_name_not_blank_check`, `services_current_price_nonnegative_check`.
- `orders_order_number_not_blank_check`, `orders_platform_timestamps_check`, `orders_amounts_nonnegative_check`, `orders_discount_not_above_subtotal_check`, `orders_total_consistency_check`, `orders_amount_paid_not_above_total_check`, `orders_balance_consistency_check`, `orders_status_timestamps_check`, `orders_event_chronology_check`, `orders_delivery_with_balance_check`.
- `order_items_service_name_snapshot_not_blank_check`, `order_items_quantity_positive_check`, `order_items_amounts_nonnegative_check`, `order_items_line_total_consistency_check`.
- `order_status_history_transition_check`, `order_status_history_reason_check`.

### Claves foráneas y borrado

- `profiles.id` → `auth.users.id`: `ON DELETE RESTRICT`.
- `customers.created_by` → `profiles.id`: `ON DELETE RESTRICT`.
- `orders.customer_id` → `customers.id`: `ON DELETE RESTRICT`.
- `orders.created_by` → `profiles.id`: `ON DELETE RESTRICT`.
- `orders.delivery_with_balance_authorized_by` → `profiles.id`: `ON DELETE RESTRICT`.
- `order_items.order_id` → `orders.id`: `ON DELETE RESTRICT`.
- `order_items.service_id` → `services.id`: `ON DELETE SET NULL`; nombre, unidad y precio permanecen en snapshots obligatorios.
- `order_status_history.order_id` → `orders.id`: `ON DELETE RESTRICT`.
- `order_status_history.changed_by` → `profiles.id`: `ON DELETE RESTRICT`.

No existe `ON DELETE CASCADE` ni `ON UPDATE CASCADE`.

### Funciones y triggers

- `set_updated_at()`: función trigger con privilegios de invocador predeterminados y `search_path` vacío; asigna `statement_timestamp()` antes de actualizar. No modifica nuevamente la tabla y no produce recursión.
- `reject_protected_operation()`: función trigger con privilegios de invocador predeterminados y `search_path` vacío; rechaza la operación protegida.
- Triggers de actualización: `profiles_set_updated_at`, `customers_set_updated_at`, `services_set_updated_at`, `orders_set_updated_at`.
- Protección de pedidos: `orders_reject_delete`, `orders_reject_truncate`.
- Inmutabilidad del historial: `order_status_history_reject_update_delete`, `order_status_history_reject_truncate`.

No existe ninguna función `SECURITY DEFINER`.

### RLS, `GRANT` y `REVOKE`

La migración contiene `ENABLE ROW LEVEL SECURITY` para `profiles`, `customers`, `services`, `orders`, `order_items` y `order_status_history`.

No contiene políticas, `GRANT` ni `REVOKE`. Los grants mínimos y las políticas se implementarán juntos en una migración separada. La autorización depende de `profiles.role` y no de `user_metadata`.

### Compatibilidad con base vacía

- Los enums y funciones auxiliares se crean antes de las tablas que los utilizan.
- Las tablas se crean según sus dependencias: `profiles`, `customers`, `services`, `orders`, `order_items`, `order_status_history`.
- `auth.users` es la única dependencia externa y forma parte del esquema administrado por Supabase Auth.
- No se referencia ninguna tabla de fases posteriores.
- No se insertan usuarios, customers, servicios, pedidos, detalles, historiales ni datos de prueba.

## Resultado de la auditoría

### Controles satisfactorios

- No hay `ON DELETE CASCADE` ni `ON UPDATE CASCADE`.
- Pedidos e historiales no admiten eliminación física; el historial tampoco admite actualización.
- La FK opcional de `order_items.service_id` no elimina snapshots.
- Estado, timestamps, cancelación, entrega con saldo e importes tienen restricciones locales.
- No se usa `float`, no hay datos ficticios y no existe lógica tributaria.
- No se crean entidades fuera del alcance.

### Riesgos residuales

1. Un `CHECK` no puede comparar `orders.subtotal` con la suma de todas sus líneas. Sin una operación transaccional, ambos valores podrían divergir.
2. La base no obliga declarativamente a que un pedido tenga al menos una línea al confirmar su creación.
3. `orders.status`, sus timestamps y el último historial podrían divergir si se escriben por separado.
4. La restricción de transiciones valida pares dentro del historial, pero no comprueba que `from_status` coincida con el estado actual del pedido.
5. `actor_role_snapshot` y la autorización de entrega con saldo no verifican por sí mismos el rol vigente del perfil.
6. Los históricos detallados sin `received_at` ni timestamps exactos de `ready`, `delivered` o `cancelled` no pueden representar esos estados todavía. La estructura real del Excel y el modelado de precisión temporal siguen pendientes.
7. `source` distingue el origen general, pero aún no existen `import_batches`, referencia de archivo o número de fila. No debe ejecutarse una importación histórica antes de incorporar esa trazabilidad en una migración posterior.
8. `amount_paid` y `balance_due` cumplen su ecuación local, pero la futura tabla de pagos deberá actualizar esos acumulados en la misma transacción para evitar divergencias.
9. Las funciones de protección y `updated_at` están en `public`. Son funciones trigger y no exponen una mutación útil por llamada directa, pero sus privilegios y ubicación deben revisarse junto con la migración de seguridad.
10. No fue posible ejecutar un parser PostgreSQL local porque el repositorio no dispone de `psql`, Supabase CLI ni un linter SQL. La revisión de sintaxis es estática hasta contar con un entorno local seguro autorizado.

## Lógica transaccional futura

Las siguientes acciones deben implementarse posteriormente como operaciones de servidor y base de datos atómicas, después de aprobar la migración de seguridad:

- crear un pedido con al menos un detalle, calcular líneas, subtotal, descuento, total y saldo, e insertar el primer historial;
- cambiar estado bloqueando la fila del pedido, validar el último historial, actor y transición, actualizar timestamps y agregar historial en la misma transacción;
- autorizar entrega con saldo únicamente para un `admin` activo y con motivo;
- cancelar únicamente como `admin`, conservando el motivo y, cuando existan pagos, la decisión administrativa sin devolución automática;
- recalcular importes tras cambios permitidos en detalles antes de confirmar el pedido;
- impedir cambios de detalle después de que el pedido alcance una etapa que se defina como confirmada;
- importar históricos detallados sin inventar estados, timestamps, customers ni movimientos ausentes en la fuente.

## Decisiones aún pendientes

- Estructura y precisión temporal reales del Excel.
- Hora oficial de cierre de jornada.
- Catálogo y precios reales de servicios.
- Datos y procedimiento de alta del primer `admin`.
- Política de devoluciones parciales.
- Posibles requisitos nuevos del dueño.

## Dictamen final

La auditoría estáticamente verificable queda **APROBADA**. La migración está preparada para ejecutarse desde cero en una base Supabase vacía, pero continúa sin autorización de ejecución remota. La validación sintáctica ejecutada contra PostgreSQL seguirá pendiente hasta disponer de un entorno local seguro o una autorización posterior.
