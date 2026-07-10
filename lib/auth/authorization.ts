import type { Role } from "@/lib/auth/types";

export type AuthorizedHomePath = "/" | "/admin";

export function getHomePathForRole(role: Role): AuthorizedHomePath {
  return role === "admin" ? "/admin" : "/";
}

export function canAccessAdmin(role: Role): boolean {
  return role === "admin";
}
