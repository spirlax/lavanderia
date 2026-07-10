# Reglas de negocio

## Alcance y etapas

La Fase 1A cierra el diseño documental. No autoriza SQL, migraciones, conexión con Supabase/Vercel, interfaz ni datos simulados.

La primera migración futura contendrá únicamente el núcleo operativo: `profiles`, `customers`, `services`, `orders`, `order_items` y `order_status_history`. Pagos, caja, históricos y BI se implementarán en migraciones posteriores; sus diseños se conservan en este documento y en el modelo formal.

## Convenciones aprobadas

- Moneda operativa: PEN.
- Zona horaria de negocio: `America/Lima`.
- Cantidades: `numeric(12,3)`.
- Importes monetarios: `numeric(12,2)`; nunca `float`.
- Unidades iniciales: `kg`, `unit`, `pair`, `set`, `other`.
- El subtotal de cada detalle se redondea a dos decimales.
- El total del pedido es la suma de los subtotales de sus detalles.
- Tributación y facturación electrónica no se implementan.
- Los momentos exactos usan `timestamptz`; las fuentes históricas sin hora conservan `date`.

## Roles

### `admin`

- Acceso administrativo completo a usuarios, configuración, servicios, precios, pedidos, pagos, caja, importaciones, reportes, BI y máquinas cuando esas entidades se incorporen.
- Puede cancelar pedidos, anular pagos o movimientos y autorizar entregas con saldo, siempre con motivo obligatorio y trazabilidad.

### `operator`

- Registra y consulta `customers`.
- Crea y consulta pedidos.
- Ejecuta transiciones operativas permitidas y entrega pedidos sin saldo pendiente.
- Registra pagos.
- Mantiene como máximo una sesión de caja abierta y registra movimientos manuales de ingreso o gasto con motivo.
- No edita, elimina, anula ni ajusta movimientos; no cancela pedidos; no administra usuarios, configuración sensible, importaciones, precios, servicios o máquinas.

La autorización se verificará en servidor y con RLS en toda tabla expuesta. No se usará `service_role` en navegador ni `user_metadata` editable como fuente de autorización.

## Customers y servicios

1. `customers.name` es obligatorio; `phone`, `email` y `notes` son opcionales.
2. `phone` no es único.
3. La fusión de duplicados se difiere; no se elimina un customer con pedidos.
4. Todo pedido pertenece a un customer y tiene al menos un detalle.
5. Todo detalle conserva snapshots de servicio, unidad y precio aplicados.
6. Cambiar un servicio o precio no modifica pedidos anteriores.
7. Servicios y precios reales se confirmarán con el dueño antes de cargarlos.

## Pedidos

1. Los únicos estados son `received`, `in_process`, `ready`, `delivered` y `cancelled`.
2. Un pedido creado por plataforma inicia en `received`.
3. Todo cambio conserva estado anterior, nuevo estado, actor, fecha, origen y motivo cuando aplique.
4. `delivered` y `cancelled` son terminales.
5. No se permiten saltos `received` → `ready`/`delivered` ni `in_process` → `delivered`.
6. Solo `admin` puede cancelar desde `received`, `in_process` o `ready`, con motivo.
7. Solo `admin` puede devolver `ready` a `in_process` por reproceso o corrección, con motivo.
8. Cada pedido programable conserva `scheduled_for`; este dato define la jornada de atención para indicadores.
9. `operator` no puede marcar `delivered` si existe saldo pendiente.
10. `admin` puede autorizar `delivered` con saldo pendiente únicamente con motivo obligatorio y auditoría.

## Pagos y caja

1. El saldo es total del pedido menos pagos vigentes.
2. Un pago es positivo y no supera el saldo, salvo una regla posterior aprobada.
3. Pago total, adelanto y pago de saldo son clasificaciones derivadas del saldo previo; no alteran el importe original.
4. Los métodos iniciales son `cash`, `card`, `bank_transfer`, `digital_wallet` y `other`; `other` requiere descripción.
5. Los pagos y movimientos no se editan ni eliminan. Una anulación conserva el registro original, actor, fecha y motivo.
6. Una operadora solo puede tener una sesión de caja abierta.
7. `operator` puede registrar pagos y movimientos manuales de ingreso o gasto en su sesión abierta, con motivo para los movimientos manuales.
8. Los pagos no efectivos se concilian por método, pero no aumentan el efectivo esperado.
9. Solo `admin` anula pagos o movimientos y realiza ajustes justificados.
10. Al cancelar un pedido con pagos no se genera devolución automática; la decisión administrativa se registra. Devoluciones parciales y créditos se difieren.

## Históricos y auditoría

1. Los datos de plataforma, pedidos históricos detallados, resúmenes diarios y resúmenes mensuales se distinguen por procedencia y entidad.
2. Un resumen histórico nunca se transforma en pedidos, `customers`, pagos, sesiones o movimientos ficticios.
3. Todo dato importado conserva lote, archivo, versión de mapeo y referencia de origen disponible.
4. No se usan resultados históricos de la tesis como datos simulados del nuevo sistema.
5. Operaciones sensibles conservan actor, fecha, motivo y valores relevantes antes/después cuando aplique.

## Indicadores

Las fórmulas definitivas, los datos requeridos y las reglas de elegibilidad están en `docs/indicadores-tesis.md`. Los cálculos no se implementan en esta fase.
