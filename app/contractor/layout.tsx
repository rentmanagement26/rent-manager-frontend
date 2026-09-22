import { requireAuth } from "@/lib/auth-guard";
import SiteFooter from "@/components/site-footer";

export default async function ContractorLayout({ children }: { children: React.ReactNode }) {
  await requireAuth(["Contractor"]);
  return (
    <>
      {children}
      <SiteFooter />
    </>
  );
}