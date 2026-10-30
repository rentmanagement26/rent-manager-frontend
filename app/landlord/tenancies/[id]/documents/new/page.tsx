// Landlord: start sending a lease for signing. Loads the lease details and the property, then shows the preparation steps.
import { notFound, redirect } from "next/navigation";
import { requireBackendToken } from "@/lib/auth-guard";
import { SessionExpiredError } from "@/lib/api-error";
import { findUnitContext } from "@/lib/landlord-property";
import { getTenancy } from "@/lib/tenancy-api";
import { PageHeader } from "@/components/page-header";
import { PrepareLease } from "./prepare-lease";

export default async function NewLeaseDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireBackendToken(["Admin", "Landlord"]);

  let details;
  let context;
  try {
    details = await getTenancy(session.backendToken, Number(id));
    context = details ? await findUnitContext(session.backendToken, details.unitId) : null;
  } catch (err) {
    if (err instanceof SessionExpiredError) redirect("/session-expired");
    throw err;
  }
  if (!details) notFound();
  if (details.status !== "Active") redirect(`/landlord/tenancies/${details.id}`);

  const where = context ? `${context.property.name} · ${context.unit.label}` : "Lease";

  return (
    <div className="max-w-5xl">
      <PageHeader title="Send lease for signing" description={where} />
      <PrepareLease details={details} region={context?.property.region ?? ""} defaultTitle={context ? `Residential lease, ${context.unit.label}` : "Residential lease"} />
    </div>
  );
}
