// Where clicking a notification should take the user, for notification types that point at a page.
import type { NotificationItem } from "@/lib/types";

// The backend's type for "support proposed a plan change" (PlanChangeNotices.ProposalType).
const PLAN_PROPOSAL_TYPE = "PlanProposal";

// Returns the page a notification opens, or null when it is just a message.
export function notificationHref(item: NotificationItem): string | null {
  return item.type === PLAN_PROPOSAL_TYPE ? "/landlord/plan-proposals" : null;
}
