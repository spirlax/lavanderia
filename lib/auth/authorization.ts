import type { Role } from "@/lib/auth/types";

export type AuthorizedHomePath = "/" | "/admin";

export function getHomePathForRole(role: Role): AuthorizedHomePath {
  return role === "admin" ? "/admin" : "/";
}

/** Acceso a rutas y panel bajo `/admin/**`. */
export function canAccessAdmin(role: Role): boolean {
  return role === "admin";
}

/** Crear, editar y activar/desactivar servicios. */
export function canManageServices(role: Role): boolean {
  return role === "admin";
}

/** Alta de clientes (admin y operator). */
export function canCreateCustomer(role: Role): boolean {
  return role === "admin" || role === "operator";
}

/** Edición de nombre, teléfono, correo y notas (admin y operator). */
export function canUpdateCustomer(role: Role): boolean {
  return role === "admin" || role === "operator";
}

/** Activación y desactivación de clientes (solo admin). */
export function canSetCustomerActive(role: Role): boolean {
  return role === "admin";
}

/** Área operativa (`/`, `/nuevo`, `/buscar`, `/clientes`). */
export function canUseOperationalArea(role: Role): boolean {
  return role === "admin" || role === "operator";
}
