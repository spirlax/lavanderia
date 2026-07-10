# Variables de entorno

## Variables requeridas

| Variable | Uso | Exposición |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL pública del proyecto Supabase. | Navegador y servidor. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave publicable sujeta a RLS. | Navegador y servidor. |

`.env.example` contiene únicamente estos nombres con valores vacíos. Para desarrollo local se utiliza `.env.local`, ignorado por Git.

No se utiliza `service_role`, clave secreta, contraseña ni UUID de usuario. Las variables todavía no se configuraron en Vercel.

## Validación

`lib/env/public.ts` valida ambas variables con Zod cuando se crea un cliente Supabase:

- la URL debe ser una URL válida;
- la clave publicable no puede estar vacía;
- un error muestra solo los nombres de las variables faltantes, nunca sus valores.

La inicialización es diferida para que `next build` pueda analizar módulos sin crear clientes globales. Durante una solicitud de desarrollo sin configuración, la aplicación falla con un mensaje explícito de configuración local incompleta.

## Reglas

- No añadir `.env.local` al repositorio.
- No copiar valores reales a `.env.example`.
- No prefijar secretos con `NEXT_PUBLIC_`.
- No usar claves `service_role` o secretas en el navegador.
- Cuando Vercel sea autorizado, configurar únicamente URL y clave publicable en los entornos aprobados y repetir lint, typecheck, build y pruebas de sesión.
