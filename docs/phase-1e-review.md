# Revisión de Fase 1E

## Dependencias

- `@supabase/supabase-js` `2.110.2`: cliente oficial estable publicado al implementar la fase.
- `@supabase/ssr` `0.12.0`: integración SSR oficial actual; soporta cookies `getAll`/`setAll` y entrega cabeceras anti-cache durante refrescos.

Las versiones están fijadas exactamente en `package.json` y `pnpm-lock.yaml`. No se añadió infraestructura de pruebas ni otras dependencias.

## Decisiones de arquitectura

1. Cliente browser con clave publicable y cliente server nuevo por solicitud.
2. Cookies compatibles con la API asíncrona de Next.js 16.
3. Proxy raíz para refrescar JWT con `getClaims()` y propagar cookies/cabeceras.
4. Verificación segura adicional mediante `getUser()` y consulta RLS a `profiles`.
5. Server Actions para login/logout con entrada Zod y mensajes genéricos.
6. Route Group protegido y autorización admin comprobada en servidor.
7. Ninguna sesión, cliente Supabase o estado de usuario se comparte globalmente en servidor.

## Matriz revisada

| Caso | Resultado esperado |
| --- | --- |
| Variables ausentes o inválidas | Error claro de configuración sin mostrar valores. |
| Email inválido | Error de campo en español antes de consultar Auth. |
| Password vacío | Error de campo en español. |
| Credenciales inválidas | Mensaje genérico, sin confirmar existencia del correo. |
| Sin sesión en ruta protegida | Redirección a `/login`. |
| Perfil inexistente/inactivo/inválido | Cierre de sesión y acceso no habilitado. |
| Rol `operator` | `/`; acceso a `/admin` redirige a `/acceso-denegado`. |
| Rol `admin` | `/admin`; también puede acceder al área operativa. |
| Usuario válido visita `/login` | Redirección a su área por rol. |
| Logout | Sesión eliminada y redirección a `/login`. |

Las funciones puras `getHomePathForRole` y `canAccessAdmin`, los schemas Zod y los resultados discriminados hacen comprobables las ramas sin incorporar una suite de pruebas grande. Las pruebas integradas con usuarios reales quedan expresamente diferidas.

## Seguridad

- No existe registro público, recuperación, OAuth o magic link.
- No se usa `getSession()` para decidir autorización.
- No se consulta `user_metadata` ni se recibe el rol desde el cliente.
- El perfil se obtiene desde `public.profiles` bajo RLS.
- No existe `service_role` en código ejecutable ni variables.
- Las Server Actions se tratan como entradas públicas: validan datos y verifican el perfil.
- Proxy no es la única barrera; la autorización importante se repite en servidor.
- Las respuestas que actualizan cookies reciben cabeceras para impedir caching compartido.

## Alcance excluido verificado

- Sin usuarios nuevos ni modificaciones de datos remotos.
- Sin migraciones, tablas o políticas nuevas.
- Sin módulos de customers, servicios, pedidos, caja o BI.
- Sin variables o configuración de Vercel.
- Sin commit durante esta fase.

## Pendientes

- Pruebas reales de los dos roles en Fase 1F.
- Confirmar la política operativa de intentos fallidos y bloqueo.
- Añadir observabilidad Auth sin registrar credenciales ni tokens.
- Crear futuras rutas `/nuevo`, `/buscar` y `/pedidos/[id]` dentro del grupo protegido cuando su fase sea autorizada.
- Actualizar el runtime local de Node.js `20.18.0` a Node.js 22 o posterior antes de que `@supabase/supabase-js` retire compatibilidad con Node 20.

## Verificación local ejecutada

- `/login`: HTTP 200, título y formulario presentes.
- `/`: HTTP 307 hacia `/login` sin sesión.
- `/admin`: HTTP 307 hacia `/login` sin sesión.
- No se crearon usuarios para comprobar estas rutas.

## Resultado final de calidad

- `pnpm lint`: aprobado.
- `pnpm typecheck`: aprobado.
- `pnpm build`: aprobado con Next.js 16.2.10.
- Rutas autenticadas compiladas como dinámicas y proxy reconocido por Next.js.
- Advertencia no bloqueante: Node.js 20 quedará fuera de soporte en una versión futura de `@supabase/supabase-js`; actualizar a Node.js 22+ queda pendiente.
