// The landlord's Maintenance page: the requests from tenants (and the ones the landlord made), with summary tiles, status chips, filters and paging.
import Link from "next/link";
import { redirect } from "next/navigation";
import { StatTile } from "@/components/dashboard-cards";
import { MaintenanceFilters } from "@/components/maintenance-filters";
import { PageHeader } from "@/components/page-header";
import { backendFetch } from "@/lib/api-client";
import { SessionExpiredError } from "@/lib/api-error";
import { requireBackendToken } from "@/lib/auth-guard";
import { formatRelativeTime } from "@/lib/format-time";
import { getSummary, listRequests } from "@/lib/landlord-maintenance-api";
import type { LandlordListFilters, LandlordPage, LandlordSummary } from "@/lib/landlord-maintenance-types";
import { STATUS_PILL, URGENCY_PILL, landlordProgressLine } from "@/lib/maintenance-format";
import type { Property } from "@/lib/types";

const STATUS_CHIPS: { value: string; label: string; count: (summary: LandlordSummary) => number }[] = [
  { value: "", label: "All", count: (s) => s.total },
  { value: "open", label: "Open", count: (s) => s.open },
  { value: "new", label: "New", count: (s) => s.new },
  { value: "in_progress", label: "In progress", count: (s) => s.inProgress },
  { value: "done", label: "Done", count: (s) => s.done },
  { value: "cancelled", label: "Cancelled", count: (s) => s.cancelled },
];

export default async function LandlordMaintenancePage({ searchParams }: { searchParams: Promise<LandlordListFilters> }) {
  const filters = await searchParams;
  const session = await requireBackendToken(["Admin", "Landlord"]);
  const token = session.backendToken;

  let summary: LandlordSummary;
  let page: LandlordPage;
  let properties: Property[] = [];
  try {
    const [summaryResult, pageResult, propertyResponse] = await Promise.all([
      getSummary(token, filters.propertyId),
      listRequests(token, filters),
      backendFetch("/api/v1/properties/mine", token, { cache: "no-store" }),
    ]);
    if (propertyResponse.status === 401) throw new SessionExpiredError();
    summary = summaryResult;
    page = pageResult;
    properties = propertyResponse.ok ? await propertyResponse.json() : [];
  } catch (err) {
    if (err instanceof SessionExpiredError) redirect("/session-expired");
    return <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">Couldn&apos;t load your maintenance requests. Refresh to try again.</p>;
  }

  // A link that keeps the current filters and changes some of them (an empty value removes the filter).
  const linkWith = (changes: Record<string, string>) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...filters, ...changes })) if (value) query.set(key, value);
    const text = query.toString();
    return `/landlord/maintenance${text ? `?${text}` : ""}`;
  };
  const activeStatus = filters.status ?? "";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance"
        description="Requests from your tenants."
        action={
          <div className="flex gap-2">
            <Link href="/landlord/maintenance/settings" className="rounded-full border border-default bg-white px-4 py-2 text-sm font-semibold text-heading hover:bg-subtle">
              Settings
            </Link>
            <Link href="/landlord/maintenance/new" className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark">
              + New request
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="New" value={summary.new} note={summary.unseen > 0 ? `${summary.unseen} not opened yet` : "All opened"} />
        <StatTile label="In progress" value={summary.inProgress} note="Waiting on a contractor or a visit" />
        <StatTile label="Open emergencies" value={summary.openEmergencies} note={summary.openEmergencies > 0 ? "Look at these first" : "None right now"} />
        <StatTile label="Done" value={summary.doneLast30Days} note="In the last 30 days" />
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_CHIPS.map((chip) => (
          <Link
            key={chip.value}
            href={linkWith({ status: chip.value, page: "" })}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${
              chip.value === activeStatus ? "border-heading bg-heading text-white" : "border-default bg-white text-heading hover:bg-subtle"
            }`}
          >
            {chip.label} {chip.count(summary)}
          </Link>
        ))}
      </div>

      <MaintenanceFilters properties={properties.map((property) => ({ value: String(property.id), label: property.name }))} />

      {page.items.length === 0 ? (
        <div className="max-w-2xl rounded-2xl border border-default bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-heading">No requests here</p>
          <p className="mt-1 text-sm text-muted">When a tenant reports a problem it shows up in this list and you are told.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {page.items.map((request) => {
            const progress = landlordProgressLine(request);
            return (
              <li key={request.id}>
                <Link
                  href={`/landlord/maintenance/${request.id}`}
                  className={`flex items-center gap-4 rounded-2xl border bg-white p-4 shadow-sm hover:border-accent ${request.urgency === "Emergency" && request.status !== "Done" ? "border-red-200" : "border-default"}`}
                >
                  <span className="flex w-24 shrink-0 items-center gap-2 text-sm font-semibold text-heading">
                    {request.unseen && <span aria-label="Not opened yet" className="h-2 w-2 shrink-0 rounded-full bg-accent" />}
                    {request.number}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-heading">{request.title}</p>
                    <p className="truncate text-xs text-muted">
                      {request.placeLabel}
                      {request.photoCount > 0 && ` · ${request.photoCount} photo${request.photoCount === 1 ? "" : "s"}`}
                      {request.hasVideo && " · video"}
                      {progress && ` · ${progress}`}
                    </p>
                  </div>
                  <span className="hidden w-40 shrink-0 truncate text-xs text-muted md:block">
                    {request.reportedByRole === "Landlord" ? "You" : request.reportedByName}
                    <br />
                    {formatRelativeTime(request.createdAt)}
                  </span>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${URGENCY_PILL[request.urgency]}`}>{request.urgency}</span>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_PILL[request.status].className}`}>{STATUS_PILL[request.status].label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {page.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted">
          <span>
            Page {page.page} of {page.totalPages} · {page.totalCount} requests
          </span>
          <div className="flex gap-2">
            {page.page > 1 && (
              <Link href={linkWith({ page: String(page.page - 1) })} className="rounded-full border border-default bg-white px-4 py-1.5 font-semibold text-heading hover:bg-subtle">
                Previous
              </Link>
            )}
            {page.page < page.totalPages && (
              <Link href={linkWith({ page: String(page.page + 1) })} className="rounded-full border border-default bg-white px-4 py-1.5 font-semibold text-heading hover:bg-subtle">
                Next
              </Link>
            )}
          </div>
        </div>
      )}
      <p className="text-xs text-muted">An orange dot means you have not opened that request yet. Emergencies come first, then the oldest.</p>
    </div>
  );
}
