// Activity: what happened on the landlord's account (plan changes, sign-ins, property and tenant changes), newest first,
// with an area filter, a time filter and an "Older activity" button.
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { getActivity } from "@/lib/activity-api";
import { SessionExpiredError } from "@/lib/api-error";
import { requireBackendToken } from "@/lib/auth-guard";
import { formatRelativeTime } from "@/lib/format-time";
import type { ActivityPage } from "@/lib/types";

// The areas the filter offers: the label shown, and the backend's audit module.
const AREAS = [
  { label: "All areas", value: "" },
  { label: "Plan and billing", value: "subscription" },
  { label: "Sign-in and security", value: "auth" },
  { label: "Properties", value: "property" },
  { label: "Units", value: "unit" },
  { label: "Tenants", value: "tenant" },
  { label: "Leases", value: "lease" },
] as const;

const PERIODS = [
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30" },
  { label: "Last 90 days", value: "90" },
  { label: "All time", value: "" },
] as const;

interface SearchParams {
  area?: string;
  days?: string;
  before?: string;
}

export default async function ActivityPageView({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const session = await requireBackendToken(["Landlord"]);

  // Only values from the lists above reach the backend, so a hand-edited URL can't send anything else.
  const area = AREAS.find((a) => a.value === params.area)?.value ?? "";
  const days = PERIODS.find((p) => p.value === params.days)?.value ?? "30";
  const beforeId = Number(params.before) > 0 ? Number(params.before) : undefined;

  let page: ActivityPage | null = null;
  let failed = false;
  try {
    page = await getActivity(session.backendToken, { module: area || undefined, days: days ? Number(days) : undefined, beforeId });
  } catch (err) {
    if (err instanceof SessionExpiredError) redirect("/session-expired");
    failed = true;
  }

  // Builds a link to this page with the same filters and a different position.
  function href(next: { before?: number }) {
    const query = new URLSearchParams();
    if (area) query.set("area", area);
    query.set("days", days);
    if (next.before) query.set("before", String(next.before));
    return `/landlord/activity?${query}`;
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Activity" description="What happened on your account." />

      {/* A plain GET form: the filters live in the URL, so no JavaScript is needed. */}
      <form action="/landlord/activity" className="flex max-w-2xl flex-wrap items-center gap-2 text-sm">
        <select name="area" defaultValue={area} aria-label="Area" className="rounded-xl border border-default bg-white px-3 py-2">
          {AREAS.map((a) => (
            <option key={a.label} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
        <select name="days" defaultValue={days} aria-label="Time" className="rounded-xl border border-default bg-white px-3 py-2">
          {PERIODS.map((p) => (
            <option key={p.label} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-xl border border-default bg-white px-4 py-2 font-semibold text-body hover:bg-subtle">
          Apply
        </button>
      </form>

      <div className="max-w-2xl overflow-hidden rounded-2xl border border-default bg-white shadow-sm">
        {failed || !page ? (
          <p className="p-6 text-sm text-muted">We couldn&apos;t load your activity right now. Refresh the page to try again.</p>
        ) : page.items.length === 0 ? (
          <p className="p-6 text-sm text-muted">Nothing here for these filters.</p>
        ) : (
          <ul className="divide-y divide-default">
            {page.items.map((item) => (
              <li key={item.id} className="px-5 py-4">
                <p className="text-sm font-semibold text-heading">{item.summary}</p>
                <p className="mt-0.5 text-xs text-muted">
                  By {item.actorLabel} ·{" "}
                  <time dateTime={item.occurredAt} suppressHydrationWarning>
                    {formatRelativeTime(item.occurredAt)}
                  </time>
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {page && (beforeId || page.nextBeforeId) && (
        <div className="flex max-w-2xl items-center justify-between text-sm font-semibold">
          {beforeId ? (
            <Link href={href({})} className="text-accent hover:text-accent-dark">
              Back to newest
            </Link>
          ) : (
            <span />
          )}
          {page.nextBeforeId && (
            <Link href={href({ before: page.nextBeforeId })} className="text-accent hover:text-accent-dark">
              Older activity
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
