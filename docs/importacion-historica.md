# Importación histórica

## Principio de fidelidad

La plataforma conservará el nivel de detalle realmente disponible en la fuente. No se inventarán clientes, pedidos, pagos, movimientos, fechas ni desgloses para completar vacíos históricos.

## Tipos de información

### Pedidos históricos detallados

Son registros cuyo origen contiene evidencia suficiente de pedidos individuales y sus detalles. Solo se importarán los datos presentes y validados; los campos ausentes permanecerán identificados como tales según el diseño que se apruebe.

### Resúmenes diarios

Son agregados por día sin evidencia de cada pedido individual. Se conservarán como información agregada y no se convertirán artificialmente en pedidos ni movimientos de caja.

### Resúmenes mensuales

Son agregados por mes. Se conservarán separados de los resúmenes diarios y de los pedidos detallados; no se distribuirán entre días o pedidos sin evidencia.

### Datos procedentes de Excel

Excel es una fuente externa y no una garantía de calidad. Antes de importar se deberán validar formato, encabezados, tipos, fechas, duplicados, consistencia y nivel de detalle. Cada carga deberá conservar procedencia y resultado de validación.

### Datos generados posteriormente por la plataforma

Los nuevos datos operativos se registrarán desde los módulos autorizados y se distinguirán de los importados. Su estructura podrá ser más detallada, pero nunca se usará para atribuir detalle inexistente a periodos históricos.

## Flujo futuro propuesto

1. Analizar una copia del archivo sin modificar el original.
2. Clasificar cada conjunto como pedidos detallados, resumen diario o resumen mensual.
3. Validar estructura y contenido con reglas aprobadas.
4. Presentar errores y advertencias antes de persistir.
5. Importar mediante una operación de servidor trazable e idempotente.
6. Conciliar totales con la fuente y documentar diferencias.

Este flujo es documental; en Fase 0 no se leen archivos Excel ni se implementa un importador.
