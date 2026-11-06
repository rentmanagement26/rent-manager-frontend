// Add a contractor to the landlord's list.
import { ContractorForm } from "@/components/contractor-form";
import { PageHeader } from "@/components/page-header";
import { requireAuth } from "@/lib/auth-guard";

export default async function NewContractorPage() {
  await requireAuth(["Admin", "Landlord"]);
  return (
    <div className="space-y-6">
      <PageHeader title="Add contractor" description="Someone you send maintenance jobs to or ask for quotes." />
      <ContractorForm />
    </div>
  );
}
