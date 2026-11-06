// The tenant portal: the shared portal frame with the tenant's sidebar and account menu. Each page draws its own heading.
import { PortalShell } from "@/components/portal-shell";
import { TenantAccountMenu } from "@/components/tenant-account-menu";
import { TenantSidebar } from "@/components/tenant-sidebar";
import { requireAuth } from "@/lib/auth-guard";

export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth(["Tenant"]);

  return (
    <PortalShell sidebar={<TenantSidebar />} accountMenu={<TenantAccountMenu fullName={session.fullName} email={session.email} role={session.role} />}>
      {children}
    </PortalShell>
  );
}
