// Entry point for the link in lease emails and notifications (the backend sends {site}/documents/{id}).
// It has no screen of its own: it sends the person to their own page for that lease, or to sign in first and then back here.
import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";

export default async function DocumentLinkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Only whole numbers are real document ids; anything else goes to the person's home page.
  const documentId = /^\d+$/.test(id) ? id : null;

  const session = await getSession();
  if (!session) {
    redirect(documentId ? `/login?redirect=${encodeURIComponent(`/documents/${documentId}`)}` : "/login");
  }

  if (!documentId) redirect(session.role === "Tenant" ? "/tenant" : "/landlord");
  redirect(session.role === "Tenant" ? `/tenant/documents/${documentId}` : `/landlord/documents/${documentId}`);
}
