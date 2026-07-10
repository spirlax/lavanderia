# Flujo de pedidos

## Estados

| Estado | Significado |
| --- | --- |
| `received` | Pedido recibido y registrado. |
| `in_process` | Pedido en ejecución operativa. |
| `ready` | Pedido terminado y disponible para recoger. |
| `delivered` | Pedido entregado. Terminal. |
| `cancelled` | Pedido cancelado con motivo. Terminal. |

No se crean estados de pago, atraso o reproceso: saldo, fechas e historial cubren esos conceptos.

## Transiciones permitidas

| Desde | Hacia | Actor | Condición |
| --- | --- | --- |
| creación | `received` | `admin`, `operator` | Customer y al menos un detalle válido. |
| `received` | `in_process` | `admin`, `operator` | Inicio operativo. |
| `received` | `cancelled` | `admin` | Motivo obligatorio. |
| `in_process` | `ready` | `admin`, `operator` | Trabajo terminado. |
| `in_process` | `cancelled` | `admin` | Motivo obligatorio. |
| `ready` | `delivered` | `operator` | Saldo igual a cero. |
| `ready` | `delivered` | `admin` | Saldo cero o autorización explícita con motivo si existe saldo. |
| `ready` | `in_process` | `admin` | Reproceso/corrección con motivo. |
| `ready` | `cancelled` | `admin` | Motivo y decisión administrativa sobre pagos existentes. |

No hay transiciones desde `delivered` o `cancelled`, ni transiciones hacia el mismo estado.

## Programación y jornada

- `scheduled_for` identifica cuándo un pedido corresponde a una jornada de atención.
- Un pedido programado participa en el indicador de cumplimiento solo en la jornada que corresponde a ese valor.
- La hora oficial de cierre de jornada queda pendiente; hasta entonces no se implementan cálculos automáticos.

## Trazabilidad

Cada cambio conserva pedido, estado anterior/nuevo, `changed_at`, actor, rol del actor, procedencia, identificador idempotente y motivo cuando corresponde. La creación escribe el primer historial con estado anterior nulo.

El historial es inmutable y el estado actual debe coincidir con su último registro válido.

## Reglas de cancelación

- Solo `admin` cancela.
- Cancelar no elimina detalles, historial ni pagos.
- Si existen pagos, no se crea devolución automática.
- La decisión administrativa se registra con motivo; devoluciones parciales y créditos se resolverán en una fase posterior.
