// Tenant: one lease document. Shows where it stands, who has signed, a Read and sign button, and downloads.
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TenantPageHeading } from "@/components/tenant-page-heading";
import { SessionExpiredError } from "@/lib/api-error";
import { requireBackendToken } from "@/lib/auth-guard";
import { getDocument } from "@/lib/document-api";
import { STATUS_LABELS } from "@/lib/document-format";
import { formatCalendarDate } from "@/lib/format-time";

export default async function TenantDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireBackendToken(["Tenant"]);

  let doc;
  try {
    doc = await getDocument(session.backendToken, Number(id));
  } catch (err) {
    if (err instanceof SessionExpiredError) redirect("/session-expired");
    throw err;
  }
  if (!doc) notFound();

  const status = STATUS_LABELS[doc.status];
  const myTurn = doc.status === "AwaitingTenants" && doc.yourStatus === "Pending";
  const fileHref = `/api/documents/${doc.id}/file`;
  const myCopies = doc.copies;

  return (
    <div className="max-w-3xl">
      <TenantPageHeading title={doc.title} description={`${doc.publicCode} · ${doc.pageCount} pages`} />

      <div className="space-y-5">
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>{status.label}</span>

        {myTurn && (
          <section className="rounded-2xl border border-default bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-heading">Your landlord asked you to sign</h2>
            <p className="mt-1 text-sm text-muted">
              Read the whole lease, then sign online or on paper.{doc.expiresAt ? ` Please sign by ${formatCalendarDate(doc.expiresAt)}.` : ""}
            </p>
            <Link href={`/tenant/documents/${doc.id}/sign`} className="mt-3 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark">
              Read and sign
            </Link>
          </section>
        )}

        {doc.yourStatus === "Signed" && doc.status === "AwaitingTenants" && (
          <p className="rounded-lg bg-green-50 px-3 py-2.5 text-sm font-medium text-green-700">You have signed. Waiting for the others.</p>
        )}
        {doc.status === "Completed" && <p className="rounded-lg bg-green-50 px-3 py-2.5 text-sm font-medium text-green-700">Everyone has signed. Your copy is below.</p>}
        {doc.status === "Expired" && <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">This lease ran out. Ask your landlord for more time.</p>}

        {myCopies.some((copy) => copy.status === "Rejected") && (
          <section className="rounded-2xl border border-default bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-heading">Your landlord needs another scan</h2>
            <ul className="mt-2 space-y-1 text-sm text-body">
              {myCopies.filter((copy) => copy.status === "Rejected").map((copy) => (
                <li key={copy.id}>{copy.fileName}: {copy.rejectReason}</li>
              ))}
            </ul>
            {myTurn && <Link href={`/tenant/documents/${doc.id}/sign`} className="mt-3 inline-block text-sm font-semibold text-accent hover:text-accent-dark">Scan and upload it again</Link>}
          </section>
        )}

        <section className="rounded-2xl border border-default bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-heading">Who has signed</h2>
          <ul className="divide-y divide-default text-sm">
            {doc.signers.map((signer) => (
              <li key={signer.id} className="flex items-center justify-between py-2.5">
                <span className="font-medium text-heading">{signer.displayName}<span className="ml-2 text-xs font-normal text-muted">{signer.role}</span></span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${signer.status === "Signed" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                  {signer.status === "Signed" ? "Signed" : signer.status === "Declined" ? "Declined" : "Not yet"}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-default bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-heading">Downloads</h2>
          <ul className="space-y-2 text-sm">
            <li><a className="text-accent hover:text-accent-dark" href={`${fileHref}?download=1`}>The lease (PDF)</a></li>
            {doc.finalCopyReady && <li><a className="font-semibold text-accent hover:text-accent-dark" href={`${fileHref}?kind=FinalCopy&download=1`}>Final signed copy with the signing record</a></li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
