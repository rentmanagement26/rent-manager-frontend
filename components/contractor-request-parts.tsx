// Small cards shared by the contractor's job page and quote page (in the app and on the email link): the problem with its photos, how to get in,
// where it is and who to ask, and the timeline. A finished job or closed quote has none of the address, photos or access details: the
// backend leaves them empty, and these cards then simply do not appear.
import { LocalMoment } from "@/components/local-moment";
import type { LandlordContact, ProblemMedia } from "@/lib/contractor-portal-types";
import { accessSummary } from "@/lib/maintenance-format";
import type { AccessDetails, TimelineEntry } from "@/lib/maintenance-types";

const cardClass = "rounded-2xl border border-default bg-white p-5 shadow-sm";

export function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={cardClass}>
      <h2 className="mb-2 font-head text-lg font-bold text-heading">{title}</h2>
      {children}
    </section>
  );
}

// The problem as the tenant described it, with the tenant's photos and video.
export function ProblemCard({ description, media }: { description: string | null; media: ProblemMedia[] }) {
  if (!description && media.length === 0) return null;
  return (
    <Card title="The problem">
      {description && <p className="whitespace-pre-wrap text-sm text-heading">{description}</p>}
      {media.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {media.map((item) =>
            item.kind === "Video" ? (
              <video key={item.id} src={item.url} controls preload="metadata" className="h-24 w-32 rounded-lg bg-black object-cover" aria-label={item.fileName} />
            ) : (
              <a key={item.id} href={item.url} target="_blank" rel="noreferrer" title={item.fileName}>
                {/* A short-lived signed storage link, so next/image cannot optimise it. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt={item.fileName} className="h-24 w-32 rounded-lg object-cover" />
              </a>
            ),
          )}
        </div>
      )}
    </Card>
  );
}

// Permission to enter, best times and so on. The tenant's phone is never part of it.
export function AccessCard({ access }: { access: AccessDetails | null }) {
  if (!access) return null;
  return (
    <Card title="Getting in">
      <p className="text-sm text-body">{accessSummary(access)}</p>
      {/* The landlord must still give the written notice the law requires before entering, whatever the tenant prefers (ON and MB: 24 hours). */}
      <p className="mt-2 text-xs text-muted">The tenant&apos;s preference. Agree the visit with the landlord, who gives the tenant the notice the law requires.</p>
    </Card>
  );
}

// The address, and who lives there as far as the landlord let the contractor know.
export function WhereCard({
  address,
  placeLabel,
  tenantLabel,
  tenantContact,
}: {
  address: string | null;
  placeLabel: string;
  tenantLabel: string | null;
  tenantContact?: { name: string; phone: string | null } | null;
}) {
  return (
    <Card title="Where">
      {address ? <p className="text-sm font-semibold text-heading">{address}</p> : <p className="text-sm font-semibold text-heading">{placeLabel}</p>}
      {address && <p className="text-sm text-body">{placeLabel}</p>}
      {tenantContact ? (
        <p className="mt-2 text-sm text-body">
          Tenant: <span className="font-semibold text-heading">{tenantContact.name}</span>
          {tenantContact.phone && <> · {tenantContact.phone}</>}
        </p>
      ) : (
        tenantLabel && <p className="mt-1 text-xs text-muted">{tenantLabel} (name and phone not shared)</p>
      )}
    </Card>
  );
}

// What the landlord wrote for the contractor, and who to ask.
export function LandlordCard({ text, contact }: { text: string | null; contact: LandlordContact | null }) {
  if (!text && !contact) return null;
  return (
    <Card title="From the landlord">
      {text && <p className="whitespace-pre-wrap text-sm text-heading">{text}</p>}
      {contact && (
        <p className="mt-1 text-xs text-muted">
          Questions: {contact.name}
          {contact.phone ? ` ${contact.phone}` : ""}
        </p>
      )}
    </Card>
  );
}

// This job's steps and the comments the landlord marked for the contractor. The server writes each sentence.
export function TimelineCard({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <Card title="Timeline">
      <ul>
        {entries.map((entry) => (
          <li key={`${entry.kind}-${entry.id}`} className="flex gap-4 border-t border-subtle py-2.5 text-sm first:border-t-0">
            <span className="w-28 shrink-0 text-xs text-muted"><LocalMoment iso={entry.at} /></span>
            {entry.kind === "comment" ? (
              <div className="min-w-0 rounded-lg bg-bg px-3 py-2">
                <p className="font-semibold text-heading">{entry.isMe ? "You" : entry.actorName}</p>
                <p className="whitespace-pre-wrap text-body">{entry.body}</p>
              </div>
            ) : (
              <span className="text-heading">{entry.text}</span>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
