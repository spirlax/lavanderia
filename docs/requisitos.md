# Requisitos

## Propósito

Construir una plataforma web que mejore la gestión operativa de una pequeña lavandería y sirva como proyecto técnico de una tesis de Ingeniería de Sistemas.

## Problemas que debe resolver

1. Registros operativos manuales o dispersos.
2. Dificultad para conocer el estado actual de los pedidos.
3. Falta de control centralizado de pagos y caja.
4. Pedidos terminados que permanecen sin recoger.
5. Elaboración manual y lenta de reportes.
6. Falta de información estructurada para tomar decisiones.

## Usuarios

- `admin`: dueño con acceso administrativo completo.
- `operator`: empleada con acceso operativo limitado.

La asignación detallada de permisos está pendiente de validación funcional antes de implementar autorización.

## Capacidades previstas para fases posteriores

- Autenticación.
- Gestión de `customers`.
- Catálogo de servicios.
- Pedidos y detalle de pedidos.
- Estados y trazabilidad.
- Pagos.
- Caja.
- Seguimiento de pedidos no recogidos.
- Importación histórica desde Excel.
- Reportes.
- Dashboard de business intelligence.
- Configuración y usuarios.

## Requisitos técnicos obligatorios

- Next.js con App Router, React y TypeScript estricto.
- Tailwind CSS y ESLint.
- pnpm como gestor de paquetes.
- Zod para validar entradas externas.
- Supabase PostgreSQL, Auth y Row Level Security en fases autorizadas.
- GitHub para control de versiones remoto y Vercel para despliegue en fases autorizadas.
- Operaciones sensibles ejecutadas en el servidor.
- Cambios de base de datos realizados mediante migraciones versionadas.

## Fuera del alcance

- Docker, Redis, n8n, Metabase y microservicios.
- Tributación o facturación electrónica.
- Integraciones externas no aprobadas.
- Funciones no derivadas de requisitos validados.

## Alcance de la Fase 0

- Inicialización oficial del proyecto y herramientas base.
- TypeScript estricto, scripts de verificación y página inicial mínima.
- Documentación preliminar del producto, arquitectura, datos, permisos e indicadores.
- Repositorio Git local con primer commit.

No forman parte de esta fase las conexiones externas, autenticación, tablas, migraciones, despliegues ni módulos funcionales.
