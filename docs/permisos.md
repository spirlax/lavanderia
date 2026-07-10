# Permisos preliminares

## Principios

- Denegar por defecto lo que no esté autorizado explícitamente.
- Verificar autorización en el servidor y reforzarla con RLS en toda tabla expuesta.
- No basar autorización únicamente en elementos visuales o navegación del cliente.
- Mantener la clave `service_role` fuera del navegador.

## Roles conocidos

| Área | `admin` | `operator` |
| --- | --- | --- |
| Operación diaria autorizada | Acceso completo | Acceso limitado por confirmar |
| Configuración | Acceso completo | Sin acceso administrativo previsto |
| Gestión de usuarios y roles | Acceso completo | Sin acceso administrativo previsto |
| Reportes e indicadores | Acceso completo | Alcance por confirmar |
| Importación histórica | Acceso completo sujeto a validación | Alcance por confirmar |

La matriz detallada por acción —crear, leer, actualizar, anular, exportar y aprobar— queda pendiente de confirmación antes de implementar autenticación, políticas RLS o interfaz protegida.
