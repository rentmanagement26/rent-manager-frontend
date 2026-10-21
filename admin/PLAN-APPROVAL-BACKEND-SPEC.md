# Backend spec: the customer approves every plan change (for the backend owner)

Rule from the product owner: **no plan change happens until the customer approves it through a link in an email, and the
admin console must show the answer as soon as it comes.** Staff can propose; staff cannot approve for the customer.

The admin console already works on what exists today (proposals, polling). This file lists what is missing, written to fit the
current code (`Subscriptions` module, `RespondToProposalCommand`, `PlanChangeNoticeHandler`, `Scheduling` jobs, SharedKernel events).

## 1. Put an approve link in the proposal email

Today `PlanChangeNoticeHandler` (Users) emails the text of the notice but has **no link**; the landlord must find the proposal in the app.

- Add the landlord site address to configuration (for example `Web:BaseUrl`, set per environment like the other URLs).
- In the proposal email only, add a button to `{Web:BaseUrl}/login?redirect=%2Flandlord%2Fplan-proposals%2F{changeId}`. The sign-in page sends a signed-in
  landlord straight on and a signed-out one through sign-in and 2FA to the page (the landlord layout alone would drop the destination).
- **One path for everything**: the email link, the dashboard banner and the bell notification all open the same page, `/landlord/plan-proposals/{changeId}`,
  which answers through the same endpoints (`POST /subscription/proposals/{id}/accept|decline`). Do not add a separate email-only approve endpoint or a
  one-click token route: two ways to approve would mean two sets of rules, checks and audit entries to keep equal.
- **Do not put a token in the link.** The page requires the landlord to sign in (2FA is already mandatory), and the existing
  `POST /subscription/proposals/{id}/accept|decline` endpoints do the approving as the signed-in landlord. A sign-in-required link
  cannot be forwarded and used by someone else, and needs no new token table.
- The email shows only the plan name, price and the staff message (PIPEDA: no other account data). It is a transactional message about
  the recipient's own account (CASL: fine), so no marketing text or unsubscribe is needed.
- The frontend side (`/landlord/plan-proposals/{id}`, using `GET /subscription/changes` and the accept/decline endpoints) is built in
  the web repo; the email only has to carry the link.

## 2. Close the staff-typed "agreement" path

`PUT /admin/landlords/{id}/subscription` accepts `Agreement { method, reference }` typed by staff ("phone", "ticket 4821"). That is staff
saying the customer agreed, with no proof, which breaks the rule above. The admin console no longer calls it.

- Remove `Agreement` and the endpoint's use for ordinary staff, or require a SuperAdmin-only permission (reuse `subscriptions.override`).
- If it stays as an emergency tool for SuperAdmin: mark the history row `AppliedByAdminWithoutApproval`, write an audit entry, and
  tell the landlord (the notification already exists).

## 3. Record who approved and when

- `RespondToProposalCommand` already links the history row with `FulfillsChangeId`. Also store `ApprovedByUserId`, `ApprovedAt` and the
  client IP on the history row (or the scheduled change), so the history reads "approved by the landlord on <date>".
- Write audit events `subscription.proposal.accepted`, `.declined`, `.withdrawn`, `.expired` (the audit infrastructure exists but almost
  nothing writes to it yet; keep the entries free of tokens and personal data beyond ids).
- Add an expiry (for example 14 days). The `Scheduling` module already runs jobs: add one that marks an unanswered proposal `Skipped`
  with reason `expired`, and tell staff.

## 4. Tell the admin console when the customer answers

The console polls every 10 seconds today. To make this immediate and reliable, in this order (each step is useful alone):

1. **Admin notifications table** (fits the existing landlord notification code): publish a SharedKernel event
   `PlanProposalAnswered(ChangeId, LandlordProfileId, Outcome, ProposedByUserId)` from `RespondToProposalCommand` (same pattern as
   `LandlordRegistered`). A handler in Users writes a row for the staff member who proposed it ("Acme Rentals approved Pro").
   Expose `GET /admin/notifications`, `GET /admin/notifications/unread-count`, `POST /admin/notifications/{id}/read` — a copy of the
   landlord endpoints, gated by `landlords.view`. The console shows a bell and can poll the cheap unread-count call.
2. **Richer list data**: add `TargetPackageName` and `ProposedBy` to the `proposal` object of `GET /admin/subscriptions`, and let
   `status=answered` (last 7 days) return `{ status: Accepted | Declined | Skipped, resolvedAt }`. Then the console can say
   "approved" or "declined" without guessing from the plan name.
3. **Live push (optional, after 1 and 2)**: a Server-Sent Events endpoint `GET /admin/events`. Do **not** keep the subscribers in memory
   only: with more than one server instance the answer arrives at a different instance than the admin's connection. Use the
   notifications table (step 1) as the source and notify the other instances through Postgres `LISTEN/NOTIFY` (Neon supports it), or poll
   the table every second on the server. Authentication: the console's session is an httpOnly cookie on Vercel, so the console should
   proxy the stream through a Route Handler rather than letting the browser call the API directly.

## 5. Tests worth having (same style as the existing 297 checks)

- Accept: plan changes, history shows the landlord as approver, staff notification row created, audit entry written.
- Decline and expiry: no change, staff notified.
- A staff user (even SuperAdmin) cannot accept on a landlord's behalf: `accept` only works for the proposal's own landlord.
- The email contains the link and no token, and a failed email does not stop the in-app notice (already true).
