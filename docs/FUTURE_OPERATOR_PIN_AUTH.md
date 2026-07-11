# Acceso por PIN de operadoras

## Estado MVP

Implementado en la migración `20260711155428_thesis_mvp_bi_imports_and_operator_pin.sql`.

- El administrador configura PIN de exactamente seis dígitos.
- El hash bcrypt vive en `private.operator_pin_credentials`.
- Cinco fallos bloquean 15 minutos.
- Cada intento queda auditado sin guardar el PIN.
- El login de admin sigue usando correo y contraseña.
- Las operadoras usan correo, contraseña y PIN; la sesión resultante es una sesión Auth real.

La validación se ejecuta en servidor mediante RPC protegida. El navegador nunca
recibe hashes ni usa `service_role`.
