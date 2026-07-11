import { AppShell } from "@/components/layout/app-shell";
import { requireCurrentProfile } from "@/lib/auth/get-current-profile";

export default async function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const profile = await requireCurrentProfile();

  return <AppShell profile={profile}>{children}</AppShell>;
}
