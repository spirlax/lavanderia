# Plan de implementación

Cada fase requiere autorización explícita, alcance confirmado y cierre con `lint`, `typecheck` y `build`. El orden puede ajustarse solo a partir de requisitos validados.

## Fase 0 — Inicialización técnica

- Scaffold oficial de Next.js.
- TypeScript estricto, ESLint, Tailwind CSS, pnpm y Zod.
- Página mínima y documentación preliminar.
- Git local y primer commit.

## Fase 1 — Fundamentos de datos y acceso

- Confirmar modelo, reglas y matriz de permisos.
- Conectar Supabase con autorización previa.
- Crear migraciones iniciales, RLS y autenticación para `admin` y `operator`.

## Fase 2 — Operación principal

- Clientes y catálogo de servicios.
- Pedidos, detalles, estados y trazabilidad.

## Fase 3 — Control financiero operativo

- Pagos y caja conforme a reglas confirmadas.
- Controles de autorización y conciliación.

## Fase 4 — Seguimiento e importación histórica

- Pedidos terminados no recogidos según criterio aprobado.
- Importación validada desde Excel sin fabricar detalle histórico.

## Fase 5 — Reportes e indicadores

- Reportes operativos.
- Implementación de los tres indicadores únicamente después de confirmar sus fórmulas.
- Medición del tiempo de generación de reportes.

## Fase 6 — Business intelligence y cierre

- Dashboard de business intelligence basado en datos validados.
- Configuración y administración de usuarios pendientes.
- Verificación integral, documentación final y despliegue autorizado.

## Condiciones transversales

- No realizar migraciones, despliegues ni acciones destructivas sin autorización.
- No incorporar funciones, dependencias o integraciones fuera del alcance aprobado.
- Mantener cambios de base de datos en migraciones y RLS en tablas expuestas.
- Actualizar documentación y pendientes al cierre de cada fase.
