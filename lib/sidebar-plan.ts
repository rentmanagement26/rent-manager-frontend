// What the landlord sidebar needs to know about the plan: its name, whether it is paid, and the first usage figure (for example
// "Properties 2 of 5"). Any failure gives null, so the sidebar falls back to the "Upgrade" card and never blocks the page.
import { getMySubscription } from "@/lib/billing-api";

export interface SidebarPlan {
  name: string;
  paid: boolean;
  usage: { label: string; used: number; limit: number } | null;
}

export async function getSidebarPlan(token: string | undefined): Promise<SidebarPlan | null> {
  if (!token) return null;
  try {
    const subscription = await getMySubscription(token);
    if (!subscription.hasPlan || !subscription.packageName) return null;
    const first = subscription.limits[0];
    return {
      name: subscription.packageName,
      paid: (subscription.monthlyPrice ?? 0) > 0,
      usage: first ? { label: first.displayName, used: first.used, limit: first.limit } : null,
    };
  } catch {
    return null;
  }
}
