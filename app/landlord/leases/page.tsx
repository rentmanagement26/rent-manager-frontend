// The landlord's Leases page: every lease with its tenant, rent, term and where its lease document stands,
// with a way to open the lease or send it for signing. A lease starts when a tenant accepts an invite to a unit.
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireBackendToken } from "@/lib/auth-guard";
import { backendFetch } from "@/lib/api-client";
import { SessionExpiredError } from "@/lib/api-error";
import { listDocuments } from "@/lib/document-api";
import { statusFor } from "@/lib/document-format";
import { formatCalendarDate } from "@/lib/format-time";
import { formatMoney } from "@/lib/lease-format";
import { listTenancies } from "@/lib/tenancy-api";
import { PageHeader } from "@/components/page-header";
import type { DocumentListItem } from "@/lib/document-types";
import type { Property } from "@/lib/types";

export default async function LeasesPage({ searchParams }: { searchParams: Promise<{ show?: string; page?: string }> }) {
  const { show, page } = await searchParams;
  // "All" also lists ended leases; the backend has no "ended only" filter.
  const activeOnly = show !== "all";
  const pageNumber = Math.max(1, Number.parseInt(page ?? "1", 10) || 1);
  const session = await requireBackendToken(["Admin", "Landlord"]);
  const token = session.backendToken;

  let leases;
  let properties: Property[] = [];
  let documents: DocumentListItem[] = [];
  try {
    const [leaseList, propertyResponse, documentList] = await Promise.all([
      listTenancies(token, { activeOnly, page: pageNumber }),
      backendFetch("/api/v1/properties/mine", token, { cache: "no-store" }),
      listDocuments(token).catch(() => [] as DocumentListItem[]),
    ]);
    if (propertyResponse.status === 401) throw new SessionExpiredError();
    leases = leaseList;
    properties = propertyResponse.ok ? await propertyResponse.json() : [];
    documents = documentList;
  } catch (err) {
    if (err instanceof SessionExpiredError) redirect("/session-expired");
    throw err;
  }

  // Which property and unit a lease is for, and the newest lease document of each lease.
  const unitLookup = new Map<number, { property: string; unit: string }>();
  for (const property of properties) {
    for (const unit of property.units) unitLookup.set(unit.id, { property: property.name, unit: unit.label });
  }
  const latestDocument = new Map<number, DocumentListItem>();
  for (const document of documents) {
    if (document.tenancyId !== null && !latestDocument.has(document.tenancyId)) latestDocument.set(document.tenancyId, document);
  }

  const tabClass = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-semibold ${active ? "bg-accent text-white" : "border border-default bg-white text-heading hover:bg-subtle"}`;
  const pageHref = (target: number) => `/landlord/leases?${activeOnly ? "" : "show=all&"}page=${target}`;

  return (
    <div className="space-y-6">
      <PageHeader title="Leases" description="Every lease, its tenants and where its lease document stands." />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Link href="/landlord/leases" className={tabClass(activeOnly)}>Active</Link>
          <Link href="/landlord/leases?show=all" className={tabClass(!activeOnly)}>All leases</Link>
        </div>
        <div className="flex gap-2">
          <Link href="/landlord/tenants" className="rounded-full border border-default bg-white px-4 py-2 text-sm font-semibold text-heading hover:bg-subtle">
            Invite a tenant
          </Link>
          <Link href="/landlord/leases/new" className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark">
            + Add lease
          </Link>
        </div>
      </div>

      {leases.items.length === 0 ? (
        <div className="max-w-2xl rounded-2xl border border-default bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-heading">{activeOnly ? "No active leases yet" : "No leases yet"}</p>
          {activeOnly && (
            <p className="mt-1 text-sm text-muted">
              A lease starts when a tenant accepts your invite to a unit. Invite a tenant, then come back here to fill in the lease details and send the lease for signing.
            </p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-default bg-white shadow-sm">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-default text-xs text-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">Unit</th>
                <th className="px-5 py-3 font-semibold">Primary tenant</th>
                <th className="px-5 py-3 font-semibold">Rent</th>
                <th className="px-5 py-3 font-semibold">Term</th>
                <th className="px-5 py-3 font-semibold">Lease document</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {leases.items.map((lease) => {
                const where = unitLookup.get(lease.unitId);
                const document = latestDocument.get(lease.id);
                return (
                  <tr key={lease.id}>
                    <td className="px-5 py-4">
                      <p className="font-medium text-heading">{where?.property ?? "Property"}</p>
                      <p className="text-xs text-muted">
                        {where?.unit ?? `Unit ${lease.unitId}`}
                        {lease.status !== "Active" && <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">Ended</span>}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-heading">
                      {lease.primaryTenantName ?? "Unknown"}
                      {lease.currentTenants > 1 && <span className="ml-1 text-xs text-muted">+{lease.currentTenants - 1}</span>}
                    </td>
                    <td className="px-5 py-4 text-heading">{formatMoney(lease.monthlyRent)}</td>
                    <td className="px-5 py-4 text-body">
                      {lease.termType === "Fixed" ? "Fixed" : "Month to month"}
                      <span className="block text-xs text-muted">
                        {lease.endDate ? `${formatCalendarDate(lease.startDate)} to ${formatCalendarDate(lease.endDate)}` : `since ${formatCalendarDate(lease.startDate)}`}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {document ? (
                        <Link href={`/landlord/documents/${document.id}`} className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${statusFor(document.status, document.signedCount > 0).className}`}>
                          {statusFor(document.status, document.signedCount > 0).label}
                        </Link>
                      ) : (
                        <span className="text-xs text-muted">Not sent yet</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="flex justify-end gap-3 text-xs font-semibold">
                        {lease.status === "Active" && !document && (
                          <Link href={`/landlord/tenancies/${lease.id}/documents/new`} className="text-accent hover:text-accent-dark">Upload lease</Link>
                        )}
                        <Link href={`/landlord/tenancies/${lease.id}`} className="text-heading hover:text-accent">Open</Link>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {leases.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm font-semibold">
          {leases.page > 1 ? <Link href={pageHref(leases.page - 1)} className="text-accent hover:text-accent-dark">Previous</Link> : <span />}
          <span className="font-normal text-muted">Page {leases.page} of {leases.totalPages}</span>
          {leases.page < leases.totalPages ? <Link href={pageHref(leases.page + 1)} className="text-accent hover:text-accent-dark">Next</Link> : <span />}
        </div>
      )}
    </div>
  );
}
