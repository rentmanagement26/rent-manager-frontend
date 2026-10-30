// Edit page for a tenancy's lease details. Looks up the property so the form knows which province's deposit limits apply.
import { notFound, redirect } from "next/navigation";
import { requireBackendToken } from "@/lib/auth-guard";
import { SessionExpiredError } from "@/lib/api-error";
import { findUnitContext } from "@/lib/landlord-property";
import { listDocuments } from "@/lib/document-api";
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

  // A lease that was sent keeps the terms it was sent with. Warn that changing them now does not change what was signed.
  const documents = await listDocuments(session.backendToken, details.id).catch(() => []);
  const sentLease = documents.find((d) => d.status === "AwaitingTenants" || d.status === "Completed" || d.status === "Expired");
  const unsentLease = documents.find((d) => d.status === "Draft" || d.status === "AwaitingLandlord");

  // What the landlord should know before changing the terms, depending on where the lease document is.
  const warning = sentLease
    ? {
        title: `"${sentLease.title}" has already been sent for signing.`,
        text: "It keeps the terms it was sent with. Changing the terms here does not change what the tenants read or sign. If the agreement itself changes, withdraw the lease and send a new one.",
        requireAck: true,
      }
    : unsentLease
      ? {
          title: "Update the lease PDF after changing the terms.",
          text: `"${unsentLease.title}" is not sent yet. The terms are saved with it when you send it, so the PDF must say the same thing. After saving, open the lease and use Replace the PDF if needed.`,
        }
      : {
          title: "The lease PDF must match these terms.",
          text: "These terms are used when you add the lease. Anything you change here has to be the same in the lease PDF you upload.",
        };

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Edit lease details"
        description={context ? `${context.property.name} · ${context.unit.label}` : "Rent, term, deposits and utilities."}
      />
      <LeaseForm details={details} region={context?.property.region ?? ""} error={error} warning={warning} />
    </div>
  );
}
