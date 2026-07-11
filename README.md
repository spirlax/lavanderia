# Gestión de lavandería

Plataforma para la gestión operativa de una MYPE de servicios.

## Estado

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

## Desarrollo local

```bash
pnpm install
pnpm dev
```

## Verificación

```bash
pnpm lint
pnpm typecheck
pnpm build
```

Los requisitos, decisiones preliminares y plan de fases están en `docs/`.
