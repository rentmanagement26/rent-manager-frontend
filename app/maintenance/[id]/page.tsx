// Entry point for the link in maintenance emails and notifications (the backend sends {site}/maintenance/{requestId}).
// It has no screen of its own: it sends the person to their own page for that request, or to sign in first and then back here.
import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";

export default async function MaintenanceLinkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Only whole numbers are real request ids; anything else goes to the person's home page.
  const requestId = /^\d+$/.test(id) ? id : null;

  const session = await getSession();
  if (!session) {
    redirect(requestId ? `/login?redirect=${encodeURIComponent(`/maintenance/${requestId}`)}` : "/login");
  }

  if (!requestId) redirect(session.role === "Tenant" ? "/tenant" : "/landlord");
  redirect(session.role === "Tenant" ? `/tenant/requests/${requestId}` : `/landlord/maintenance/${requestId}`);
}
