// Small presentational cards for the landlord dashboard. Each takes plain data, so the page decides what to fetch.
import Link from "next/link";
import { formatRelativeTime } from "@/lib/format-time";
import type { DocumentListItem } from "@/lib/document-types";
import type { ActivityItem, MySubscription, Property, TenantInviteStats } from "@/lib/types";

// White card with a title and an optional link on the right.
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

// A thin progress bar; the fill is capped at 100%.
function Bar({ value, total }: { value: number; total: number }) {
  const percent = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div className="h-2 rounded-full bg-accent-tint">
      <div className="h-2 rounded-full bg-accent" style={{ width: `${percent}%` }} />
    </div>
  );
}

// One number with a label and a short note under it.
export function StatTile({ label, value, note }: { label: string; value: string | number; note: string }) {
  return (
    <div className="rounded-2xl border border-default bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className="mt-1 font-head text-3xl font-bold text-heading">{value}</p>
      <p className="mt-1 text-xs text-muted">{note}</p>
    </div>
  );
}

// How full each property is: occupied units out of all its units.
export function OccupancyCard({ properties }: { properties: Property[] }) {
  return (
    <Card title="Occupancy by property" href="/landlord/properties">
      {properties.length === 0 ? (
        <p className="text-sm text-muted">Add a property to see how full it is.</p>
      ) : (
        <ul className="space-y-4">
          {properties.slice(0, 6).map((property) => {
            const occupied = property.units.filter((unit) => unit.status === "Occupied").length;
            return (
              <li key={property.id}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <Link href={`/landlord/properties/${property.id}`} className="font-medium text-heading hover:text-accent">
                    {property.name}
                  </Link>
                  <span className="text-muted">
                    {occupied} of {property.units.length} units
                  </span>
                </div>
                <Bar value={occupied} total={property.units.length} />
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

// The landlord's plan name and how much of each limit they have used.
export function PlanUsageCard({ subscription }: { subscription: MySubscription }) {
  return (
    <Card title={subscription.packageName ? `${subscription.packageName} plan` : "Your plan"} href="/landlord/billing" linkLabel="Billing">
      <ul className="space-y-4">
        {subscription.limits.map((limit) => (
          <li key={limit.key}>
            <div className="mb-1.5 flex justify-between text-sm">
              <span className="text-heading">{limit.displayName}</span>
              <span className="text-muted">
                {limit.used} / {limit.limit}
              </span>
            </div>
            <Bar value={limit.used} total={limit.limit} />
          </li>
        ))}
      </ul>
    </Card>
  );
}

// Counts of the invites the landlord has sent, by what happened to them.
export function InvitesCard({ stats }: { stats: TenantInviteStats }) {
  const rows = [
    { label: "Waiting for an answer", value: stats.pending },
    { label: "Accepted", value: stats.accepted },
    { label: "Declined", value: stats.declined },
    { label: "Expired", value: stats.expired },
  ];
  return (
    <Card title="Tenant invites" href="/landlord/tenants">
      <ul className="divide-y divide-default text-sm">
        {rows.map((row) => (
          <li key={row.label} className="flex justify-between py-2 first:pt-0 last:pb-0">
            <span className="text-body">{row.label}</span>
            <span className="font-semibold text-heading">{row.value}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

// The latest few things that happened on the account.
export function RecentActivityCard({ items }: { items: ActivityItem[] }) {
  return (
    <Card title="Recent activity" href="/landlord/activity">
      {items.length === 0 ? (
        <p className="text-sm text-muted">Nothing has happened on your account yet.</p>
      ) : (
        <ul className="divide-y divide-default text-sm">
          {items.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3 py-2 first:pt-0 last:pb-0">
              <span className="text-heading">{item.summary}</span>
              <span className="shrink-0 text-xs text-muted">{formatRelativeTime(item.occurredAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// Honest stand-in: rent collection is not built yet, so this says so instead of showing zeros.
export function RentComingSoonCard() {
  return (
    <section className="rounded-2xl border border-dashed border-default bg-white/60 p-5">
      <h2 className="text-sm font-semibold text-heading">Rent and payments</h2>
      <p className="mt-1 text-sm text-muted">Rent received, upcoming and overdue will appear here once online payments are available.</p>
    </section>
  );
}

// Lease documents that need the landlord: unsigned or unsent leases, ones that ran out, and ones a tenant declined.
export function LeaseActionsCard({ documents }: { documents: DocumentListItem[] }) {
  const waitingForTenants = documents.filter((d) => d.status === "AwaitingTenants").length;
  const needsAction = documents
    .filter((d) => d.status === "AwaitingLandlord" || d.status === "Expired" || d.status === "Declined")
    .slice(0, 5);
  const words = { AwaitingLandlord: "Sign and send", Expired: "Ran out, give more time", Declined: "A tenant declined" } as const;

  return (
    <Card title="Lease documents" href="/landlord/leases" linkLabel="Leases">
      {needsAction.length === 0 ? (
        <p className="text-sm text-muted">
          {waitingForTenants > 0 ? `${waitingForTenants} waiting for tenants to sign.` : "Nothing needs your attention."}
        </p>
      ) : (
        <ul className="divide-y divide-default text-sm">
          {needsAction.map((document) => (
            <li key={document.id}>
              <Link href={`/landlord/documents/${document.id}`} className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-subtle">
                <span className="truncate text-heading">{document.title}</span>
                <span className="shrink-0 text-xs font-semibold text-accent">{words[document.status as keyof typeof words]}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
