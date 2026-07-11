# Gestión de lavandería

Plataforma para la gestión operativa de una MYPE de servicios.

## Estado

Completado:

- autenticación y roles;
- catálogo, clientes, pedidos y estados;
- pagos y caja diaria compartida;
- reportes y BI en `/admin/reportes`;
- importaciones históricas CSV en `/admin/importaciones`;
- PIN de seis dígitos para operadoras en `/admin/pin` y login.

Fuera de alcance: máquinas, inventario, delivery, facturación electrónica,
compras, gastos manuales y contabilidad tributaria.

## Desarrollo local

```bash
pnpm install
pnpm dev
```

## Verificación

```bash
pnpm build
```

La documentación funcional y técnica está en `docs/`.
