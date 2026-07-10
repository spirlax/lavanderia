# Permisos y autorización

- Denegar por defecto.
- Resolver el rol en datos controlados por servidor; nunca en `user_metadata` editable.
- Verificar autorización en servidor y reforzarla con RLS por fila/operación cuando exista base de datos.
- No usar `service_role` ni secretos en navegador.
- Los historiales, pagos, sesiones y movimientos no se editan ni eliminan; las anulaciones son acciones explícitas auditadas.

`admin` tiene alcance administrativo completo. `operator` registra customers, pedidos, pagos y movimientos manuales justificados en su propia sesión; avanza estados operativos y entrega solo sin saldo. No administra usuarios, configuración, importaciones, servicios/precios ni máquinas, y no cancela ni anula operaciones.

La matriz detallada está en `docs/matriz-permisos.md`. Las políticas concretas se implementarán mediante migraciones en una fase autorizada.
