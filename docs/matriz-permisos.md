# Matriz de permisos

| Entidad | Acción | `admin` | `operator` | Condición |
| --- | --- | --- | --- | --- |
| `profiles` | administrar | Sí | No | Rol controlado por servidor. |
| `customers` | crear/consultar | Sí | Sí | `name` obligatorio. |
| `customers` | actualizar/desactivar | Sí | No | Fusión diferida; sin borrado físico. |
| `services` | administrar | Sí | No | Consulta de servicios activos permitida a operator para pedidos. |
| `orders` | crear/consultar | Sí | Sí | Customer y detalles válidos. |
| `orders` | transición normal | Sí | Sí | `received` → `in_process` → `ready`. |
| `orders` | entregar | Sí | Sí | Operator solo con saldo cero; admin puede autorizar saldo con motivo. |
| `orders` | reprocesar/cancelar | Sí | No | Motivo obligatorio. |
| `order_items` | crear/consultar | Sí | Sí | Durante creación; sin eliminación posterior. |
| `order_status_history` | crear | Sistema | Sistema | Solo por transición válida. |
| `order_status_history` | consultar | Sí | Sí | De pedidos visibles; inmutable. |
| `cash_sessions` | abrir/cerrar/consultar | Sí | Sí, propia | Máximo una sesión abierta por operator. |
| `payments` | registrar/consultar | Sí | Sí | Sesión abierta y saldo válido. |
| `payments` | anular | Sí | No | Motivo obligatorio. |
| `cash_movements` | registrar pago/manual | Sí | Sí, propia | Manual requiere motivo. |
| `cash_movements` | anular/ajustar/editar/eliminar | Sí: anular/ajustar | No | Motivo obligatorio; sin edición o borrado. |
| `import_batches` y resúmenes | administrar | Sí | No | Importación exclusiva de admin. |
| `report_runs` | consultar/ejecutar | Sí | No | Medición académica posterior. |
| Entidades diferidas | administrar | Sí | No | Solo cuando se incorporen a una fase autorizada. |

Acciones masivas solo podrán existir para `admin` con validación, vista previa, confirmación y auditoría. La matriz futura se traduce en controles de servidor y RLS, no en permisos visuales.
