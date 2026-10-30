// Tenant: the leases and documents the landlord has sent to them.
import Link from "next/link";
import { redirect } from "next/navigation";
import { TenantPageHeading } from "@/components/tenant-page-heading";
import { SessionExpiredError } from "@/lib/api-error";
import { requireBackendToken } from "@/lib/auth-guard";
import { listDocuments } from "@/lib/document-api";
import { STATUS_LABELS } from "@/lib/document-format";
import { formatCalendarDate } from "@/lib/format-time";

export default async function TenantDocumentsPage() {
  const session = await requireBackendToken(["Tenant"]);

  let documents;
  try {
    documents = await listDocuments(session.backendToken);
  } catch (err) {
    if (err instanceof SessionExpiredError) redirect("/session-expired");
    documents = null;
  }

  return (
    <div>
      <TenantPageHeading title="Documents" description="Leases your landlord has sent you to read and sign." />
      {documents === null ? (
        <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">Couldn&apos;t load your documents. Refresh to try again.</p>
      ) : documents.length === 0 ? (
        <div className="max-w-2xl rounded-2xl border border-default bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-heading">No documents yet</p>
          <p className="mt-1 text-sm text-muted">When your landlord sends you a lease to sign, it shows up here.</p>
        </div>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {documents.map((document) => {
            const waiting = document.status === "AwaitingTenants" && document.yourStatus === "Pending";
            return (
              <li key={document.id}>
                <Link href={`/tenant/documents/${document.id}`} className="block rounded-2xl border border-default bg-white p-5 shadow-sm hover:border-accent">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-heading">{document.title}</p>
                      <p className="text-xs text-muted">
                        {document.publicCode}{document.sentAt ? ` · sent ${formatCalendarDate(document.sentAt)}` : ""}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${waiting ? "bg-accent-tint text-accent-dark" : STATUS_LABELS[document.status].className}`}>
                      {waiting ? "Needs your signature" : document.yourStatus === "Signed" && document.status === "AwaitingTenants" ? "You signed" : STATUS_LABELS[document.status].label}
                    </span>
                  </div>
                  {document.expiresAt && waiting && <p className="mt-2 text-xs text-muted">Sign by {formatCalendarDate(document.expiresAt)}</p>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
