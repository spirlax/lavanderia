# Plan de implementación

Cada fase requiere autorización explícita y cierre con `pnpm lint`, `pnpm typecheck` y `pnpm build`.

## Fase 0 — Inicialización técnica

Completada: scaffold, documentación base, GitHub y Vercel sin Supabase conectado.

## Fase 1A — Cierre documental de dominio

Completada: reglas funcionales, modelo formal, permisos, flujo, pagos/caja, históricos, indicadores y pendientes. No se crearon migraciones ni se modificó Supabase.

## Fase 1B — Núcleo de datos y acceso

- Conectar Supabase con autorización previa.
- Crear migración versionada solo para `profiles`, `customers`, `services`, `orders`, `order_items` y `order_status_history`.
- Configurar Auth, RLS, políticas y pruebas de autorización para `admin` y `operator`.
- Inicializar el primer admin mediante procedimiento confirmado.

## Fase 2 — Pagos y caja

- Crear `cash_sessions`, `payments` y `cash_movements` mediante migración versionada.
- Implementar saldo, entrega administrativa con deuda, anulaciones y cierre de caja.

## Fase 3 — Históricos y reportes

- Crear `import_batches`, extensiones históricas y `historical_summaries`.
- Importar Excel validado sin inventar operaciones.
- Crear `report_runs` y medición semanal de tiempo de reportes.

## Fase 4 — Indicadores y BI

- Implementar las fórmulas aprobadas respetando jornada, elegibilidad y precisión histórica.
- Mostrar KPI acumulado de pedidos listos no entregados separado de la tasa diaria.

## Fase 5 — Entidades diferidas

- Evaluar `service_prices`, `cash_registers`, `cash_register_assignments`, `machines`, `system_settings` y `audit_events` según necesidades reales.

## Condiciones transversales

- No crear SQL, migraciones, despliegues ni acciones destructivas sin autorización.
- No incorporar dependencias o integraciones fuera del alcance aprobado.
- Toda tabla expuesta tendrá RLS y toda operación sensible se ejecutará en servidor.
- No usar `service_role` en navegador.
