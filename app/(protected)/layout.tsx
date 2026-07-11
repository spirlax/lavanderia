import { AppShell } from "@/components/layout/app-shell";
import { requireCurrentProfile } from "@/lib/auth/get-current-profile";
import { getOpenCashSession } from "@/lib/cash/queries";

export default async function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [profile, openCashSession] = await Promise.all([
    requireCurrentProfile(),
    getOpenCashSession(),
  ]);

  return (
    <AppShell profile={profile} cashSessionOpen={Boolean(openCashSession)}>
      {children}
    </AppShell>
  );
}
