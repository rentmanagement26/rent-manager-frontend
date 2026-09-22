import { requireAuth } from "@/lib/auth-guard";
import SiteFooter from "@/components/site-footer";

export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  await requireAuth(["Tenant"]);
  return (
    <>
      {children}
      <SiteFooter />
    </>
  );
}