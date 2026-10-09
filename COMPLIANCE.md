# Compliance Checklist

Tracks which features have had a compliance pass against the rules `AGENTS.md` requires for every
feature touching leases, deposits, rent increases, late fees, notices, tenant screening, privacy,
or payments:

- **Federal**: PIPEDA (privacy/data minimization), CASL (anti-spam for automated emails/SMS)
- **Ontario**: Residential Tenancies Act, 2006 (RTA) / Landlord and Tenant Board (LTB) — e.g.
  damage deposits are illegal (only last month's rent deposit is allowed), the Ontario Standard
  Lease is mandatory, 24-hour written entry notice, rent increase guideline + notice rules
- **Manitoba**: The Residential Tenancies Act (C.C.S.M. c. R119) / Residential Tenancies Branch
  (RTB) — e.g. security deposit capped at 0.5 month's rent, pet deposit max 1 month, 3 months
  notice for rent increases

**This is not legal advice and this file is not a substitute for an actual lawyer.** Entries below
reflect the informal review an AI coding session can reasonably do (checking the feature's actual
data flow/behavior against the rules above) — not a lawyer's sign-off. Get real legal review before
any feature here handles real tenant data or real money, not just test data.

Format: one entry per feature area. Update whenever a feature listed here changes, or a new one is
built — same trigger as `AGENTS.md`'s standing compliance-review rule.

## Built and reviewed

- **Login / Register / Session** — collects email, full name, password only; no extra fields, no
  SIN. Session is a stateless signed JWT (`lib/session.ts`), no server-side data store beyond the
  cookie itself.
- **Forgot-password / Reset-password** (2026-08-27) — PIPEDA: only `email`/`newPassword` collected,
  no extra fields. Backend confirmed (via curl test) to return an identical generic response
  regardless of whether the account exists — account-enumeration protection already handled
  server-side, frontend never branches on "account not found." CASL: reset email is transactional
  only (just the link), exempt from consent/unsubscribe requirements. Full detail in `PROGRESS.md`,
  2026-08-27 entry.
- **Mandatory two-factor login (TOTP)** (2026-10-09) — PIPEDA safeguards principle: strengthens
  account security, adds no personal data on the frontend (the TOTP shared secret is stored by the
  backend; the browser only holds it in page memory during setup, never in a URL/localStorage/log).
  The temporary 2FA token lives in a short-lived httpOnly, SameSite=Strict cookie; recovery codes
  are shown once. CASL: no messages sent. No RTA/RTB angle. Session cookie now also gets the
  `secure` flag in production. Security settings (regenerate recovery codes / replace authenticator,
  same day) re-authenticate with password + a code, collect no new personal data, and warn that a
  replacement signs out other devices (the backend sends its own transactional security notice).
- **Tenant portal** (2026-10-09) — PIPEDA: a tenant sees only their own tenancies (address, unit specs, dates)
  and their landlord's name, business name, and email, which the tenant already received through the
  landlord's invite; nothing new is collected. **RTA/RTB: rent is intentionally not displayed** — the backend
  only has the unit's asking rent, not the agreed rent, and presenting it would misstate the tenant's rent and
  could appear to be an increase without the required notice (Ontario: 90 days, Form N1; Manitoba: 3 months).
  Revisit when tenancies/leases store the real rent. Mobile still shows the asking rent (open item).
- **Notifications / Profile page** (2026-10-09) — PIPEDA: only re-displays the signed-in user's own
  notifications, name, email, and role (all already held); no new collection, no tracking. CASL: the bell
  is in-app only (no messages sent); "Send reset link" triggers the existing transactional password-reset
  email to the user's own address, on their own request. No RTA/RTB angle.
- **Tenant invite list / resend** (2026-09-22) — only re-displays the invited tenant's email,
  unit, and status back to the landlord who entered it (no new collection). Resend re-sends the
  same transactional invite (CASL transactional/existing-relationship, no marketing content).
- **Properties / Units** — no tenant PII involved (address/property-type/unit specs are the
  landlord's own data about their own property). No RTA/RTB angle yet since no lease or tenancy
  terms exist on a property/unit record.
- **Marketing site copy** (2026-08-25) — removed overclaimed legal/compliance claims (Ontario
  Standard Lease generation, Manitoba RTB deposit-cap *enforcement*, PIPEDA-compliant no-SIN
  screening, etc.) that nothing in the app actually implements — false-advertising risk, not a
  style nit. Also removed a real personal street address from a landing-page mockup at the user's
  request — standing rule, not a one-time cleanup.

## Not yet built — review needed when built

- **Tenants** — backend already has `POST /api/auth/tenant-invites` and `POST
  /api/auth/register/tenant` (confirmed via Swagger, 2026-08-28), unused in the frontend. When
  wired up: PIPEDA data-minimization review for whatever fields the invite/registration flow
  actually collects; if tenant screening or SIN collection is ever considered, the marketing copy
  already commits to "no-SIN screening" — a real product decision, not just copy, if built.
- **Leases** — Ontario legally mandates the actual Standard Lease form; Manitoba has its own
  required lease terms. Must not invent a custom lease format for either province.
- **Deposits** — Ontario: only a last-month's-rent deposit is legal, damage deposits are
  prohibited. Manitoba: security deposit capped at 0.5 month's rent, pet deposit capped at 1
  month's rent.
- **Rent increases** — Ontario: guideline increase amount + notice rules (LTB-published guideline).
  Manitoba: 3 months' written notice required.
- **Entry notices** — Ontario: 24-hour written notice required before landlord entry.
- **Eviction notices** — LTB (Ontario) / RTB (Manitoba) each have specific mandatory forms and
  procedures — must use the real ones, not an app-invented notice.
- **Payments (Interac e-Transfer / PAD)** — not started, flagged as a future differentiator
  (2026-08-29 discussion). PAD specifically has Payments Canada rules around tenant consent and
  cancellation rights, separate from PIPEDA. Real money movement likely means using a licensed
  Canadian payment processor as an intermediary rather than building bank connectivity directly.
- **AI features** (if/when built) — any tenant PII sent to a third-party LLM API is data leaving
  the system to a third party — a PIPEDA data-minimization/safeguarding question to work through
  before sending real tenant data to any AI provider.
