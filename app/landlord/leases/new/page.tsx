// Add a lease: the stepper starts with choosing the property and unit, then the lease file, its terms and a review.
import { redirect } from "next/navigation";
import { requireBackendToken } from "@/lib/auth-guard";
import { SessionExpiredError } from "@/lib/api-error";
import { loadPickerProperties, type PickerProperty } from "@/lib/lease-wizard-data";
import { PageHeader } from "@/components/page-header";
import { LeaseWizard } from "@/components/lease-wizard";

export default async function AddLeasePage() {
  const session = await requireBackendToken(["Admin", "Landlord"]);

  let properties: PickerProperty[];
  try {
    properties = await loadPickerProperties(session.backendToken);
  } catch (err) {
    if (err instanceof SessionExpiredError) redirect("/session-expired");
    throw err;
  }

  return (
    <div className="max-w-5xl">
      <PageHeader title="Add lease" description="Choose the property and unit, then upload the lease." />
      {properties.length === 0 ? (
        <div className="rounded-2xl border border-default bg-white p-8 text-center text-sm text-muted shadow-sm">Add a property and a unit first.</div>
      ) : (
        <LeaseWizard properties={properties} />
      )}
    </div>
  );
}
