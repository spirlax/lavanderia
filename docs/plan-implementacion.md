# Plan de implementación

Cada fase requiere autorización explícita y cierre con `pnpm lint`, `pnpm typecheck` y `pnpm build`.

## Estado actual

Implementado:

- autenticación y roles;
- catálogo de servicios;
- clientes;
- creación y búsqueda de pedidos;
- detalle e historial de pedidos;
- transiciones de estados;
- saldo pendiente calculado.

Pendiente:

- pagos;
- caja;
- reportes;
- business intelligence;
- importaciones históricas;
- acceso simplificado por PIN para operadoras.

## Fase 0 — Inicialización técnica

Completada: scaffold, documentación base, GitHub y Vercel sin Supabase conectado.

## Fase 1A — Cierre documental de dominio

Completada: reglas funcionales, modelo formal, permisos, flujo, pagos/caja, históricos, indicadores y pendientes. No se crearon migraciones ni se modificó Supabase.

## Fase 1B — Núcleo de datos y acceso

Completada: Supabase conectado, núcleo de datos versionado, autenticación, roles, RLS y políticas para `admin` y `operator`.

## Fase 1C — Operación base

Completada: servicios, clientes, creación y búsqueda de pedidos, detalle, historial, transiciones de estados y saldo pendiente calculado.

## Fase 2 — Pagos y caja

- Crear `cash_sessions`, `payments` y `cash_movements` mediante migración versionada.
- Registrar pagos contra el saldo calculado e implementar cierres de caja.

## Fase 3 — Históricos y reportes

- Crear `import_batches`, extensiones históricas y `historical_summaries`.
- Importar Excel validado sin inventar operaciones.
- Crear `report_runs` y medición semanal de tiempo de reportes.

## Fase 4 — Indicadores y BI

- Implementar las fórmulas aprobadas respetando jornada, elegibilidad y precisión histórica.
- Mostrar KPI acumulado de pedidos listos no entregados separado de la tasa diaria.

## Fase 5 — Entidades diferidas

- Evaluar `service_prices`, `cash_registers`, `cash_register_assignments`, `machines`, `system_settings` y `audit_events` según necesidades reales.

## Fase 6 — Acceso simplificado de operadoras

- Evaluar e implementar acceso por PIN sin debilitar la autenticación, autorización ni trazabilidad existentes.

## Condiciones transversales

- No crear SQL, migraciones, despliegues ni acciones destructivas sin autorización.
- No incorporar dependencias o integraciones fuera del alcance aprobado.
- Toda tabla expuesta tendrá RLS y toda operación sensible se ejecutará en servidor.
- No usar `service_role` en navegador.
