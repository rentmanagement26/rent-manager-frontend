import { requireAuth } from "@/lib/auth-guard";

export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  await requireAuth(["Tenant"]);
  return <>{children}</>;
}