// Start a new lease: pick the unit (an active lease with its tenants) to create the lease document for.
// A lease record starts when a tenant accepts an invite, so units without a tenant can't be picked yet and the page says how to get one.
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireBackendToken } from "@/lib/auth-guard";
import { backendFetch } from "@/lib/api-client";
import { SessionExpiredError } from "@/lib/api-error";
import { listDocuments } from "@/lib/document-api";
import { STATUS_LABELS, isOpen } from "@/lib/document-format";
import { listTenancies } from "@/lib/tenancy-api";
import { PageHeader } from "@/components/page-header";
import type { DocumentListItem } from "@/lib/document-types";
import type { Property } from "@/lib/types";

export default async function NewLeasePage() {
  const session = await requireBackendToken(["Admin", "Landlord"]);
  const token = session.backendToken;

  let leases;
  let properties: Property[] = [];
  let documents: DocumentListItem[] = [];
  try {
    const [leaseList, propertyResponse, documentList] = await Promise.all([
      listTenancies(token, { activeOnly: true, page: 1 }),
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

  const unitLookup = new Map<number, { property: string; unit: string }>();
  for (const property of properties) {
    for (const unit of property.units) unitLookup.set(unit.id, { property: property.name, unit: unit.label });
  }
  // A lease that already has a lease document still being signed should be continued, not started again.
  const openDocument = new Map<number, DocumentListItem>();
  for (const document of documents) {
    if (document.tenancyId !== null && isOpen(document.status) && !openDocument.has(document.tenancyId)) openDocument.set(document.tenancyId, document);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="Create lease" description="Choose the unit the lease is for." />

      {leases.items.length === 0 ? (
        <div className="rounded-2xl border border-default bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-heading">No unit has a tenant yet</p>
          <p className="mt-1 text-sm text-muted">A lease starts when a tenant accepts your invite to a unit. Invite a tenant first, then come back here.</p>
          <Link href="/landlord/tenants" className="mt-4 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark">
            Invite a tenant
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {leases.items.map((lease) => {
            const where = unitLookup.get(lease.unitId);
            const existing = openDocument.get(lease.id);
            return (
              <li key={lease.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-default bg-white p-5 shadow-sm">
                <div className="min-w-0">
                  <p className="font-semibold text-heading">{where ? `${where.property} · ${where.unit}` : `Unit ${lease.unitId}`}</p>
                  <p className="text-sm text-muted">
                    {lease.primaryTenantName ?? "Tenant"}
                    {lease.currentTenants > 1 ? ` and ${lease.currentTenants - 1} more` : ""}
                  </p>
                </div>
                {existing ? (
                  <Link href={`/landlord/documents/${existing.id}`} className="flex items-center gap-3 text-sm font-semibold">
                    <span className={`rounded-full px-2.5 py-1 text-xs ${STATUS_LABELS[existing.status].className}`}>{STATUS_LABELS[existing.status].label}</span>
                    <span className="text-accent hover:text-accent-dark">Continue</span>
                  </Link>
                ) : (
                  <Link href={`/landlord/tenancies/${lease.id}/documents/new`} className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark">
                    Create lease
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
