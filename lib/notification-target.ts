// Where clicking a notification should take the user, for notification types that point at a page.
import type { NotificationItem } from "@/lib/types";

// The backend's type for "support proposed a plan change" (PlanChangeNotices.ProposalType).
const PLAN_PROPOSAL_TYPE = "PlanProposal";
// ...and for "your plan is being updated" (PlanChangeNotices.NoticeType).
const PLAN_NOTICE_TYPE = "PlanChangeNotice";

// The backend's types for "a new maintenance request" (to the landlord) and "a request changed" (to the tenant or landlord).
const MAINTENANCE_REQUEST_TYPE = "MaintenanceRequestCreated";
const MAINTENANCE_UPDATED_TYPE = "MaintenanceUpdated";

// Returns the page a notification opens, or null when it is just a message. A plan proposal carries its id in `data`
// ({ "proposalId": 12, ... }) so it opens that proposal; older ones without it open the list.
export function notificationHref(item: NotificationItem): string | null {
  // A lease document notification carries { "documentId": 3 }. /documents/3 sends a landlord or a tenant to their own page for it.
  try {
    const documentId = Number(JSON.parse(item.data ?? "{}").documentId);
    if (Number.isInteger(documentId) && documentId > 0) return `/documents/${documentId}`;
  } catch {
    // `data` was not JSON: this is not a document notification.
  }

  // A maintenance notification carries { "requestId": 12 } (and a jobId or quoteId for contractors). /maintenance/12 sends a tenant or a
  // landlord to their own page for the request.
  if (item.type === MAINTENANCE_REQUEST_TYPE || item.type === MAINTENANCE_UPDATED_TYPE) {
    try {
      const requestId = Number(JSON.parse(item.data ?? "{}").requestId);
      if (Number.isInteger(requestId) && requestId > 0) return `/maintenance/${requestId}`;
    } catch {
      // `data` was not JSON: this is just a message.
    }
  }

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
