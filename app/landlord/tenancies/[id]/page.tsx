// The landlord's page for one tenancy: the agreed lease terms and everyone who is or was on it.
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireBackendToken } from "@/lib/auth-guard";
import { SessionExpiredError } from "@/lib/api-error";
import { findUnitContext } from "@/lib/landlord-property";
import { formatCalendarDate } from "@/lib/format-time";
import { getTenancy } from "@/lib/tenancy-api";
import { listDocuments } from "@/lib/document-api";
import { statusFor } from "@/lib/document-format";
import { PageHeader } from "@/components/page-header";
import { LeaseTerms } from "@/components/lease-terms";
import { EndStayButton } from "./end-stay-button";
import { RenewalDialogButton } from "@/components/renewal-dialog";
import { RenewalPill, decisionWord } from "@/components/renewal-parts";

// The backend allows up to 6 tenants on one tenancy.
const MAX_TENANTS = 6;

export default async function TenancyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; ended?: string; error?: string }>;
}) {
  const { id } = await params;
  const { saved, ended, error } = await searchParams;
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

  // The lease documents for this tenancy. A failed lookup just hides the list.
  const documents = await listDocuments(session.backendToken, details.id).catch(() => []);
  const current = details.tenants.filter((tenant) => !tenant.leftAt);
  const past = details.tenants.filter((tenant) => tenant.leftAt);
  const isActive = details.status === "Active";
  const title = context ? `${context.property.name} · ${context.unit.label}` : "Lease";
  const address = context ? `${context.property.line1}, ${context.property.city}, ${context.property.region}` : "";
  const inviteHref = `/landlord/tenants?unitId=${details.unitId}&tenancyId=${details.id}`;

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={address || "Lease details and tenants."} />

      {saved === "1" && <p className="rounded-lg bg-green-50 px-3 py-2.5 text-sm font-medium text-green-700">Lease details saved.</p>}
      {saved === "1" && documents.some((d) => d.status === "Draft" || d.status === "AwaitingLandlord") && (
        <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
          The terms changed. Make sure the lease PDF matches:{" "}
          <Link href={`/landlord/documents/${documents.find((d) => d.status === "Draft" || d.status === "AwaitingLandlord")!.id}`} className="font-semibold underline">open the lease and replace the PDF</Link> if needed.
        </p>
      )}
      {ended === "1" && <p className="rounded-lg bg-green-50 px-3 py-2.5 text-sm font-medium text-green-700">Their stay has ended.</p>}
      {error && <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>
          {isActive ? "Active" : "Ended"}
        </span>
        {isActive && (
          <div className="flex gap-2">
            <Link href={`/landlord/tenancies/${details.id}/edit`} className="rounded-full border border-default bg-white px-4 py-2 text-sm font-semibold text-heading hover:bg-subtle">
              Edit lease details
            </Link>
            {current.length < MAX_TENANTS && (
              <Link href={inviteHref} className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark">
                + Add co-tenant
              </Link>
            )}
          </div>
        )}
      </div>

      {documents.some((d) => d.status === "AwaitingTenants" || d.status === "Completed" || d.status === "Expired") && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          A lease has been sent for signing. It keeps the terms it was sent with, so changes made to the terms here will not change what was signed.
        </p>
      )}
      <LeaseTerms details={details} />

      {details.renewal && (details.termType === "Fixed" || details.renewal.monthToMonthSince) && (
        <section className="rounded-2xl border border-default bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-heading">Renewal</h2>
            {details.termType === "Fixed" && <RenewalPill state={details.renewal.state} decision={details.renewal.status} />}
          </div>
          {details.termType === "Fixed" ? (
            <>
              <div className="grid grid-cols-2 gap-4 text-sm lg:grid-cols-4">
                <div><p className="text-xs text-muted">Term ends</p><p className="font-medium text-heading">{details.endDate ? formatCalendarDate(details.endDate) : "No end date"}</p></div>
                <div><p className="text-xs text-muted">Notice period</p><p className="font-medium text-heading">{details.renewal.noticeDays ? `${details.renewal.noticeDays} days` : "Your default"}</p></div>
                <div><p className="text-xs text-muted">Tell them by</p><p className="font-medium text-heading">{details.renewal.sendByDate ? formatCalendarDate(details.renewal.sendByDate) : "Not set"}</p></div>
                <div><p className="text-xs text-muted">Your plan</p><p className="font-medium text-heading">{decisionWord(details.renewal.status)}</p></div>
              </div>
              {isActive && (
                <div className="mt-4">
                  <RenewalDialogButton
                    tenancyId={details.id}
                    heading={title}
                    endDate={details.endDate ? formatCalendarDate(details.endDate) : null}
                    decision={details.renewal.status}
                    noticeDays={details.renewal.noticeDays}
                    snoozed={Boolean(details.renewal.snoozedUntil)}
                    label={details.renewal.status === "Pending" ? "Decide" : "Change decision"}
                    primary={details.renewal.status === "Pending"}
                  />
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-body">
              This lease continues month to month since {formatCalendarDate(details.renewal.monthToMonthSince!)}
              {details.renewal.previousEndDate ? `. It was a fixed term until ${formatCalendarDate(details.renewal.previousEndDate)}.` : "."}
            </p>
          )}
        </section>
      )}

      <section className="rounded-2xl border border-default bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-heading">Lease documents</h2>
          {isActive && (
            <Link href={`/landlord/tenancies/${details.id}/documents/new`} className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark">
              Add lease
            </Link>
          )}
        </div>
        {documents.length === 0 ? (
          <p className="text-sm text-muted">No lease has been sent for signing yet.</p>
        ) : (
          <ul className="divide-y divide-default text-sm">
            {documents.map((document) => (
              <li key={document.id}>
                <Link href={`/landlord/documents/${document.id}`} className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-3 hover:bg-subtle">
                  <span>
                    <span className="font-medium text-heading">{document.title}</span>
                    <span className="ml-2 text-xs text-muted">{document.publicCode} · {document.signedCount} of {document.signerCount} signed</span>
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusFor(document.status, document.signedCount > 0).className}`}>{statusFor(document.status, document.signedCount > 0).label}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-default bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-heading">
          Tenants on this lease ({current.length} of {MAX_TENANTS})
        </h2>
        <ul className="divide-y divide-default text-sm">
          {current.map((tenant) => (
            <li key={tenant.tenantProfileId} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <span>
                <span className="font-medium text-heading">{tenant.name ?? "Unknown tenant"}</span>
                {tenant.email && <span className="ml-2 text-xs text-muted">{tenant.email}</span>}
                <span className="ml-2 text-xs text-muted">joined {formatCalendarDate(tenant.joinedAt)}</span>
              </span>
              <span className="flex items-center gap-3">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tenant.role === "Primary" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                  {tenant.role === "Primary" ? "Primary" : "Co-tenant"}
                </span>
                {tenant.role === "CoTenant" && isActive && (
                  <EndStayButton tenancyId={details.id} tenantProfileId={tenant.tenantProfileId} name={tenant.name ?? "They"} />
                )}
              </span>
            </li>
          ))}
          {past.map((tenant) => (
            <li key={tenant.tenantProfileId} className="flex justify-between py-3 text-muted">
              <span>
                {tenant.name ?? "Unknown tenant"} · left {tenant.leftAt ? formatCalendarDate(tenant.leftAt) : ""}
              </span>
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">Left</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">
          The primary tenant can&apos;t be removed here, and a lease can&apos;t be ended from this page yet.
        </p>
      </section>
    </div>
  );
}
