// Cards for the tenant home, in the same style as the landlord dashboard: white cards with a title and a link on the right.
import Link from "next/link";
import { STATUS_LABELS } from "@/lib/document-format";
import { formatCalendarDate } from "@/lib/format-time";
import type { DocumentListItem } from "@/lib/document-types";
import { formatMoney } from "@/lib/lease-format";
import type { TenancyDetails } from "@/lib/tenancy-types";
import type { TenantTenancy } from "@/lib/types";

function Card({ title, href, linkLabel, children }: { title: string; href?: string; linkLabel?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-default bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-heading">{title}</h2>
        {href && (
          <Link href={href} className="text-xs font-semibold text-accent hover:text-accent-dark">
            {linkLabel ?? "View all"}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

// The leases and documents the landlord sent, newest first, with what the tenant has to do.
export function TenantDocumentsCard({ documents }: { documents: DocumentListItem[] }) {
  return (
    <Card title="Documents" href="/tenant/documents">
      {documents.length === 0 ? (
        <p className="text-sm text-muted">When your landlord sends you a lease to sign, it shows up here.</p>
      ) : (
        <ul className="divide-y divide-default text-sm">
          {documents.slice(0, 4).map((document) => {
            const waiting = document.status === "AwaitingTenants" && document.yourStatus === "Pending";
            const word = waiting
              ? "Needs your signature"
              : document.yourStatus === "Signed" && document.status === "AwaitingTenants"
                ? "You signed"
                : STATUS_LABELS[document.status].label;
            return (
              <li key={document.id}>
                <Link href={`/tenant/documents/${document.id}`} className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 hover:bg-subtle">
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-heading">{document.title}</span>
                    {waiting && document.expiresAt && <span className="block text-xs text-muted">Sign by {formatCalendarDate(document.expiresAt)}</span>}
                  </span>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${waiting ? "bg-accent-tint text-accent-dark" : STATUS_LABELS[document.status].className}`}>{word}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

// Who to contact: each landlord of the tenant's current homes, once.
export function LandlordContactCard({ tenancies }: { tenancies: TenantTenancy[] }) {
  const landlords = new Map<string, NonNullable<TenantTenancy["landlord"]>>();
  for (const tenancy of tenancies) {
    if (tenancy.landlord) landlords.set(tenancy.landlord.email ?? tenancy.landlord.name, tenancy.landlord);
  }
  if (landlords.size === 0) return null;

  return (
    <Card title={landlords.size === 1 ? "Your landlord" : "Your landlords"}>
      <ul className="divide-y divide-default text-sm">
        {[...landlords.values()].map((landlord) => (
          <li key={landlord.email ?? landlord.name} className="py-2.5 first:pt-0 last:pb-0">
            <p className="font-medium text-heading">{landlord.name}</p>
            {landlord.businessName && <p className="text-xs text-muted">{landlord.businessName}</p>}
            {landlord.email && (
              <a href={`mailto:${landlord.email}`} className="text-xs font-semibold text-accent hover:text-accent-dark">
                {landlord.email}
              </a>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

// Honest stand-in: paying rent online is not built yet.
export function TenantRentSoonCard() {
  return (
    <section className="rounded-2xl border border-dashed border-default bg-white/60 p-5">
      <h2 className="text-sm font-semibold text-heading">Rent and payments</h2>
      <p className="mt-1 text-sm text-muted">Paying rent online and seeing your receipts will appear here once it is available.</p>
    </section>
  );
}

// A short list of the tenant's current homes, each with its rent, linking to the full My home page.
export function TenantHomesCard({ tenancies, leases }: { tenancies: TenantTenancy[]; leases: (TenancyDetails | null)[] }) {
  return (
    <Card title="My home" href="/tenant/home" linkLabel="Details">
      {tenancies.length === 0 ? (
        <p className="text-sm text-muted">Once a landlord&apos;s invite is accepted, your home shows up here.</p>
      ) : (
        <ul className="divide-y divide-default text-sm">
          {tenancies.map((tenancy, index) => {
            const rent = leases[index]?.monthlyRent ?? null;
            return (
              <li key={tenancy.tenancyId} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <span className="min-w-0">
                  <span className="block truncate font-medium text-heading">{tenancy.property.name}</span>
                  <span className="block truncate text-xs text-muted">
                    {tenancy.unit.label} · {tenancy.property.line1}, {tenancy.property.city}
                  </span>
                </span>
                <span className="shrink-0 text-xs font-semibold text-heading">{rent ? `${formatMoney(rent)} / month` : "Rent not set"}</span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
