// The landlord's page for one maintenance request: the problem and photos, access details, tenants, the whole timeline (with who may read
// each line) and the actions the backend allows. Opening an open request for the first time marks it Seen and tells the tenants.
// Contractor jobs and quotes are added with the contractor screens.
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { LandlordCommentBox, LandlordRequestButtons, UrgencyPicker } from "@/components/landlord-request-actions";
import { LocalMoment } from "@/components/local-moment";
import { PageHeader } from "@/components/page-header";
import { SessionExpiredError } from "@/lib/api-error";
import { requireBackendToken } from "@/lib/auth-guard";
import { formatCalendarDate } from "@/lib/format-time";
import { getRequest } from "@/lib/landlord-maintenance-api";
import type { LandlordMedia, LandlordRequestDetail, Visibility } from "@/lib/landlord-maintenance-types";
import { STATUS_PILL, URGENCY_PILL, accessSummary, labelOf, LOCATIONS, landlordProgressLine } from "@/lib/maintenance-format";

const cardClass = "rounded-2xl border border-default bg-white p-5 shadow-sm";
const labelClass = "text-muted";

// The small tag next to a timeline line that not everyone can read.
const VISIBILITY_TAG: Record<Visibility, string | null> = { Everyone: null, Work: "contractor and you", Private: "only you" };

// One photo or video. The address stops working after about 10 minutes, which is fine because the page is loaded fresh each visit.
function Media({ item }: { item: LandlordMedia }) {
  if (item.kind === "Video") {
    return <video src={item.url} controls preload="metadata" className="h-24 w-32 rounded-lg bg-black object-cover" aria-label={item.fileName} />;
  }
  return (
    <a href={item.url} target="_blank" rel="noreferrer" title={`${item.fileName} · added by ${item.uploadedByName}`}>
      {/* The address is a short-lived signed storage link, so next/image cannot optimise it. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.url} alt={item.fileName} className="h-24 w-32 rounded-lg object-cover" />
    </a>
  );
}

export default async function LandlordRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const session = await requireBackendToken(["Admin", "Landlord"]);

  let request: LandlordRequestDetail | null;
  try {
    request = await getRequest(session.backendToken, Number(id));
  } catch (err) {
    if (err instanceof SessionExpiredError) redirect("/session-expired");
    return <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">Couldn&apos;t load this request. Refresh to try again.</p>;
  }
  if (!request) notFound();

  const pill = STATUS_PILL[request.status];
  const progress = landlordProgressLine(request, { received: request.quotesReceived, open: request.quotesOpen });
  const place = request.commonAreaLocation ? `${labelOf(LOCATIONS, request.location)} (${request.commonAreaLocation})` : labelOf(LOCATIONS, request.location);
  const permissions = request.permissions;

  return (
    <div className="space-y-4">
      <PageHeader title={`${request.number} · ${request.title}`} description={request.placeLabel} />

      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${pill.className}`}>{pill.label}</span>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${URGENCY_PILL[request.urgency]}`}>{request.urgency}</span>
        {progress && <span className="rounded-lg border border-default bg-white px-3 py-1 text-xs font-semibold text-heading">{progress}</span>}
        {request.job && <span className="text-xs text-muted">A contractor has this job.</span>}
      </div>

      {request.status === "Cancelled" && request.cancelReason && <p className="text-sm text-body">Cancelled: {request.cancelReason}</p>}
      {permissions.canReopen && permissions.reopenUntil && <p className="text-sm text-body">Marked done. You can reopen it until {formatCalendarDate(permissions.reopenUntil)}.</p>}

      <LandlordRequestButtons requestId={request.id} permissions={permissions} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <section className={cardClass}>
            <h2 className="mb-2 font-head text-lg font-bold text-heading">The problem</h2>
            <p className="whitespace-pre-wrap text-sm text-heading">{request.description}</p>
            {request.media.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {request.media.map((item) => (
                  <Media key={item.id} item={item} />
                ))}
              </div>
            )}
          </section>

          {(permissions.canAssignJob || permissions.canRequestQuotes) && !request.job && (
            <section className={`${cardClass} border-dashed`}>
              <h2 className="font-head text-lg font-bold text-heading">Contractor</h2>
              <p className="mt-1 text-sm text-muted">Assigning a contractor and asking for quotes comes in the next update.</p>
            </section>
          )}

          <section className={cardClass}>
            <h2 className="mb-2 font-head text-lg font-bold text-heading">Timeline</h2>
            <ul>
              {request.timeline.map((entry) => {
                const tag = VISIBILITY_TAG[entry.visibility];
                return (
                  <li key={`${entry.kind}-${entry.id}`} className="flex gap-4 border-t border-subtle py-2.5 text-sm first:border-t-0">
                    <span className="w-28 shrink-0 text-xs text-muted"><LocalMoment iso={entry.at} /></span>
                    {entry.kind === "comment" ? (
                      <div className="min-w-0 rounded-lg bg-bg px-3 py-2">
                        <p className="font-semibold text-heading">
                          {entry.isMe ? "You" : entry.actorName} {tag && <span className="ml-1 rounded bg-subtle px-1.5 text-[11px] font-normal text-body">{tag}</span>}
                        </p>
                        <p className="whitespace-pre-wrap text-body">{entry.body}</p>
                      </div>
                    ) : (
                      <span className="text-heading">
                        {entry.text} {tag && <span className="ml-1 rounded bg-subtle px-1.5 text-[11px] text-body">{tag}</span>}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
            {permissions.canComment && <LandlordCommentBox requestId={request.id} />}
          </section>
        </div>

        <div className="space-y-4">
          <section className={cardClass}>
            <h2 className="mb-3 font-head text-lg font-bold text-heading">Details</h2>
            <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-2 text-sm">
              <dt className={labelClass}>Property</dt>
              <dd className="font-semibold text-heading">{request.placeLabel}</dd>
              <dt className={labelClass}>Reported by</dt>
              <dd className="font-semibold text-heading">{request.reportedByRole === "Landlord" ? "You" : `${request.reportedByName} (tenant)`}</dd>
              <dt className={labelClass}>When</dt>
              <dd className="font-semibold text-heading">
                <LocalMoment iso={request.createdAt} />
                {request.seenByLandlordAt && <span className="font-normal text-muted"> · seen <LocalMoment iso={request.seenByLandlordAt} /></span>}
              </dd>
              <dt className={labelClass}>Category</dt>
              <dd className="font-semibold text-heading">{request.category}</dd>
              <dt className={labelClass}>Where</dt>
              <dd className="font-semibold text-heading">{place}</dd>
              <dt className={labelClass}>Urgency</dt>
              <dd className="font-semibold text-heading"><UrgencyPicker requestId={request.id} urgency={request.urgency} canChange={permissions.canSetUrgency} /></dd>
            </dl>
          </section>

          {request.access && (
            <section className={cardClass}>
              <h2 className="mb-2 font-head text-lg font-bold text-heading">Access details</h2>
              <p className="text-sm text-body">{accessSummary(request.access)}</p>
              {request.accessUpdatedByName && <p className="mt-2 text-xs text-muted">Last changed by {request.accessUpdatedByName}. The audit log keeps the values before and after.</p>}
            </section>
          )}

          <section className={cardClass}>
            <h2 className="mb-2 font-head text-lg font-bold text-heading">Tenants</h2>
            {request.tenants.length === 0 ? (
              <p className="text-sm text-muted">{request.tenancyId ? "No tenants on this lease." : "Not linked to a lease: tenants do not see this request."}</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {request.tenants.map((person) => (
                  <li key={person.name}>
                    <span className="font-semibold text-heading">{person.name}</span>{" "}
                    <span className="rounded-full bg-accent-tint px-2 py-0.5 text-xs font-semibold text-accent-dark">
                      {person.isReporter ? "Reported it" : "Co-tenant"}
                      {!person.isCurrent && " (moved out)"}
                    </span>
                    {person.phone && <span className="block text-xs text-muted">{person.phone}</span>}
                  </li>
                ))}
              </ul>
            )}
            {request.tenancyId && (
              <Link href={`/landlord/tenancies/${request.tenancyId}`} className="mt-3 inline-block text-xs font-semibold text-accent hover:underline">
                Open the lease
              </Link>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
