// The landlord's Renewals page: fixed-term leases that are ending (or already past their end date with no decision), and what the landlord plans.
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireBackendToken } from "@/lib/auth-guard";
import { backendFetch } from "@/lib/api-client";
import { SessionExpiredError } from "@/lib/api-error";
import { formatCalendarDate } from "@/lib/format-time";
import { listRenewals, listTenancies } from "@/lib/tenancy-api";
import { PageHeader } from "@/components/page-header";
import { RenewalDialogButton } from "@/components/renewal-dialog";
import { RenewalPill } from "@/components/renewal-parts";
import type { Property } from "@/lib/types";

const RANGES = [90, 180, 365] as const;

export default async function RenewalsPage({ searchParams }: { searchParams: Promise<{ within?: string }> }) {
  const { within } = await searchParams;
  const withinDays = RANGES.find((range) => String(range) === within) ?? 180;
  const session = await requireBackendToken(["Admin", "Landlord"]);
  const token = session.backendToken;

  let rows;
  let leases;
  let properties: Property[] = [];
  try {
    const [renewalRows, leaseList, propertyResponse] = await Promise.all([
      listRenewals(token, withinDays),
      listTenancies(token, { activeOnly: true, page: 1, pageSize: 100 }),
      backendFetch("/api/v1/properties/mine", token, { cache: "no-store" }),
    ]);
    if (propertyResponse.status === 401) throw new SessionExpiredError();
    rows = renewalRows;
    leases = leaseList.items;
    properties = propertyResponse.ok ? await propertyResponse.json() : [];
  } catch (err) {
    if (err instanceof SessionExpiredError) redirect("/session-expired");
    throw err;
  }

  const unitLookup = new Map<number, { property: string; unit: string }>();
  for (const property of properties) for (const unit of property.units) unitLookup.set(unit.id, { property: property.name, unit: unit.label });
  const leaseById = new Map(leases.map((lease) => [lease.id, lease]));

  const tabClass = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-semibold ${active ? "bg-accent text-white" : "border border-default bg-white text-heading hover:bg-subtle"}`;

  return (
    <div className="space-y-6">
      <PageHeader title="Renewals" description="Fixed-term leases that are ending, and what you plan to do." />

      <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2">
        {RANGES.map((range) => (
          <Link key={range} href={`/landlord/renewals?within=${range}`} className={tabClass(range === withinDays)}>
            Next {range} days
          </Link>
        ))}
      </div>
        <Link href="/landlord/renewals/settings" className="rounded-full border border-default bg-white px-4 py-2 text-sm font-semibold text-heading hover:bg-subtle">
          Reminder settings
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="max-w-2xl rounded-2xl border border-default bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-heading">No fixed-term leases are ending in the next {withinDays} days</p>
          <p className="mt-1 text-sm text-muted">Leases with an end date show up here, with a date to tell your tenants by. Month-to-month leases don&apos;t need a renewal.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-default bg-white shadow-sm">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-default text-xs text-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">Unit</th>
                <th className="px-5 py-3 font-semibold">Tenant</th>
                <th className="px-5 py-3 font-semibold">Ends</th>
                <th className="px-5 py-3 font-semibold">Tell them by</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-default">
              {rows.map((row) => {
                const where = unitLookup.get(row.unitId);
                const lease = leaseById.get(row.tenancyId);
                const heading = where ? `${where.property}, ${where.unit}` : `Unit ${row.unitId}`;
                return (
                  <tr key={row.tenancyId}>
                    <td className="px-5 py-4">
                      <p className="font-medium text-heading">{where?.property ?? "Property"}</p>
                      <p className="text-xs text-muted">{where?.unit ?? `Unit ${row.unitId}`}</p>
                    </td>
                    <td className="px-5 py-4 text-heading">
                      {lease?.primaryTenantName ?? "Tenant"}
                      {lease && lease.currentTenants > 1 && <span className="ml-1 text-xs text-muted">+{lease.currentTenants - 1}</span>}
                    </td>
                    <td className="px-5 py-4 text-heading">
                      {formatCalendarDate(row.endDate)}
                      <span className="block text-xs text-muted">{row.daysToEnd >= 0 ? `in ${row.daysToEnd} days` : `${-row.daysToEnd} days ago`}</span>
                    </td>
                    <td className="px-5 py-4 text-body">{formatCalendarDate(row.sendByDate)}</td>
                    <td className="px-5 py-4"><RenewalPill state={row.state} decision={row.decision} /></td>
                    <td className="px-5 py-4 text-right">
                      <span className="flex items-center justify-end gap-3">
                        <RenewalDialogButton
                          tenancyId={row.tenancyId}
                          heading={heading}
                          endDate={formatCalendarDate(row.endDate)}
                          decision={row.decision}
                          noticeDays={row.noticeDays}
                          snoozed={Boolean(row.snoozedUntil)}
                          label={row.state === "Decided" ? "Change" : "Decide"}
                          primary={row.state !== "Decided"}
                        />
                        <Link href={`/landlord/tenancies/${row.tenancyId}`} className="text-xs font-semibold text-heading hover:text-accent">Open</Link>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="max-w-3xl text-xs text-muted">
        Overdue means the end date has passed and no decision is recorded. A decision only records your plan: nothing is sent to the tenant, and the app does not check it against
        provincial rules. Renewal reminders by email and in the app are a paid feature.
      </p>
    </div>
  );
}
