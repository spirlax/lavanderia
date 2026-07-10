# Importación histórica

## Principio de fidelidad

La plataforma conserva la granularidad y precisión reales de la fuente. No inventa customers, pedidos, pagos, movimientos, estados, horas ni desgloses.

## Clasificación

- `platform`: datos operativos creados por el sistema; tienen actor y momentos exactos.
- `historical_detailed`: pedidos individuales solo cuando el Excel aporta evidencia suficiente; conservan lote y referencia de origen.
- `historical_daily`: agregados diarios separados; no crean customers, pedidos, pagos o caja.
- `historical_monthly`: agregados mensuales separados; no se distribuyen entre días ni operaciones ficticias.

Una fecha sin hora se mantiene como `date`. Los pagos históricos se importan únicamente si existe evidencia individual y nunca alteran caja actual.

## Lotes futuros

Cada lote deberá conservar tipo, nombre y huella del archivo, versión de mapeo, zona horaria conocida, conteos de filas, validaciones, actor, fecha y referencias de origen. La importación será exclusiva de `admin`, idempotente y ejecutada en servidor.

## Validación futura de Excel

1. Analizar una copia del archivo original.
2. Confirmar estructura, hojas, encabezados, periodos, moneda y granularidad reales.
3. Validar tipos, importes, fechas, duplicados y totales.
4. Mostrar errores y advertencias antes de confirmar.
5. Conciliar valores aceptados con la fuente.

La estructura real del Excel permanece pendiente. Esta fase no lee archivos, no crea tablas y no conecta Supabase.
