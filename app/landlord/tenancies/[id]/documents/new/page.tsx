// Add a lease from a lease's own page: the same stepper, with the unit already chosen so it opens on the lease file.
import { notFound, redirect } from "next/navigation";
import { requireBackendToken } from "@/lib/auth-guard";
import { SessionExpiredError } from "@/lib/api-error";
import { loadPickerProperties, type PickerProperty } from "@/lib/lease-wizard-data";
import { getTenancy } from "@/lib/tenancy-api";
import { PageHeader } from "@/components/page-header";
import { LeaseWizard } from "@/components/lease-wizard";

export default async function NewLeaseDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireBackendToken(["Admin", "Landlord"]);

  let details;
  let properties: PickerProperty[];
  try {
    [details, properties] = await Promise.all([getTenancy(session.backendToken, Number(id)), loadPickerProperties(session.backendToken)]);
  } catch (err) {
    if (err instanceof SessionExpiredError) redirect("/session-expired");
    throw err;
  }
  if (!details) notFound();
  if (details.status !== "Active") redirect(`/landlord/tenancies/${details.id}`);

  return (
    <div className="max-w-5xl">
      <PageHeader title="Add lease" description="Upload the lease for this unit." />
      <LeaseWizard properties={properties} initialUnitId={details.unitId} initialDetails={details} />
    </div>
  );
}
