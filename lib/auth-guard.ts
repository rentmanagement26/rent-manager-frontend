import { redirect } from "next/navigation";
import { getSession } from "@/lib/get-session";
import { AppRole, SessionUser } from "@/lib/types";

// Returns the home URL for each role
export function getDefaultDashboard(role: AppRole): string {
  switch (role) {
    case "Admin":
      return "/admin";
    case "Landlord":
      return "/landlord";
    case "Tenant":
      return "/tenant";
    case "Contractor":
      return "/contractor";
    default:
      return "/login";
  }
}

// Guard helper to call in Layouts, Pages, or Server Actions
export async function requireAuth(allowedRoles?: AppRole[]): Promise<SessionUser> {
  const session = await getSession();
  // 1. Not logged in -> send to login
  if (!session) {
    redirect("/login");
  }
  // 2. Logged in, but wrong role -> send to their own portal
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    redirect(getDefaultDashboard(session.role));
  }
  return session;
}