# Arquitectura preliminar

## Enfoque

La aplicación se plantea como un monolito web modular con Next.js App Router. Esta decisión mantiene una sola base de código y evita complejidad innecesaria para una lavandería pequeña.

## Componentes previstos

- **Interfaz:** React, Server Components por defecto y Tailwind CSS.
- **Aplicación:** rutas, componentes de servidor, acciones de servidor y Route Handlers de Next.js según el caso.
- **Validación:** esquemas Zod en los límites de entrada.
- **Persistencia futura:** Supabase PostgreSQL con migraciones versionadas.
- **Identidad futura:** Supabase Auth.
- **Autorización futura:** comprobación en servidor y RLS para cada tabla expuesta.
- **Entrega futura:** repositorio remoto en GitHub y despliegue en Vercel, ambos sujetos a autorización.

## Límites de seguridad

- El navegador no debe recibir secretos ni credenciales con privilegios administrativos.
- La clave `service_role` nunca se usará en código cliente ni en variables públicas.
- Toda entrada procedente de formularios, archivos, parámetros, APIs o variables no confiables se validará antes de utilizarse.
- Las mutaciones, autorización y demás operaciones sensibles se ejecutarán en servidor.
- RLS será defensa obligatoria para las tablas expuestas; el acceso de aplicación no sustituirá esas políticas.

## Organización prevista

La estructura concreta se definirá al iniciar cada módulo. Se favorecerá la separación entre interfaz, casos de uso, validación y acceso a datos, sin crear microservicios ni abstracciones prematuras.

## Estado en Fase 0

Solo existe el scaffold de Next.js, la página mínima y documentación. Supabase y Vercel no están conectados; no hay esquema de base de datos ni autenticación implementada.
