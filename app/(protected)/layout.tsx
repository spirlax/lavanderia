import { requireCurrentProfile } from "@/lib/auth/get-current-profile";

export default async function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireCurrentProfile();

  return children;
}
