# Pruebas Subfase 2C1 — pedidos (creación, listado, detalle)

## Automatizadas (sin base de datos)

```bash
pnpm verify:2c1
```

Cubre validación Zod, conversión `datetime-local` → Lima, payload RPC solo con `service_id`/`quantity`, estados activos y mensajes amigables.

## Manuales reproducibles

Prerrequisitos: usuarios reales `admin` y `operator`, al menos un servicio activo y un cliente activo creados manualmente (sin seeds).

1. Sin sesión: `/`, `/nuevo`, `/pedidos/<uuid>` redirigen a `/login`.
2. Admin y operator entran a `/nuevo`.
3. Operator no ve servicios inactivos en el selector (RLS + filtro `is_active`).
4. En DevTools, el FormData de creación solo incluye `customer_id`, `scheduled_for`, `operation_id` e `items` con `service_id`/`quantity` (sin precios).
5. Intentar dos líneas del mismo servicio: el selector deshabilita el duplicado; Zod/RPC lo rechazan si se fuerza.
6. Cantidad `0` o negativa: error de validación; no se crea pedido.
7. Pedido sin líneas: botón deshabilitado / validación.
8. Doble clic en confirmar: botón `disabled` mientras `pending`; un solo `operation_id` por intento.
9. Reenviar el mismo `operation_id` (mismo actor): respuesta con `reused_existing` y el mismo pedido.
10. Sin servicios activos: mensaje claro; admin ve enlace a `/admin/servicios`; operator ve aviso al administrador.
11. Sin clientes: alta rápida reutiliza `createCustomer` y selecciona el nuevo sin duplicar.
12. `/` lista solo `received` | `in_process` | `ready`, máximo 50, orden por `scheduled_for` luego `created_at`.
13. `/pedidos/[id]` muestra snapshots, totales del servidor e historial; sin botones de transición.
14. Operator no ve enlaces `/admin/**`; admin puede volver al panel desde operación.

No dejar datos de prueba permanentes: si se crean pedidos/clientes temporales, desactivarlos o eliminarlos solo con autorización explícita y procedimiento controlado.
