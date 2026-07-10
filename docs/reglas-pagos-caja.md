# Reglas de pagos y caja

## Pagos

- Total del pedido: suma de subtotales de línea en PEN.
- Saldo: total menos pagos vigentes.
- Pago total: pago que cubre el total sin saldo previo.
- Adelanto: pago que deja saldo positivo.
- Pago de saldo: pago que deja saldo en cero.
- Métodos: `cash`, `card`, `bank_transfer`, `digital_wallet`, `other`; este último exige descripción.
- Todo pago es positivo, validado en servidor, vinculado a pedido y sesión abierta, y no puede exceder el saldo vigente.

Los pagos no se editan ni eliminan. `admin` puede anularlos con motivo, actor y fecha. El registro original permanece; si era efectivo, se produce el movimiento inverso correspondiente.

## Caja

- Una `operator` solo mantiene una sesión `open`.
- Apertura: registra importe inicial, responsable y hora.
- `operator` registra pagos y movimientos `manual_income` o `manual_expense` en su sesión abierta, con motivo obligatorio para los manuales.
- `operator` no edita, elimina, anula ni ajusta movimientos.
- `admin` realiza anulaciones y ajustes justificados.
- Pagos no efectivos se concilian por método y no aumentan el efectivo esperado.
- Efectivo esperado = apertura + ingresos de efectivo − salidas de efectivo.
- Diferencia = efectivo contado − efectivo esperado.
- Cierre: conserva efectivo esperado, contado, diferencia, responsable y hora; una sesión cerrada no se reabre ni se modifica.

## Cancelación con pagos

- Solo `admin` puede cancelar el pedido.
- No hay devolución automática cuando existan pagos.
- Debe registrarse la decisión administrativa y su motivo.
- Devoluciones parciales y créditos no se implementan aún.

## Protección de datos

No se guardan números completos de tarjeta, credenciales bancarias, tokens ni secretos. Los resúmenes históricos no generan sesiones ni movimientos actuales.
