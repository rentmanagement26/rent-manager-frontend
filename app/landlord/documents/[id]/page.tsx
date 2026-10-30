// The landlord's page for one lease document: where it stands, who has signed, what to do next, downloads and the event trail.
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireBackendToken } from "@/lib/auth-guard";
import { SessionExpiredError } from "@/lib/api-error";
import { getDocument } from "@/lib/document-api";
import { getTenancy } from "@/lib/tenancy-api";
import { STATUS_LABELS } from "@/lib/document-format";
import { formatCalendarDate, formatRelativeTime } from "@/lib/format-time";
import { PageHeader } from "@/components/page-header";
import { DocumentControls } from "./document-controls";
import { DocumentTermsCard } from "@/components/document-terms-card";

const METHOD_WORDS: Record<string, string> = { Online: "Signed online", Paper: "Signed on paper" };

export default async function LandlordDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireBackendToken(["Admin", "Landlord"]);

  let doc;
  try {
    doc = await getDocument(session.backendToken, Number(id));
  } catch (err) {
    if (err instanceof SessionExpiredError) redirect("/session-expired");
    throw err;
  }
  if (!doc) notFound();
  // The lease's current terms, to show beside the document and to compare with the terms it was sent with. A failed lookup just hides them.
  const live = doc.tenancyId ? await getTenancy(session.backendToken, doc.tenancyId).catch(() => null) : null;

  const status = STATUS_LABELS[doc.status];
  const landlordSigned = doc.signers.some((s) => s.role === "Landlord" && s.status === "Signed");
  const needsLandlordSignature = doc.status === "AwaitingLandlord" && !landlordSigned;
  const fileHref = `/api/documents/${doc.id}/file`;
  const leaseHref = doc.tenancyId ? `/landlord/tenancies/${doc.tenancyId}` : "/landlord";

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader title={doc.title} description={`${doc.publicCode} · version ${doc.currentVersion} · ${doc.pageCount} pages`} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span>
        <div className="flex gap-2 text-sm font-semibold">
          <Link href={leaseHref} className="rounded-full border border-default bg-white px-4 py-2 text-heading hover:bg-subtle">Back to the lease</Link>
          <a href={fileHref} target="_blank" rel="noreferrer" className="rounded-full border border-default bg-white px-4 py-2 text-heading hover:bg-subtle">Open the PDF</a>
        </div>
      </div>

      {doc.expiresAt && doc.status === "AwaitingTenants" && (
        <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-700">Tenants have until {formatCalendarDate(doc.expiresAt)} to sign.</p>
      )}
      {doc.status === "Expired" && <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">This lease ran out. Give more time to open it again.</p>}

      {needsLandlordSignature && (
        <section className="rounded-2xl border border-default bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-heading">Sign the lease</h2>
          <p className="mt-1 text-sm text-muted">You sign first. Then you can send it to your tenants.</p>
          <Link href={`/landlord/documents/${doc.id}/sign`} className="mt-3 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark">
            Read and sign
          </Link>
        </section>
      )}

      <DocumentControls doc={doc} />

      <DocumentTermsCard doc={doc} live={live} />

      <section className="rounded-2xl border border-default bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-heading">Who has signed</h2>
        <ul className="divide-y divide-default text-sm">
          {doc.signers.map((signer) => (
            <li key={signer.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <span>
                <span className="font-medium text-heading">{signer.displayName}</span>
                <span className="ml-2 text-xs text-muted">{signer.role === "Landlord" ? "Landlord" : "Tenant"}{signer.email ? ` · ${signer.email}` : ""}</span>
                {signer.declineNote && <span className="ml-2 text-xs text-red-700">&ldquo;{signer.declineNote}&rdquo;</span>}
              </span>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${signer.status === "Signed" ? "bg-green-50 text-green-700" : signer.status === "Declined" ? "bg-red-50 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                {signer.status === "Signed" ? `${METHOD_WORDS[signer.method ?? ""] ?? "Signed"}${signer.signedAt ? ` · ${formatCalendarDate(signer.signedAt)}` : ""}` : signer.status === "Declined" ? "Declined" : "Not yet"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-default bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-heading">Downloads</h2>
        <ul className="space-y-2 text-sm">
          <li><a className="text-accent hover:text-accent-dark" href={`${fileHref}?download=1`}>The lease (original PDF)</a></li>
          {doc.printCopyReady && <li><a className="text-accent hover:text-accent-dark" href={`${fileHref}?kind=PrintCopy&download=1`}>Print copy with page stamps (for signing on paper)</a></li>}
          {doc.finalCopyReady && <li><a className="font-semibold text-accent hover:text-accent-dark" href={`${fileHref}?kind=FinalCopy&download=1`}>Final signed PDF with the signing record</a></li>}
        </ul>
      </section>

      {doc.events && doc.events.length > 0 && (
        <section className="rounded-2xl border border-default bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-heading">History</h2>
          <ul className="divide-y divide-default text-sm">
            {doc.events.slice().reverse().slice(0, 30).map((event) => (
              <li key={event.id} className="flex justify-between gap-3 py-2">
                <span className="text-heading">{event.type.replace(/([a-z])([A-Z])/g, "$1 $2")}{event.actorName ? ` · ${event.actorName}` : ""}{event.detail ? ` · ${event.detail}` : ""}</span>
                <span className="shrink-0 text-xs text-muted">{formatRelativeTime(event.at)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
