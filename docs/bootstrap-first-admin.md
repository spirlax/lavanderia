# Inicialización segura del primer administrador

Este procedimiento se ejecutará manualmente cuando se autorice habilitar usuarios. No forma parte de las migraciones y no debe realizarse durante la Fase 1D.

## Procedimiento

1. Abrir el proyecto correcto `lavanderia` en Supabase Dashboard y entrar en **Authentication → Users**.
2. Crear el usuario real del dueño mediante el flujo administrativo de Auth. Usar una contraseña segura y no compartirla por Git, documentación o mensajes de desarrollo.
3. Copiar el UUID generado por Supabase Auth. No usar correo, teléfono ni `user_metadata` como identificador de autorización.
4. En una sesión administrativa segura, insertar el perfil con exactamente el mismo UUID, rol `admin`, `is_active = true` y el nombre real confirmado.

Plantilla manual —los marcadores deben sustituirse solo durante la operación autorizada y nunca guardarse con valores reales en Git—:

```sql
insert into public.profiles (id, role, is_active, full_name)
values ('<AUTH_USER_UUID>'::uuid, 'admin', true, '<FULL_NAME>');
```

5. Confirmar que existe una sola fila de `profiles` para ese UUID y que referencia correctamente `auth.users.id`.
6. Probar que el usuario puede leer su perfil y que las políticas administrativas se habilitan únicamente mientras el perfil permanezca activo.
7. Si la inicialización falla, no crear UUID alternativos ni perfiles sin usuario Auth; revisar la FK y repetir solo después de comprender el error.

## Reglas de seguridad

- No guardar correo, UUID, contraseña, tokens ni claves en Git.
- No añadir un `INSERT` fijo a ninguna migración.
- No autorizar con `raw_user_meta_data` o `user_metadata`.
- No usar `service_role` en navegador ni en código cliente.
- No crear el perfil antes de que Supabase Auth haya generado el usuario.
- No crear usuarios o perfiles ficticios para probar el procedimiento.
