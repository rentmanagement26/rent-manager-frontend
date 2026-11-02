// What the landlord header needs to know about the plan: its name and whether it is paid (the badge reads Pro, Max or Free). Any failure
// gives null, so the header falls back to the plain role label and never blocks the page.
import { getMySubscription } from "@/lib/billing-api";

export interface HeaderPlan {
  name: string;
  paid: boolean;
}

export async function getHeaderPlan(token: string | undefined): Promise<HeaderPlan | null> {
  if (!token) return null;
  try {
    const subscription = await getMySubscription(token);
    if (!subscription.hasPlan || !subscription.packageName) return null;
    return { name: subscription.packageName, paid: (subscription.monthlyPrice ?? 0) > 0 };
  } catch {
    return null;
  }
}
