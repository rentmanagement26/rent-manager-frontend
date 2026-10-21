// Where clicking a notification should take the user, for notification types that point at a page.
import type { NotificationItem } from "@/lib/types";

// The backend's type for "support proposed a plan change" (PlanChangeNotices.ProposalType).
const PLAN_PROPOSAL_TYPE = "PlanProposal";
// ...and for "your plan is being updated" (PlanChangeNotices.NoticeType).
const PLAN_NOTICE_TYPE = "PlanChangeNotice";

// Returns the page a notification opens, or null when it is just a message. A plan proposal carries its id in `data`
// ({ "proposalId": 12, ... }) so it opens that proposal; older ones without it open the list.
export function notificationHref(item: NotificationItem): string | null {
  if (item.type === PLAN_NOTICE_TYPE) return "/landlord/plan-proposals";
  if (item.type !== PLAN_PROPOSAL_TYPE) return null;

  try {
    const proposalId = Number(JSON.parse(item.data ?? "{}").proposalId);
    if (Number.isInteger(proposalId) && proposalId > 0) return `/landlord/plan-proposals/${proposalId}`;
  } catch {
    // `data` was not JSON; fall through to the list.
  }
  return "/landlord/plan-proposals";
}
