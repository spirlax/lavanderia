# Flujo de autenticación

## Alcance de Fase 1E

La aplicación incorpora autenticación por correo y contraseña, sesión SSR basada en cookies, cierre de sesión y protección de rutas. No permite registro, recuperación de contraseña, OAuth, enlaces mágicos ni creación de usuarios.

## Componentes

- `lib/supabase/client.ts`: cliente publicable para componentes de navegador. `createBrowserClient` mantiene su propio singleton seguro.
- `lib/supabase/server.ts`: crea un cliente nuevo por solicitud con las cookies recibidas. No se comparte entre usuarios.
- `lib/supabase/proxy.ts` y `proxy.ts`: refrescan tokens con `getClaims()`, escriben cookies y propagan cabeceras anti-cache.
- `lib/auth/get-current-profile.ts`: capa de acceso a datos que verifica el usuario mediante `getUser()` y lee solo `id`, `full_name`, `role` e `is_active` desde `profiles`.
- `app/login/actions.ts`: valida credenciales, inicia sesión, verifica el perfil y redirige por rol.
- `lib/auth/actions.ts`: cierra la sesión desde una Server Action.
- `app/auth/signout-invalid/route.ts`: elimina cookies cuando existe sesión pero el perfil no está habilitado.

No se usa `getSession()` para autorización. El proxy es una comprobación optimista y no constituye la única defensa: las páginas, layouts, Server Actions, RLS y la capa de perfil vuelven a comprobar identidad y rol en servidor.

## Inicio de sesión

1. `/login` valida email y password con Zod en una Server Action.
2. `signInWithPassword` autentica contra Supabase Auth.
3. Los errores de credenciales producen el mismo mensaje genérico y no revelan si el correo existe.
4. Con el usuario autenticado, se consulta `public.profiles` bajo su propia sesión y RLS.
5. El resultado debe contener un perfil activo y rol `admin` u `operator`.
6. Perfil inexistente, inactivo o inválido provoca `signOut()` y el mensaje “Acceso no habilitado”.
7. `admin` se redirige a `/admin`; `operator`, a `/`.

Un usuario autenticado que visita `/login` pasa por la misma lectura segura de perfil y se redirige a su área. Una sesión sin perfil válido se elimina mediante el Route Handler interno.

## Protección de rutas

| Ruta | Acceso |
| --- | --- |
| `/login` | Pública. |
| `/` | `admin` y `operator` activos. |
| `/nuevo` | Reservada para futura página dentro del grupo protegido. |
| `/buscar` | Reservada para futura página dentro del grupo protegido. |
| `/pedidos/[id]` | Reservada para futura página dentro del grupo protegido. |
| `/admin` y `/admin/**` | Solo `admin` activo. |
| `/acceso-denegado` | Usuario autenticado con perfil válido. |
| `/auth/signout-invalid` | Ruta técnica para eliminar una sesión inválida. |

El grupo `app/(protected)` no cambia las URLs y exige perfil válido. El layout de `admin` añade comprobación de rol y envía operators a `/acceso-denegado`. Las futuras rutas operativas deberán crearse dentro del grupo protegido y usar la misma capa de autorización en cualquier lectura o mutación.

## Cierre de sesión

El botón ejecuta `logoutAction` en servidor, llama `supabase.auth.signOut()`, actualiza las cookies mediante `@supabase/ssr` y redirige a `/login`.

## Tipos y validación

- `Role`: unión estricta `admin | operator` derivada de un único esquema Zod.
- `Profile`: UUID, nombre, rol válido e `is_active = true`.
- `CurrentAuthenticationResult`: discriminado entre autenticado, sin sesión y acceso no habilitado.
- `LoginActionState`: estado serializable y errores de campo para el formulario.
- `Database`: tipo mínimo y estricto de `profiles`, derivado del esquema versionado; no fue generado conectando Supabase CLI.

## Riesgos pendientes para Fase 1F

- Probar login y logout con usuarios reales admin/operator creados mediante el procedimiento aprobado.
- Probar perfil inexistente e inactivo con identidades reales controladas.
- Confirmar expiración/refresco de sesión en navegación prolongada y solicitudes concurrentes.
- Probar acceso operator a `/admin` y navegación admin hacia rutas operativas.
- Definir protección contra intentos repetidos de login y monitoreo de eventos Auth.
- Incorporar funciones transaccionales antes de habilitar escrituras de pedidos.
