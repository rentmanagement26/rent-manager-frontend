// "Lease terms" on the landlord's document page. Before the lease is sent it shows the lease's current terms (they are saved with the document
// when it is sent). After it is sent it shows the terms it was sent with, and says so when the lease's terms were changed since.
import Link from "next/link";
import { LeaseTerms } from "@/components/lease-terms";
import { formatCalendarDate } from "@/lib/format-time";
import { diffTerms, parseSnapshot, snapshotAsDetails } from "@/lib/lease-snapshot";
import type { LeaseDocument } from "@/lib/document-types";
import type { TenancyDetails } from "@/lib/tenancy-types";

export function DocumentTermsCard({ doc, live }: { doc: LeaseDocument; live: TenancyDetails | null }) {
  const snapshot = parseSnapshot(doc.termsSnapshot);
  // Nothing to show if the lease could not be loaded and no snapshot was saved.
  if (!snapshot && !live) return null;

  const sent = Boolean(snapshot);
  const shown = snapshot && live ? snapshotAsDetails(snapshot, live) : (live as TenancyDetails);
  const changes = snapshot && live ? diffTerms(snapshot, live) : [];
  const canChange = !sent && live?.status === "Active";

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-heading">Lease terms</h2>
          <p className="text-xs text-muted">
            {sent
              ? `The terms this lease was sent with${snapshot?.takenAt ? ` on ${formatCalendarDate(snapshot.takenAt)}` : ""}.`
              : "The current terms. They are saved with the lease when you send it, so check them against the PDF."}
          </p>
        </div>
        {canChange && live && (
          <Link href={`/landlord/tenancies/${live.id}/edit`} className="rounded-full border border-default bg-white px-4 py-2 text-sm font-semibold text-heading hover:bg-subtle">
            Change terms
          </Link>
        )}
      </div>

      {changes.length > 0 && (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="font-semibold">The terms were changed after this lease was sent.</p>
          <p className="mt-1">The signed lease still has the old terms. If the agreement really changed, withdraw this lease and send a new one.</p>
          <ul className="mt-2 list-disc space-y-0.5 pl-5">
            {changes.map((change) => (
              <li key={change}>{change}</li>
            ))}
          </ul>
        </div>
      )}

      <LeaseTerms details={shown} />
    </section>
  );
}
