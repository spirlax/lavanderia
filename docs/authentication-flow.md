# Flujo de autenticación

`/login` solo selecciona el tipo de acceso.

- `/admin/login`: correo y contraseña; exige perfil activo `admin` y redirige a `/admin`.
- `/operadora`: lista operadoras activas y captura seis dígitos con teclado visual.
- El Server Action envía el PIN al Edge Function `operator-pin-login`.
- El Edge Function verifica bcrypt, bloqueo y auditoría en servidor, genera un
  enlace Auth de un solo uso y devuelve una sesión Supabase real.
- El Server Action fija esa sesión en cookies SSR y redirige a `/`.

Los hashes viven en `private.operator_pin_credentials`; los intentos en
`private.operator_pin_attempts`. No se envían contraseñas, hashes, tokens ni
`service_role` al navegador.

Admin configura o reemplaza PIN desde `/admin/pin`, sin poder visualizar el
valor actual. Cinco fallos bloquean el PIN durante 15 minutos.
