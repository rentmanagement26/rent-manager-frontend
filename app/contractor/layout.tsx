import { requireAuth } from "@/lib/auth-guard";
import SiteFooter from "@/components/site-footer";

export default async function ContractorLayout({ children }: { children: React.ReactNode }) {
  await requireAuth(["Contractor"]);
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}