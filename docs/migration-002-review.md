# Revisión de la migración 002

## Alcance

Archivo: `supabase/migrations/002_auth_rls_policies.sql`.

La migración configura autorización, políticas RLS y privilegios mínimos para las seis tablas del núcleo. No crea usuarios, datos operativos, login, integración de aplicación, variables de entorno, Storage, Edge Functions ni cambios en Vercel. La migración 001 permanece intacta.

## Modelo de autorización

- Denegación por defecto.
- Identidad derivada únicamente de `auth.uid()`.
- Rol y estado operativo obtenidos de `public.profiles`.
- Un perfil inactivo no supera ninguna política operativa.
- No se consulta `raw_user_meta_data`, `user_metadata`, correo ni argumentos de identidad suministrados por el cliente.
- `anon` no conserva privilegios en las seis tablas ni en las funciones auxiliares.
- `authenticated` recibe solo los privilegios requeridos por las políticas.
- No se concede `DELETE` ni `TRUNCATE`.
- Los privilegios de `postgres`, `service_role` y `supabase_admin` no se modifican.

## Funciones auxiliares

Las funciones se crean en el esquema no expuesto `private`:

| Función | Resultado mínimo | Uso |
| --- | --- | --- |
| `private.has_active_profile()` | `boolean` | Confirma que `auth.uid()` posee perfil activo. |
| `private.current_profile_role()` | `user_role` o `null` | Devuelve el rol solo si el perfil actual está activo. |
| `private.is_active_admin()` | `boolean` | Confirma un `admin` activo. |
| `private.is_active_staff()` | `boolean` | Confirma `admin` u `operator` activo. |

Las cuatro son `STABLE SECURITY DEFINER`, no reciben parámetros y fijan `search_path = pg_catalog, public`. La elevación es necesaria para consultar `profiles` desde políticas de esa misma tabla sin recursión RLS. Su propietario puede omitir RLS, por lo que cada función limita la consulta al UUID obtenido internamente mediante `auth.uid()` y devuelve un escalar mínimo.

`EXECUTE` se revoca de `PUBLIC`, `anon` y del grant predeterminado de `authenticated`; después se concede explícitamente solo a `authenticated`. El esquema `private` concede únicamente `USAGE` a `authenticated` entre los roles cliente.

## Políticas

| Tabla | Política | Operación | Regla |
| --- | --- | --- | --- |
| `profiles` | `profiles_select_own_active` | SELECT | Perfil activo lee solo su propia fila. |
| `profiles` | `profiles_select_all_by_active_admin` | SELECT | Admin activo lee todos los perfiles. |
| `customers` | `customers_select_by_active_staff` | SELECT | Admin y operator activos. |
| `customers` | `customers_insert_by_active_staff` | INSERT | Staff activo y `created_by = auth.uid()`. |
| `customers` | `customers_update_by_active_staff` | UPDATE | Staff activo; columnas concedidas excluyen `created_by`. |
| `services` | `services_select_all_by_active_admin` | SELECT | Admin activo lee activos e inactivos. |
| `services` | `services_select_active_by_operator` | SELECT | Operator activo lee solo `is_active = true`. |
| `services` | `services_insert_by_active_admin` | INSERT | Solo admin activo. |
| `services` | `services_update_by_active_admin` | UPDATE | Solo admin activo. |
| `orders` | `orders_select_by_active_staff` | SELECT | Admin y operator activos. |
| `order_items` | `order_items_select_by_active_staff` | SELECT | Admin y operator activos. |
| `order_status_history` | `order_status_history_select_by_active_staff` | SELECT | Admin y operator activos. |

No existen políticas de escritura directa para `profiles`, `orders`, `order_items` u `order_status_history`. No existen políticas de borrado. Ninguna política usa `USING (true)`.

## Privilegios efectivos esperados

### `anon`

Sin privilegios sobre las seis tablas, sin `USAGE` de `private` y sin `EXECUTE` de helpers.

### `authenticated`

- `profiles`: `SELECT`.
- `customers`: `SELECT`; `INSERT` solo en `name`, `phone`, `email`, `notes`, `created_by`; `UPDATE` solo en `name`, `phone`, `email`, `notes`, `is_active`.
- `services`: `SELECT`; `INSERT` y `UPDATE` solo en `name`, `unit`, `current_price`, `is_active`.
- `orders`, `order_items`, `order_status_history`: `SELECT`.
- Sin `DELETE`, `TRUNCATE`, `REFERENCES` ni `TRIGGER` sobre esas tablas.

La exclusión de `customers.created_by` de `UPDATE` impide modificar su autor sin restringir la actualización de customers creados por otra persona. La ausencia total de escritura en `profiles` impide cambiar `role` o `is_active` desde un cliente autenticado.

## Auditoría de seguridad previa

### Recursión RLS

Las políticas de `profiles` que necesitan comprobar administración llaman funciones `SECURITY DEFINER` en `private`. Estas consultan `public.profiles` con privilegios del propietario y evitan reingresar en la política. La política de lectura propia usa únicamente columnas de la fila y `auth.uid()`.

### `USING` y `WITH CHECK`

- Todas las políticas UPDATE contienen `USING` y `WITH CHECK`.
- INSERT utiliza `WITH CHECK`.
- SELECT utiliza `USING`.
- No se crea una política `FOR ALL`.
- No se usa una condición incondicional verdadera.

### Escalamiento de privilegios

- No existe escritura directa en `profiles`; rol y activación no son modificables por el cliente.
- Las funciones no aceptan UUID ni rol como argumento.
- Un perfil inactivo produce `false` o `null` en helpers.
- `created_by` se fija al UUID autenticado al insertar y no tiene privilegio de actualización.
- Orders, detalles e historial no tienen grants ni políticas directas de escritura.

### Acceso anónimo y ejecución

- Se revocan privilegios de tabla de `PUBLIC`, `anon` y `authenticated` antes de conceder el mínimo a `authenticated`.
- Se revocan privilegios de función de `PUBLIC`, `anon` y `authenticated` antes del grant explícito.
- No se modifican roles administrativos de plataforma.
- No se utiliza ni se expone una clave `service_role`.

### `search_path` y `SECURITY DEFINER`

Las funciones fijan exactamente `pg_catalog, public` y usan nombres de esquema explícitos para `profiles` y `auth.uid()`. El riesgo residual de cualquier función `SECURITY DEFINER` es que se ejecuta con privilegios del propietario; se reduce con esquema privado, cero argumentos, retorno escalar, identidad interna y permisos de ejecución restringidos.

## Riesgos y límites residuales

1. No hay usuarios para probar casos reales de admin/operator sin crear datos, acción prohibida en esta fase.
2. La validación remota de usuario sin perfil puede realizarse bajo el rol `authenticated` sin JWT; `auth.uid()` será `null` y debe devolver cero filas.
3. Las mutaciones de pedidos seguirán bloqueadas hasta crear funciones transaccionales de servidor en una fase posterior.
4. El primer admin requiere una acción manual controlada después de crear el usuario en Auth.
5. Cualquier cambio futuro de columnas mutables debe revisar conjuntamente grants de columna y políticas RLS.

## Criterios de aprobación posterior

- Exactamente 12 políticas, todas para `authenticated`.
- RLS activo en las seis tablas.
- Cuatro helpers en `private`, todos `SECURITY DEFINER`, `STABLE` y con `search_path` seguro.
- `PUBLIC` y `anon` sin `EXECUTE`; `authenticated` con `EXECUTE`.
- `anon` sin privilegios de tabla.
- `authenticated` sin `DELETE` ni `TRUNCATE`.
- Cero usuarios y cero registros tras aplicar.
- Advisors sin hallazgos de seguridad inesperados.
