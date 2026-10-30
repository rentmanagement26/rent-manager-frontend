// The landlord signs their own lease first: the shared signing flow (read, agree, sign, confirm).
import { notFound, redirect } from "next/navigation";
import { requireBackendToken } from "@/lib/auth-guard";
import { SessionExpiredError } from "@/lib/api-error";
import { getDocument, getSigningStatus } from "@/lib/document-api";
import { PageHeader } from "@/components/page-header";
import { SigningFlow } from "@/components/signing-flow";

export default async function LandlordSignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireBackendToken(["Admin", "Landlord"]);

  let doc;
  let status;
  try {
    [doc, status] = await Promise.all([getDocument(session.backendToken, Number(id)), getSigningStatus(session.backendToken, Number(id))]);
  } catch (err) {
    if (err instanceof SessionExpiredError) redirect("/session-expired");
    throw err;
  }
  if (!doc || !status) notFound();
  // Already signed, or not the landlord's turn: back to the document page.
  if (!status.myTurn) redirect(`/landlord/documents/${doc.id}`);

  return (
    <div className="max-w-5xl">
      <PageHeader title="Sign your lease" description={doc.title} />
      <SigningFlow document={doc} status={status} role="landlord" doneHref={`/landlord/documents/${doc.id}`} />
    </div>
  );
}
