# Revisión de Fase 1F

## Configuración real de autenticación

- El registro público, el enlace manual y los accesos anónimos están desactivados.
- El acceso por email y contraseña está habilitado y exige confirmación del correo.
- No se habilitaron OAuth, magic links ni recuperación de contraseña.
- Se crearon administrativamente exactamente dos usuarios confirmados.
- Los perfiles usan los UUID reales de Auth, con correspondencia 1:1: un `admin` activo y un `operator` activo.
- Los roles se almacenan en `public.profiles`; no se usa `user_metadata` para autorizar.

Los usuarios se crean manualmente en **Supabase Dashboard → Authentication → Users**. Las contraseñas se introducen únicamente en ese panel. Después, una operación administrativa controlada inserta el perfil con el UUID real, nombre confirmado, rol e indicador activo. Correos, contraseñas, nombres y UUID no se documentan ni se guardan en Git.

## Estado de Supabase

- Proyecto `lavanderia`, ref `pbrbiskqskjzurhoxlzk`, estado `ACTIVE_HEALTHY`.
- Migraciones aplicadas: `initial_core_schema` y `auth_rls_policies`.
- Seis tablas operativas con RLS y doce políticas.
- Dos usuarios Auth, dos perfiles y cero correspondencias pendientes.
- Un administrador activo y un operador activo.
- Cero filas en `customers`, `services`, `orders`, `order_items` y `order_status_history`.

## Pruebas locales realizadas

- Sin sesión: `/login` carga; `/` y `/admin` redirigen a `/login`.
- Admin: redirección a `/admin`, nombre y rol correctos, acceso a `/admin` y `/`, y logout efectivo.
- Operator: redirección a `/`, nombre y rol correctos, `/admin` redirige a `/acceso-denegado`, y logout efectivo.
- El formulario devuelve validación genérica sin revelar si una cuenta existe.
- Se corrigió una incompatibilidad de Next.js 16: el estado inicial del formulario dejó de exportarse desde un módulo `"use server"`.

## Vercel y Node.js

- Proyecto `lavanderia` del equipo `Thony's projects`, conectado a `spirlax/lavanderia`, rama `main`.
- Runtime de Vercel configurado en Node.js `22.x`.
- Variables configuradas para Production y Preview:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- No se configuraron `service_role`, secretos JWT, contraseñas, UUID ni datos de usuarios.

El entorno local permanece en Node.js `20.18.0`. El build pasa, pero Supabase retiró el soporte de Node 20; el riesgo residual se elimina instalando Node.js 22 LTS localmente con autorización explícita. No se instaló ni reemplazó Node globalmente durante esta fase.

## Cierre y alcance

La Fase 1 queda limitada a infraestructura, esquema, RLS y autenticación. No se implementaron clientes, catálogo, pedidos, pagos, caja, importaciones, máquinas, reportes, dashboard ni inteligencia de negocio.

El cierre definitivo exige que el deployment del commit final quede `READY` y que la misma matriz de permisos se confirme en producción. Esa evidencia se registra después del push final sin incluir credenciales.
