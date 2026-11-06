// The contractor portal (a contractor with an account): the shared portal frame with the contractor's sidebar and account menu.
// The invitation page and the no-account email link sit next to this folder, outside it, because they need no sign-in.
import { ContractorSidebar } from "@/components/contractor-sidebar";
import { PortalShell } from "@/components/portal-shell";
import { TenantAccountMenu } from "@/components/tenant-account-menu";
import { requireAuth } from "@/lib/auth-guard";

export default async function ContractorLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuth(["Contractor"]);

  return (
    <PortalShell
      sidebar={<ContractorSidebar />}
      accountMenu={<TenantAccountMenu fullName={session.fullName} email={session.email} role={session.role} portal="/contractor" />}
    >
      {children}
    </PortalShell>
  );
}
