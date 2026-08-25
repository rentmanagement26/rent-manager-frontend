import { requireAuth } from "@/lib/auth-guard";

export default async function ContractorLayout({ children }: { children: React.ReactNode }) {
  await requireAuth(["Contractor"]);
  return <>{children}</>;
}