// Tenant: read and sign a lease. The shared signing flow with the in-page document viewer.
import { notFound, redirect } from "next/navigation";
import { TenantPageHeading } from "@/components/tenant-page-heading";
import { SigningFlow } from "@/components/signing-flow";
import { SessionExpiredError } from "@/lib/api-error";
import { requireBackendToken } from "@/lib/auth-guard";
import { getDocument, getSigningStatus } from "@/lib/document-api";

export default async function TenantSignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireBackendToken(["Tenant"]);

  let doc;
  let status;
  try {
    [doc, status] = await Promise.all([getDocument(session.backendToken, Number(id)), getSigningStatus(session.backendToken, Number(id))]);
  } catch (err) {
    if (err instanceof SessionExpiredError) redirect("/session-expired");
    throw err;
  }
  if (!doc || !status) notFound();
  // Nothing to sign now (already signed, expired, withdrawn): back to the document page.
  if (!status.myTurn) redirect(`/tenant/documents/${doc.id}`);

  return (
    <div>
      <TenantPageHeading title="Sign your lease" description={doc.title} />
      <SigningFlow document={doc} status={status} role="tenant" doneHref={`/tenant/documents/${doc.id}`} />
    </div>
  );
}
