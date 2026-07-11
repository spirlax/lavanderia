# Indicadores de tesis

## Convenciones de medición

- Moneda y zona horaria de la operación: PEN y `America/Lima`.
- La jornada de atención se determina a partir de `scheduled_for` y del horario oficial que queda pendiente de confirmar.
- Los pedidos históricos sin precisión o trazabilidad suficiente se excluyen de cálculos que requieran esos datos; no se imputan valores.
- Los resultados históricos de la tesis no se cargan como datos simulados de la plataforma.

## Cumplimiento de pedidos

**Fórmula**

```text
(N.º de pedidos atendidos / N.º total de pedidos programados) × 100
```

- Unidad de análisis: jornada de atención.
- Pedido programado: tiene `scheduled_for` correspondiente a la jornada.
- Pedido atendido: alcanzó `ready` o `delivered` dentro del plazo de esa jornada.
- Los cancelados antes del inicio de la jornada no forman parte del denominador.
- Las cancelaciones durante la jornada se identifican y reportan por separado.

Datos necesarios: `scheduled_for`, historial de estados, instantes de `ready`, `delivered` y `cancelled`, motivo de cancelación, origen y precisión temporal.

Pendiente metodológico: hora oficial de cierre de jornada y regla exacta para resolver múltiples entradas a `ready` por reproceso.

## Tasa de pedidos no recogidos

**Fórmula**

```text
(N.º de pedidos no recogidos al cierre / N.º de pedidos que quedaron listos) × 100
```

- Unidad de análisis: jornada de atención.
- Denominador: pedidos que alcanzaron `ready` durante la jornada.
- Numerador: de esos pedidos, los que no alcanzaron `delivered` antes del cierre.
- Un pedido antiguo no vuelve a contar como nuevo pedido listo en otra jornada.
- La acumulación de pedidos `ready` sin entregar se mostrará en un KPI separado, sin mezclarla con esta tasa.

Datos necesarios: historial de entrada a `ready`, transición a `delivered`, cierre de jornada, origen y precisión temporal.

Pendiente metodológico: hora oficial de cierre de jornada y definición del KPI acumulado separado.

## Tiempo para generar reportes

**Fórmula**

```text
hora de finalización − hora de inicio
```

- Unidad: minutos.
- Unidad de análisis académica: medición semanal.
- La duración de cada ejecución se conservará también como `duration_ms` para cálculo consistente.

La futura entidad `report_runs` debe incluir: `started_at`, `completed_at`, `duration_ms`, `report_type`, `filters`, `status` y `requested_by`.

Pendiente metodológico: reporte o conjunto de reportes evaluados, volumen de datos y tratamiento de fallos/reintentos en la medición semanal.
# Implementación MVP

`/admin/reportes` conserva cada ejecución en `report_runs` y muestra cumplimiento,
tasa de no recogidos, tiempo de generación, ingresos por método y pendientes.
`/admin/importaciones` conserva lotes y resúmenes diarios sin crear pedidos ficticios.
