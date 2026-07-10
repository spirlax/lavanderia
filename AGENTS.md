<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Reglas del proyecto Lavandería

Estas reglas se aplican a todo el repositorio:

- Implementar únicamente el alcance de la fase solicitada y detenerse al completarlo.
- No añadir dependencias sin una justificación técnica relacionada con requisitos aprobados.
- No usar `any` para ocultar errores de tipado.
- No desactivar reglas de ESLint ni comprobaciones de TypeScript para hacer pasar una validación.
- No usar datos ficticios como solución permanente.
- Validar toda entrada externa antes de procesarla o persistirla.
- Ejecutar en el servidor toda operación sensible, incluida la autorización y las mutaciones de datos.
- Realizar toda modificación futura de la base de datos mediante migraciones versionadas.
- Habilitar Row Level Security (RLS) en toda tabla expuesta y definir políticas acordes con los permisos.
- No exponer ni usar `service_role` en el navegador.
- Ejecutar `pnpm lint`, `pnpm typecheck` y `pnpm build` antes de finalizar cada fase.
- No desplegar, ejecutar migraciones ni realizar acciones destructivas sin autorización explícita.
