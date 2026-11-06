// Edit one contractor on the landlord's list.
import { notFound, redirect } from "next/navigation";
import { ContractorForm } from "@/components/contractor-form";
import { PageHeader } from "@/components/page-header";
import { SessionExpiredError } from "@/lib/api-error";
import { requireBackendToken } from "@/lib/auth-guard";
import { getContractor } from "@/lib/contractor-api";
import type { ContractorDetail } from "@/lib/contractor-types";

export default async function EditContractorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const session = await requireBackendToken(["Admin", "Landlord"]);

  let contractor: ContractorDetail | null;
  try {
    contractor = await getContractor(session.backendToken, Number(id));
  } catch (err) {
    if (err instanceof SessionExpiredError) redirect("/session-expired");
    return <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">Couldn&apos;t load this contractor. Refresh to try again.</p>;
  }
  if (!contractor) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={contractor.displayName} description="Change their details. A new email address cancels an invitation that is waiting." />
      <ContractorForm contractor={contractor} />
    </div>
  );
}
