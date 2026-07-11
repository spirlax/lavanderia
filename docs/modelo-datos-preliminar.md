# Modelo de datos del MVP

La plataforma conserva operaciones de pedidos, pagos y caja con RLS e
inmutabilidad. La migración `20260711155428_thesis_mvp_bi_imports_and_operator_pin.sql`
añade:

- `report_runs`: ejecución, rango, duración y resultado de reportes;
- `import_batches`: huella y auditoría de cada CSV;
- `historical_summaries`: agregados diarios sin pedidos ficticios;
- credenciales PIN privadas con hash, bloqueo y auditoría.

Dinero en PEN con dos decimales y fechas operativas en `America/Lima`.
Máquinas, inventario, delivery, facturación electrónica, compras, gastos
manuales y contabilidad tributaria permanecen fuera de alcance.
