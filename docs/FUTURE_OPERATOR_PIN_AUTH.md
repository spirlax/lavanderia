# Autenticación futura por PIN de operador

Documento de diseño. **No implementado.** No autoriza migraciones, columnas, UI ni cambios de Auth.

## Objetivo

Permitir que un `operator` inicie sesión operativa con un PIN numérico de exactamente 6 dígitos, sin reemplazar el login actual de correo y contraseña ni acoplar el PIN a `public.profiles`.

## Alcance previsto

| Regla | Detalle |
| --- | --- |
| Quién | Solo `operator` activo. `admin` no usa PIN. |
| Formato | Exactamente 6 dígitos numéricos (`0-9`). |
| Almacenamiento | Hash seguro (p. ej. Argon2id o bcrypt con costo actualizado); nunca PIN en claro. |
| Validación | Exclusivamente en servidor (Server Action / Route Handler). |
| Credenciales | Tabla dedicada fuera de `public.profiles` (p. ej. `private.operator_pin_credentials`). |
| Intentos | Contador de fallos con umbral configurable. |
| Bloqueo | Bloqueo temporal tras exceder el umbral; desbloqueo por tiempo o por `admin`. |
| Auditoría | Registro de intentos (éxito/fallo, actor, IP/user-agent si disponible, marca temporal). |
| Rotación | `admin` puede invalidar o rotar el PIN; el hash anterior deja de ser válido. |
| Exposición | Sin SELECT/UPDATE de hashes vía Data API; RLS denegado o tabla no expuesta. |
| Sesión | Tras PIN válido, emitir una sesión legítima de Supabase Auth (o mecanismo equivalente aprobado), no un flag en `localStorage` / `sessionStorage` / cookie inventada. |

## Separación de credenciales

- `public.profiles` sigue siendo la fuente de `role` e `is_active`.
- El PIN no se guarda en `profiles`, ni en `user_metadata`, ni en `app_metadata` editable por el usuario.
- La tabla de credenciales PIN referencia `profiles.id` (1:1 para operators con PIN habilitado).
- Lectura/escritura del hash solo mediante funciones `SECURITY DEFINER` en esquema privado o rol de servicio en servidor, nunca desde el navegador.

## Flujo conceptual

1. El cliente envía únicamente el PIN (y, si se define, un identificador de estación no secreto).
2. El servidor valida formato (6 dígitos) y aplica limitación de tasa.
3. El servidor resuelve la credencial, verifica el hash y el estado de bloqueo.
4. Si falla: audita, incrementa contador y aplica bloqueo si corresponde.
5. Si acierta: audita, reinicia contador y crea una sesión Auth real vinculada al `auth.users` del operator.
6. Las rutas protegidas existentes (`requireCurrentProfile`, RLS) continúan autorizando por `profiles`.

## Compatibilidad con Supabase Auth (análisis previo)

Antes de implementar hay que validar con la documentación vigente de Supabase:

1. **Creación de sesión sin password del usuario:** ¿existe API soportada (custom token, OTP interno, magic link de un solo uso, Auth Hook) para emitir sesión tras verificar el PIN en servidor?
2. **Prohibiciones:** no simular sesión solo con cookies propias; no usar `service_role` en el navegador; no poner el PIN en JWT claims.
3. **Revocación:** invalidar PIN debe poder invalidar o forzar reauth de sesiones activas del operator cuando el riesgo lo exija.
4. **MFA / factores:** evaluar si un factor TOTP/phone de Auth cubre el caso mejor que un PIN custom; si se usa PIN custom, documentar por qué Auth nativo no alcanza.
5. **Auditoría Auth vs auditoría propia:** combinar eventos de Auth con la tabla de intentos PIN sin duplicar secretos.

Si no hay un camino soportado para sesión legítima tras PIN, no se implementa el atajo inseguro; se rediseña o se mantiene solo email/password.

## Requisitos de seguridad

- Denegar por defecto; sin políticas abiertas sobre hashes.
- Coste de hash alineado con recomendaciones actuales al momento de implementar.
- No registrar el PIN ni el hash en logs de aplicación.
- Mensajes de error genéricos ante PIN incorrecto (sin revelar si el operator existe), salvo controles admin.
- El login email/password actual permanece intacto y es el único método hasta que esta fase se autorice.

## Fuera de alcance de este documento

- Código, migraciones, UI de PIN, columnas en `profiles`.
- Sustitución del login de administrador.
- Almacenamiento cliente de sesión simulada.

## Criterio para abrir implementación

Se requiere autorización explícita de una fase posterior, revisión del mecanismo de sesión con Supabase Auth actualizado, y migración versionada separada. Hasta entonces, este archivo es solo diseño.
