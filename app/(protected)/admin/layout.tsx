import { redirect } from "next/navigation";

import { canAccessAdmin } from "@/lib/auth/authorization";
import { requireCurrentProfile } from "@/lib/auth/get-current-profile";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = await requireCurrentProfile();

  if (!canAccessAdmin(profile.role)) {
    redirect("/acceso-denegado");
  }

  return children;
}
