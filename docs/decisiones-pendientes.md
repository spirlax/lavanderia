# Decisiones pendientes

Estas decisiones requieren información real o aprobación posterior. No se resolverán inventando datos o reglas.

1. Estructura real del Excel: hojas, encabezados, periodos, granularidad, moneda y precisión de las fuentes históricas.
2. Hora oficial de cierre de jornada: necesaria para automatizar los indicadores diarios.
3. Servicios y precios reales: catálogo inicial, unidades aplicables y precios en PEN.
4. Datos del primer `admin`: identidad, nombre y procedimiento seguro de inicialización al habilitar Auth.
5. Política final de devoluciones parciales: reglas de crédito, devolución, comprobantes y relación con caja.
6. Posibles requisitos nuevos del dueño: se evaluarán antes de ampliar estados, entidades o permisos.
7. Endurecimiento de `private.order_number_counters` (Subfase 2C1, documentado sin migración):
   - La tabla privada del contador de `order_number` tiene RLS desactivado.
   - Hoy `PUBLIC`, `anon` y `authenticated` no tienen privilegios directos sobre ella; solo la usa la función `security definer` del generador.
   - Pendiente de autorización explícita: migración futura (p. ej. 004) para habilitar RLS o reforzar grants/ownership sin cambiar el comportamiento funcional.
   - No crear migración 004 en 2C1.

Las demás decisiones de Fase 1A quedan cerradas para el diseño documental actual.
