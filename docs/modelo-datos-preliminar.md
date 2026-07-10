# Modelo de datos preliminar

Este documento enumera únicamente entidades propuestas. No define tablas, columnas, tipos, restricciones, políticas ni SQL. Todo el modelo deberá validarse antes de crear migraciones.

## Entidades operativas propuestas

- **Perfil de usuario:** representa información y rol operativo asociado a una identidad autenticada.
- **Cliente:** representa a la persona que solicita servicios.
- **Servicio:** representa un servicio disponible en el catálogo de la lavandería.
- **Pedido:** representa el encargo realizado por un cliente.
- **Detalle de pedido:** representa los servicios que componen un pedido.
- **Historial de estado de pedido:** representa la trazabilidad de los cambios de estado.
- **Pago:** representa un pago vinculado con un pedido.
- **Sesión de caja:** representa un periodo controlado de operación de caja, si la regla de negocio lo confirma.
- **Movimiento de caja:** representa una entrada o salida de caja respaldada por una operación autorizada.
- **Importación histórica:** representa la ejecución y procedencia de una carga histórica.
- **Registro histórico agregado:** representa un resumen diario o mensual cuando el origen no contiene pedidos detallados.

## Relaciones conceptuales propuestas

- Un cliente puede tener pedidos; un pedido pertenece a un cliente.
- Un pedido se compone de detalles asociados a servicios.
- Un pedido puede tener cambios de estado y pagos.
- Los pagos pueden originar movimientos de caja conforme a reglas aún por validar.
- Una importación histórica puede aportar pedidos detallados o registros agregados, pero no debe transformar agregados en pedidos inexistentes.

Las entidades y relaciones son preliminares; no autorizan la creación de base de datos en esta fase.
