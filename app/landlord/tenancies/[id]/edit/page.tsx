// Edit page for a tenancy's lease details. Looks up the property so the form knows which province's deposit limits apply.
import { notFound, redirect } from "next/navigation";
import { requireBackendToken } from "@/lib/auth-guard";
import { SessionExpiredError } from "@/lib/api-error";
import { findUnitContext } from "@/lib/landlord-property";
import { getTenancy } from "@/lib/tenancy-api";
import { PageHeader } from "@/components/page-header";
import { LeaseForm } from "@/components/lease-form";

export default async function EditLeasePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
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
  // An ended lease can't be edited (the backend refuses it), so send the landlord back to the read-only page.
  if (!details) notFound();
  if (details.status !== "Active") redirect(`/landlord/tenancies/${details.id}`);

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Edit lease details"
        description={context ? `${context.property.name} · ${context.unit.label}` : "Rent, term, deposits and utilities."}
      />
      <LeaseForm details={details} region={context?.property.region ?? ""} error={error} />
    </div>
  );
}
