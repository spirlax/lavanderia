# Reglas de negocio preliminares

Estas reglas reflejan únicamente los requisitos conocidos. Los catálogos, transiciones y cálculos exactos deberán validarse con el dueño antes de programarse.

1. Cada pedido debe asociarse a un cliente y contener al menos un detalle de servicio válido.
2. El estado actual de un pedido debe poder conocerse y sus cambios deben conservar trazabilidad.
3. Los pagos deben registrarse de forma centralizada y relacionarse con el pedido correspondiente.
4. Los movimientos de caja deben ser trazables y corresponder a operaciones autorizadas.
5. Los pedidos terminados que aún no hayan sido recogidos deben poder identificarse sin asumir un plazo de atraso todavía no confirmado.
6. La información histórica importada debe distinguirse de la información generada por la plataforma.
7. Ningún archivo histórico debe convertirse en movimientos o pedidos más detallados que su evidencia de origen.
8. Los reportes deben derivarse de datos registrados y criterios documentados, no de valores ficticios.
9. El perfil `admin` tendrá acceso administrativo completo; el alcance exacto de `operator` se confirmará antes de implementar permisos.
10. Las fórmulas de los indicadores de tesis deben aprobarse antes de implementarse.

## Pendientes de confirmación

- Catálogo y transiciones válidas de estados de pedido.
- Criterio temporal para considerar un pedido no recogido.
- Reglas para pagos parciales, anulaciones y devoluciones.
- Apertura, cierre y ajustes de caja.
- Unidades, precios, descuentos y redondeos.
- Fórmulas y ventanas temporales de los indicadores.
