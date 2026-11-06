// Tenant: "My requests" — the maintenance problems the tenant and their co-tenants reported, in Open, Done and Cancelled tabs.
import Link from "next/link";
import { redirect } from "next/navigation";
import { SessionExpiredError } from "@/lib/api-error";
import { requireBackendToken } from "@/lib/auth-guard";
import { formatCalendarDate } from "@/lib/format-time";
import { listMyRequests } from "@/lib/maintenance-api";
import { STATUS_PILL, progressLine } from "@/lib/maintenance-format";
import type { RequestListItem } from "@/lib/maintenance-types";

const TABS = [
  { key: "open", label: "Open", match: (r: RequestListItem) => r.status === "New" || r.status === "InProgress" },
  { key: "done", label: "Done", match: (r: RequestListItem) => r.status === "Done" },
  { key: "cancelled", label: "Cancelled", match: (r: RequestListItem) => r.status === "Cancelled" },
];

export default async function TenantRequestsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const session = await requireBackendToken(["Tenant"]);

  let requests: RequestListItem[] | null;
  try {
    requests = await listMyRequests(session.backendToken);
  } catch (err) {
    if (err instanceof SessionExpiredError) redirect("/session-expired");
    requests = null;
  }

  const active = TABS.find((item) => item.key === tab) ?? TABS[0];
  const shown = requests?.filter(active.match) ?? [];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-head text-2xl font-bold text-heading">My requests</h1>
          <p className="mt-1 text-sm text-muted">Problems reported for your home, including the ones your co-tenants reported.</p>
        </div>
        <Link href="/tenant/requests/new" className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark">
          Report a problem
        </Link>
      </div>

      {requests === null ? (
        <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">Couldn&apos;t load your requests. Refresh to try again.</p>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {TABS.map((item) => (
              <Link
                key={item.key}
                href={`/tenant/requests?tab=${item.key}`}
                className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${
                  item.key === active.key ? "border-heading bg-heading text-white" : "border-default bg-white text-heading hover:bg-subtle"
                }`}
              >
                {item.label} {requests.filter(item.match).length}
              </Link>
            ))}
          </div>

          {shown.length === 0 ? (
            <div className="max-w-2xl rounded-2xl border border-default bg-white p-8 text-center shadow-sm">
              <p className="text-sm font-medium text-heading">{active.key === "open" ? "Nothing needs fixing" : `No ${active.label.toLowerCase()} requests`}</p>
              <p className="mt-1 text-sm text-muted">
                {active.key === "open" ? "When something breaks, report it here and your landlord is told." : "They show up here when they change."}
              </p>
            </div>
          ) : (
            <ul className="max-w-4xl space-y-3">
              {shown.map((request) => (
                <li key={request.id}>
                  <Link href={`/tenant/requests/${request.id}`} className="flex items-center gap-4 rounded-2xl border border-default bg-white p-4 shadow-sm hover:border-accent">
                    <span className="w-20 shrink-0 text-sm font-semibold text-heading">{request.number}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-heading">{request.title}</p>
                      <p className="truncate text-xs text-muted">
                        {progressLine(request)} · reported {formatCalendarDate(request.createdAt)} by {request.reportedByMe ? "you" : request.reportedByName}
                        {request.canReopen && request.reopenUntil && (
                          <> · <span className="font-semibold text-accent">Still not fixed?</span> (until {formatCalendarDate(request.reopenUntil)})</>
                        )}
                      </p>
                    </div>
                    {request.urgency === "Emergency" && <span className="shrink-0 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800">Emergency</span>}
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_PILL[request.status].className}`}>{STATUS_PILL[request.status].label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
