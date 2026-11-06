// Tenant: one maintenance request — the problem, photos, how to get in, the visit a contractor planned, and the timeline. The server writes
// every timeline sentence (it already leaves out what a tenant must not see), so the page shows them as they are.
import { notFound, redirect } from "next/navigation";
import { LocalMoment } from "@/components/local-moment";
import { CommentBox, RequestButtons } from "@/components/maintenance-request-actions";
import { SessionExpiredError } from "@/lib/api-error";
import { requireBackendToken } from "@/lib/auth-guard";
import { formatCalendarDate } from "@/lib/format-time";
import { getMyRequest } from "@/lib/maintenance-api";
import { STATUS_PILL, accessSummary, visitLine } from "@/lib/maintenance-format";
import type { MediaItem, RequestDetail } from "@/lib/maintenance-types";

const cardClass = "rounded-2xl border border-default bg-white p-5 shadow-sm";

// One photo or video. The address stops working after about 10 minutes, which is fine because the page is loaded fresh each visit.
function Media({ item }: { item: MediaItem }) {
  if (item.kind === "Video") {
    return <video src={item.url} controls preload="metadata" className="h-24 w-32 rounded-lg bg-black object-cover" aria-label={item.fileName} />;
  }
  return (
    <a href={item.url} target="_blank" rel="noreferrer">
      {/* The address is a short-lived signed storage link, so next/image cannot optimise it. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.url} alt={item.fileName} className="h-24 w-32 rounded-lg object-cover" />
    </a>
  );
}

export default async function TenantRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  const session = await requireBackendToken(["Tenant"]);

  let request: RequestDetail | null;
  try {
    request = await getMyRequest(session.backendToken, Number(id));
  } catch (err) {
    if (err instanceof SessionExpiredError) redirect("/session-expired");
    return <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">Couldn&apos;t load this request. Refresh to try again.</p>;
  }
  if (!request) notFound();

  const pill = STATUS_PILL[request.status];
  const place = request.commonAreaLocation ? `${request.location} (${request.commonAreaLocation})` : request.location;

  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-head text-2xl font-bold text-heading">{request.number} · {request.title}</h1>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${pill.className}`}>{pill.label}</span>
          {request.urgency === "Emergency" && <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800">Emergency</span>}
        </div>
        {request.visit && <p className="mt-2 inline-block rounded-lg border border-default bg-white px-3 py-1.5 text-sm font-semibold text-heading">{visitLine(request.visit)}</p>}
        {request.visit && <p className="mt-1 text-xs text-muted">Your landlord is responsible for any notice the law requires before entering your home.</p>}
        {request.status === "Cancelled" && request.cancelReason && <p className="mt-2 text-sm text-body">Cancelled: {request.cancelReason}</p>}
        {request.permissions.canReopen && request.permissions.reopenUntil && (
          <p className="mt-2 text-sm text-body">Marked done. If it is still not fixed you can reopen it until {formatCalendarDate(request.permissions.reopenUntil)}.</p>
        )}
      </div>

      <section className={cardClass}>
        <h2 className="mb-2 font-head text-lg font-bold text-heading">The problem</h2>
        <p className="text-sm text-muted">
          {place} · reported <LocalMoment iso={request.createdAt} /> by {request.reportedByMe ? "you" : request.reportedByName}
          {request.seenByLandlordAt && " · seen by your landlord"}
        </p>
        <p className="mt-2 whitespace-pre-wrap text-sm text-heading">{request.description}</p>
        {request.media.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {request.media.map((item) => (
              <Media key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {request.access && (
        <section className={cardClass}>
          <h2 className="mb-2 font-head text-lg font-bold text-heading">Getting into your unit</h2>
          <p className="text-sm text-body">{accessSummary(request.access)}</p>
        </section>
      )}

      <section className={cardClass}>
        <h2 className="mb-2 font-head text-lg font-bold text-heading">What is happening</h2>
        <ul>
          {request.timeline.map((entry) => (
            <li key={`${entry.kind}-${entry.id}`} className="flex gap-4 border-t border-subtle py-2.5 text-sm first:border-t-0">
              <span className="w-28 shrink-0 text-xs text-muted"><LocalMoment iso={entry.at} /></span>
              {entry.kind === "comment" ? (
                <div className="min-w-0 rounded-lg bg-bg px-3 py-2">
                  <p className="font-semibold text-heading">{entry.isMe ? "You" : entry.actorName} <span className="font-normal text-muted">({entry.actorRole.toLowerCase()})</span></p>
                  <p className="whitespace-pre-wrap text-body">{entry.body}</p>
                </div>
              ) : (
                <span className="text-heading">{entry.text}</span>
              )}
            </li>
          ))}
        </ul>
        {request.permissions.canComment && <CommentBox requestId={request.id} />}
      </section>

      <RequestButtons requestId={request.id} permissions={request.permissions} />
    </div>
  );
}
