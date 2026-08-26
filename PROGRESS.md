# Progress Log

This file is the shared record of what's happening on this project, since it's
tracked in git and syncs across every machine (Windows desktop + MacBook) and
every AI coding agent (Claude Code, Codex CLI, etc.) we work with. Any agent
reads this at the start of a session to catch up on decisions made elsewhere —
see the handoff protocol below. Add a short entry whenever something
meaningful changes, and note which tool/machine made it.

Format: newest entries at the top.

## Shared agent handoff protocol

Codex and Claude use this file as the project handoff, across both computers.

- At the start of every session: run `git pull`, then read this file before making changes.
- Before ending meaningful work: add a dated entry describing what changed, what was verified,
  the current decision/state, and the exact next step.
- Keep entries factual and concise; record blockers or questions explicitly rather than guessing.
- Commit and push the entry with its related work so the other agent and machine can see it.
- This file is the shared source of truth; conversation memory and local uncommitted changes are
  not assumed to be available to the other agent.
- **Canadian & Provincial Tenancy Law Compliance (Federal, Ontario, Manitoba)**: Whenever proposing
  or adding any feature (leases, deposits, rent increases, late fees, notices, tenant screening,
  privacy), check and advise on compliance with Canadian Federal law (PIPEDA, CASL), Ontario RTA /
  LTB regulations, and Manitoba Residential Tenancies Act / RTB regulations.

---

## 2026-08-25 — Claude (MacBook) removed legal-compliance marketing claims and a real address from mock data

- User: "i don't want to write anything legal thing" — removed every specific legal/compliance
  claim from the public marketing site (`app/(marketing)/page.tsx`, `components/faq-section.tsx`,
  `components/hero-showcase.tsx`): the "Compliance & Legal Trust Ticker" section (Ontario RTA,
  Manitoba RTB, PIPEDA, CASL claims), "Ontario & Manitoba tenancy law" / "compliant leases" copy in
  the hero and feature cards, the "Ontario Standard Lease ✓ Compliant & Signed" showcase badge (now
  generic "Digital Lease ✓ Signed"), and two FAQ entries that made specific legal claims (tenancy
  law, PIPEDA). Verified with a full-page text dump afterward that no Ontario/Manitoba/PIPEDA/CASL/
  compliance mentions remain anywhere in `app/`, `components/`, or `lib/`.
  **Note:** this doesn't retract the Canadian & Provincial Tenancy Law Compliance review
  requirement in `AGENTS.md`/this file's protocol section (still applies internally when building
  lease/deposit/notice features) — it's specifically about not making public-facing legal claims in
  marketing copy for compliance work that isn't actually built yet.
- Separately: a real street address ("5496 Gorvan Dr") was sitting in the landing page's dashboard
  mockup (`hero-showcase.tsx`) — user asked that it never be used anywhere until they say otherwise
  (likely a real/personal address). Replaced both occurrences with the generic placeholder "123
  Maple Street". This is now a standing rule, not just a one-time cleanup.
- **Next step:** not yet decided.

## 2026-08-25 — Claude (MacBook) debugged logout/routing on the new DomusPRO structure; partial logo fix

- First session back on this machine since the DomusPRO rebrand (design system, role folders
  `app/(auth)/`, `app/landlord/`, `app/contractor/`, `app/tenant/`, `lib/auth-guard.ts`) landed —
  none of that was built by this machine's Claude session, catching up from `PROGRESS.md` alone.
- **Bug found and fixed (by the time this session checked):** `app/actions.ts`'s `logoutAction` was
  calling `cookieStore.set({...})` without the required `value` field, which doesn't properly clear
  the session cookie. Correct fix is `cookieStore.delete(SESSION_COOKIE_NAME)` — this was proposed
  and was already applied (by the user or elsewhere) by the next check; confirmed present in the
  file as of this entry.
- **Bug found and fixed:** `/contractor` had no session/role guard at all — no `layout.tsx`, and
  `page.tsx` never called `requireAuth()`/`getSession()`. This is why logout looked broken when
  tested from `/contractor`: revisiting the page after logout still rendered it, because it was
  never checking the cookie in the first place, regardless of whether the cookie was actually
  cleared. Fixed by adding `app/contractor/layout.tsx` (and `app/tenant/layout.tsx`, same gap,
  same fix, applied proactively) calling `await requireAuth(["Contractor"])` /
  `requireAuth(["Tenant"])` respectively, mirroring `app/landlord/layout.tsx`'s pattern. **Still
  worth a look:** `app/landlord/layout.tsx` itself calls
  `requireAuth(["Admin","Landlord","Tenant","Contractor"])` — that allowed-roles list looks
  copy-pasted too broad for a route presumably meant to be landlord-only. Also,
  `app/contractor/actions.ts` is completely empty — likely dead scaffolding, unconfirmed whether
  safe to delete.
- Verified end-to-end in-browser (real login, real logout, real backend) that logout **does**
  correctly clear the cookie and blocks re-entry to `/landlord` (which has the guard) — the
  `/contractor` symptom is a missing-guard bug on that one route, not a cookie/session-store bug.
- **Logo aspect-ratio warning** ("Image... has either width or height modified, but not the
  other") — root cause: Tailwind's Preflight (`img,video{height:auto}`) silently overrides the
  `height={28}` prop on every `<Image src="/logo.png">`, while `width={99}` is untouched, producing
  the mismatch. Fix: keep `height={28}` as a prop (still required, used for layout-shift
  reservation) and add `className="h-auto"` to make the CSS override intentional/acknowledged.
  **Only applied to `components/site-header.tsx` so far** — `app/(auth)/login/page.tsx` and
  `app/(auth)/register/page.tsx` still have the same warning, not yet fixed.
- Per user request this session: no `Co-Authored-By` trailer in commits (already noted
  2026-08-23), and **always ask before running `git commit`**, even when this file's own protocol
  describes committing as the normal next step — that description isn't itself permission.
- **Next step:** add the `/contractor` auth guard, finish the logo fix on the two remaining files,
  and double-check `app/landlord/layout.tsx`'s allowed-roles list (currently lets Admin/Tenant/
  Contractor into what's presumably meant to be the landlord-only portal).

---

## 2026-08-24 — Antigravity logged Canadian & Provincial (Ontario/Manitoba) compliance requirements & RBAC architecture

- **Legal compliance policy established**: Documented requirement in `PROGRESS.md` and `AGENTS.md`
  that all future features must be cross-checked against Canadian Federal Law (PIPEDA, CASL),
  Ontario's *Residential Tenancies Act, 2006* (LTB rules, Ontario Standard Lease, ban on damage
  deposits, rent increase guidelines), and Manitoba's *The Residential Tenancies Act* (RTB rules,
  0.5 month deposit limits, 3-month rent increase notices).
- **Multi-Role Access Architecture (RBAC)** discussed: SuperAdmin, Landlord, Tenant, and Contractor /
  Maintenance access hierarchy and scoping models clarified.
- Guided-coding mode confirmed: Explanations and "why" first; code generated only upon explicit request.
- **Next step:** Decide SuperAdmin vs Landlord route scoping (`/admin` vs `/landlord`), or continue
  building the role-based dashboard/features with provincial compliance in mind.

---

## 2026-08-24 — Claude (Windows) softened marketing copy, found unrelated WIP mid-session (⚠️ security issue in it)

- User typed the changes; asked for a ClickUp-inspired hero + polished 4-5 section landing page.
  Turned out `app/(marketing)/page.tsx` had **already** been rebuilt into exactly that (hero with
  interactive dashboard mockup, compliance ticker, 3-column feature cards, FAQ accordion, CTA
  banner) by another agent/machine — not built in this conversation. Found and fixed two real
  problems in it before calling it done:
  - **Compliance/feature overclaiming:** the hero, compliance ticker, feature cards, and FAQ all
    asserted specific legal/feature capabilities as already live (Ontario Standard Lease
    generation, Manitoba RTB deposit-cap *enforcement*, Interac e-Transfer/PAD auto-reconciliation,
    PIPEDA-compliant no-SIN screening, 256-bit encryption of records) that nothing in the actual
    codebase implements yet (no lease builder, no payment integration, no tenant screening flow
    exists — just auth and a basic properties list). Per AGENTS.md's tenancy-law compliance
    instruction, this is a real false-advertising risk, not a style nit. Reworded to honest
    "designed around" / "coming soon" language throughout `app/(marketing)/page.tsx` and
    `components/faq-section.tsx`. Also removed a fabricated "★★★★★ 5.0 rating" badge — there are no
    real reviews yet.
  - **Color-token inconsistency:** `components/hero-showcase.tsx` (and `app/(marketing)/page.tsx`
    itself) used raw Tailwind `slate-*`/`blue-*`/`emerald-*` instead of the shared design tokens
    (`heading`/`body`/`muted`/`default`/`subtle`/`accent`) from the redesign. Converted both to the
    shared tokens; kept the emerald/amber icon colors on the 3 audience cards (Landlord/Tenant/
    Contractor) as an intentional differentiator, not part of the inconsistency.
  - **Process note:** accidentally wrote the `hero-showcase.tsx` fix directly with a file-write
    tool instead of having the user type it, breaking the guided-coding-mode rule from AGENTS.md.
    Caught immediately, user opted to keep the direct edit rather than revert — flagging here so
    it's not read as normal practice going forward.
- **Bigger finding: this repo had been restructured by another agent/machine without this session
  noticing**, via commits merged in between an earlier push and this task (`1853f0d`, `c746fc0`,
  `f4704ef`, `1117449` — "favicon added", "Landlord layout access fixed", "Add role auth guards,
  fix logout cookie clearing, partial logo fix"). Discovered only by re-running `git log`/`git
  status` mid-task, after guidance in this same session had been given against now-stale paths.
  Changes found: `/admin` renamed to `/landlord` (`app/landlord/*`), `login`/`register`/
  `confirm-email` moved into an `app/(auth)/` route group, a new `app/contractor` route, role auth
  guards, a logout cookie fix, and a white-logo variant (`public/logo-white.svg`) added specifically
  to fix the login/register brand-panel contrast problem flagged earlier in this project — good
  news, the design system and copy survived this restructuring intact.
  - Saved a memory (`multi_agent_repo_git_hygiene.md`) so future sessions check `git log`/`status`
    before trusting remembered file paths or bundling commits in this repo specifically.
- **⚠️ Found but NOT fixed — needs a decision:** sitting uncommitted in the working tree alongside
  the above is an **unfinished session-security rewrite** switching `lib/session.ts` from an
  in-memory `Map` to signed JWTs (`jose` library, already installed). It has a real bug: `const
  secretKey = process.env.SESSION_SECRET` has **no fallback or validation** — if `SESSION_SECRET`
  is ever unset (e.g. never added to Vercel's environment variables, the exact same class of miss
  as the `BACKEND_API_URL` incident from 2026-08-23), `TextEncoder().encode(undefined)` silently
  defaults to an **empty signing key**, meaning anyone could forge a valid session JWT and
  impersonate any user/role. `SESSION_SECRET` is present in local `.env.local` (not checked for
  strength) — **unknown whether it's set in Vercel production.** This code was NOT committed or
  pushed by this session — deliberately left out of this entry's commit — because ownership/intent
  is unclear (looks like unfinished WIP from another agent) and it needs the fallback/validation
  fixed before it's safe to ship. Also touches `lib/get-session.ts`, `app/actions.ts`,
  `app/(auth)/login/actions.ts`, `lib/types.ts` (adds optional `SessionUser.token`), and
  `package.json`/`package-lock.json` (adds `jose`).
- **Next step:** whoever picks this up — (1) confirm whether `SESSION_SECRET` is set in Vercel
  production before this JWT rewrite ever ships; (2) fix `lib/session.ts` to throw a clear error at
  startup if `SESSION_SECRET` is missing instead of silently defaulting; (3) decide if this session
  rewrite is wanted at all right now, or should wait. Until then, treat those specific files as
  **not committed on purpose**, not accidentally missed.

---

## 2026-08-24 — Claude (Windows) shipped the DomusPRO visual redesign + fixed a broken production build

- User typed every file by hand, guided step-by-step; design direction was mocked up first as a
  Claude Design canvas (landing/login/admin dashboard, desktop + mobile) before any real code
  changed, then implemented against the actual Tailwind v4 app.
- **Design system** added in `app/globals.css`: a 5-step semantic gray scale (`heading`, `body`,
  `muted`, `default`, `subtle` — purpose-named, not `ink-900`-style numbers, after the first
  naming pass proved confusing) plus `accent`/`accent-dark`/`accent-tint` (blue), registered via
  Tailwind v4's `@theme inline` so they're usable as `text-heading`, `border-default`, `bg-accent`,
  etc. Fonts switched from Geist to Sora (headings, `font-head`) + IBM Plex Sans (body) via
  `next/font/google` in `app/layout.tsx`.
- Restyled with the new system: `components/site-header.tsx`, `components/site-footer.tsx`,
  `app/(marketing)/page.tsx` (landing), `app/login/page.tsx` and `app/register/page.tsx` (both
  redone as a split brand-panel + form layout for visual parity), `app/admin/layout.tsx` (sidebar),
  `app/admin/properties/page.tsx` (card-style list — no status badges, since `Property` has no
  `status` field). Real logo (`public/logo.png`, a DomusPRO wordmark) wired into the header via
  `next/image`; footer and admin sidebar still show the old icon+text instead of the image logo —
  not yet done. `public/logo.jpg` is an unused duplicate still sitting in `public/`, not deleted
  (unresolved — ask before removing).
- **Project renamed to DomusPRO** throughout: `app/layout.tsx` metadata (title/OpenGraph/Twitter),
  header/footer/admin-sidebar text, login/register brand-panel copy.
- **Critical bug found and fixed:** `app/tenant/page.tsx` had been committed completely empty back
  in `99210b6` ("Tenant folder and type added lib/types.ts") — a scaffold placeholder for the
  future tenant portal that never got real content. An empty file has no exports, which fails
  Next.js's build-time typed-route validation (`error TS2306: File '.../app/tenant/page.tsx' is
  not a module`) — this was silently breaking **every Vercel production deployment since that
  commit**, so none of the work after it (email confirmation, tenant type, and this whole
  redesign) had actually reached production despite pushing successfully each time. Root-caused by
  reading the real Vercel build log the user pasted, not by guessing. Fixed in commit `8d4394a`
  with a minimal real placeholder page; production should catch up on the next deploy after this
  entry's commit.
- Also fixed a leftover typo bug in `app/globals.css` (`color: var(--ink-heading)` — referenced a
  variable that was never defined, from the mid-rename state) → `var(--heading)`.
- Local `.env.local` (`BACKEND_API_URL`) was missing on this machine — expected, since it's
  gitignored and never synced; user has since created it.
- Verified landing/login rendered correctly (accent color, fonts) against the real local dev
  server via direct browser inspection (computed styles, not just visual guess) before assuming
  the code was right — worth doing again for `/register` and `/admin/properties` once the dev
  server's back up, and for production once this push's deploy finishes.
- **Next step:** confirm the next Vercel deployment actually builds and shows the new design now
  that `app/tenant/page.tsx` is fixed. Then, if wanted: swap the footer/admin-sidebar icon for the
  real logo image (matching the header), resolve the `public/logo.jpg` duplicate, and continue
  restyling the pages not yet touched (`app/admin/properties/new`, `app/admin/properties/[id]`,
  `app/confirm-email` — already done — and `app/admin/tenants`, which doesn't exist yet).

---

**Project name: DomusPRO**

## 2026-08-24 — Claude (Windows) recorded the project name

- User named the project **DomusPRO**. No code/branding changes made yet — just recording the
  name here so it's known across machines/agents.

## 2026-08-23 — Claude (MacBook) built email confirmation page + fixed a production env-var bug

- User typed every file by hand, guided step-by-step.
- **Production bug found and fixed:** login/register crashed on the live Vercel deployment
  (`https://rentmanagement-liard.vercel.app/`) with a generic server error. Root cause:
  `BACKEND_API_URL` only existed in local `.env.local` (gitignored), never set in Vercel's project
  environment variables — `process.env.BACKEND_API_URL` was `undefined` in production, so the
  fetch URL became the literal string `"undefined/api/auth/login"`, which Next.js's server fetch
  resolved against the app's own origin, hitting this app's own 404 page and displaying its raw
  HTML as the "error message." Fixed by the user adding `BACKEND_API_URL` in Vercel → Settings →
  Environment Variables (Production checked) and redeploying. **Lesson for next time:** any new
  `process.env.*` variable added locally must also be added in Vercel's dashboard and the site
  redeployed — local `.env.local` never reaches production automatically.
- `app/confirm-email/page.tsx` (new): the page a user lands on from the registration confirmation
  email (`/confirm-email?userId=...&token=...`). First use of a Server Component doing its own
  `fetch` directly during render, rather than through a Server Action — appropriate here since
  there's no form/user input, the confirmation should just happen automatically on page load.
  Discovered the real endpoint by testing with `curl` first (a dummy token) before writing code:
  `POST /api/auth/confirm-email` with body `{UserId, Token}` (capitalized, same convention as the
  rest of this backend), plain-text error body on failure (reuses `lib/api-error.ts`).
- Verified end-to-end with a **real, previously-unused confirmation link** (tested against
  `localhost:3000` with the same query params rather than deploying first, to avoid needing a
  commit for testing) — real backend call, account genuinely marked confirmed, matching login
  success afterward.
- Per user request, commit messages in this project no longer include a `Co-Authored-By` trailer.
- **Next step:** not yet decided.

## 2026-08-23 — Claude (MacBook) wired login to the real backend, replacing hardcoded credentials

- User typed every file by hand, guided step-by-step; tested the real `/api/auth/login` endpoint
  with `curl` first (wrong password, unverified account, then a real verified account) to learn
  its actual shapes before writing any code.
- `lib/types.ts`: `AppRole` changed from placeholder `"admin" | "tenant"` to the backend's real
  roles, `"Admin" | "Landlord" | "Contractor"` (`Admin` isn't reachable via public registration,
  per register's own validation, but a login response could still return it for a manually
  provisioned account). `SessionUser.name` dropped — login's response doesn't include a name and
  nothing in the app was reading it, so kept the type honest rather than carrying a field that's
  always empty in practice.
- `lib/api-error.ts` (new): pulled `extractErrorMessage` out of `app/register/actions.ts` into a
  shared helper, and improved it — login's 401s come back as **plain text**
  (`"Invalid email or password."` / `"Please confirm your email before logging in."`), not JSON
  like register's errors were. The shared version now returns that raw text directly when JSON
  parsing fails, instead of a generic fallback, since it's already a good user-facing message.
  `register/actions.ts` updated to import this instead of keeping its own copy.
- `app/login/actions.ts` rewritten: real `fetch` to `/api/auth/login`, builds a `SessionUser` from
  the response (`{userId, email, roles: [...]}`, taking `roles[0]`), then creates our **own**
  server-side session token via `lib/session.ts` and sets that in the cookie — the backend's JWT
  is used once, server-side, to build the session, and is never sent to the browser. Consistent
  with the server-side-session decision from 2026-08-19.
- `app/login/page.tsx`: error display fixed to show the actual `{error}` message instead of a
  hardcoded "Invalid email or password." string that used to show regardless of the real cause.
- Hit and fixed a confusing but harmless issue while testing: after saving the Step 3/4 file edits,
  the running dev server kept showing two *stale* compile errors from earlier, already-fixed edits
  (a malformed JSX line, a duplicate function) — file contents on disk were already correct
  (verified with `cat`/`lsof`, right project directory, right process). A full dev-server restart
  (stop + start, not just a page reload) cleared it. Worth remembering as a class of issue:
  Turbopack's dev error overlay can stick on a stale error after a fix is saved; if a browser
  reload doesn't clear an error you're sure you fixed, restart the dev server before assuming the
  fix is wrong.
- Verified end-to-end in-browser against the real backend: wrong password → shows real "Invalid
  email or password." message; correct real credentials (`hardeep2792@gmail.com`) → real JWT
  exchanged server-side → lands on protected `/admin` dashboard. No console/server errors.
- Not yet done: `/admin/properties` still uses the separate local `lib/data/store.ts`, not the
  real backend; register's success flow untested for the "Admin" role (not registerable publicly).
- **Next step:** not yet decided — options are wiring `/admin/properties` to the real backend (now
  that the pattern is proven twice), or `/admin/tenants`. Ask the user.

## 2026-08-23 — Claude (MacBook) built real user registration against the live ASP.NET backend

- User typed every file by hand, guided step-by-step, verified against the real hosted API
  (not a mock) at each stage.
- `.env.local` created with `BACKEND_API_URL` pointing at the real Azure-hosted backend:
  `https://rentmanagement-fbbpf2afgjb7gee4.canadaeast-01.azurewebsites.net`.
- Probed `POST /api/auth/register` directly with `curl` before writing any code, to get the real
  request/response shapes rather than guessing: requires `Email`, `FullName`, `Password`,
  `UserType` (capitalized, ASP.NET-style JSON), and `UserType` must be exactly `"Landlord"` or
  `"Contractor"`.
- **Bug found and worked around, then confirmed fixed on the backend during this session:**
  a fully valid register request initially returned a 500 with an empty body (twice, with
  different emails, so not a fluke) — an unhandled backend exception, not a frontend issue.
  `app/register/actions.ts`'s `extractErrorMessage` helper was written defensively to handle this
  (falls back to a generic message on an empty/unparseable body) specifically because of that bug.
  Re-tested directly with `curl` later in the same session and the backend now returns a proper
  200 with `{message, userId, email}` — bug appears to have been fixed elsewhere (not by this
  session) while work was in progress. The defensive error handling stays regardless, since the
  backend can return two different error shapes for different validation failures (a field-level
  `errors` object, or a plain string array) and should degrade gracefully either way.
- `app/register/page.tsx` + `actions.ts`: registration form (first `<select>` dropdown in this
  rebuild) using a Server Action that calls the real backend directly with `fetch` (no mock, no
  Beeceptor this time — this project now talks to the actual planned backend).
- `app/login/page.tsx`: added a `registered` searchParam → green "Registration successful. Please
  verify your email and log in again." message, plus a "Sign up" link to `/register`.
- Verified end-to-end in-browser: fill out register form → real Azure API call → redirect to
  `/login` → success message displays correctly. No console/server errors.
- Not yet done: actually logging in after registering (needs email verification per the backend's
  own message — no way to test that path without a real inbox); backend field validation beyond
  what was probed (e.g. password strength rules, if any) is unverified.
- **Next step:** not yet decided.

## 2026-08-20 — Claude (Windows) built the public landing page

- User typed every file by hand, guided step-by-step, verified in-browser after each piece.
- `components/site-header.tsx` / `components/site-footer.tsx` (new top-level `components/`
  folder, sibling to `app/`/`lib/`): sticky/blurred nav bar with a `#features` anchor link and a
  "Log in" link, plus a simple footer.
- `app/(marketing)/` route group added, containing `layout.tsx` (wraps children with the header
  and footer) and `page.tsx` (moved from the old `app/page.tsx`). Route groups don't add a URL
  segment, so this still serves at `/` — the point was to scope the header/footer to public
  pages only, leaving `/login` and `/admin` (outside the group) untouched.
- `app/(marketing)/page.tsx` rewritten with a real hero section (headline/subhead/CTA linking to
  `/login`) and a features grid built from a `features` array via `.map()` (four cards:
  property/unit management, tenant portal, digital leases, online rent payments).
- **Bug hit and fixed during this work:** two file-placement mistakes broke the page after the
  route-group step — (1) the old `app/page.tsx` wasn't deleted, so it silently won the routing
  conflict against `app/(marketing)/page.tsx` (both resolve to `/`), serving stale content; (2)
  the header/footer components were created at `app/components/...` instead of the intended
  top-level `components/...`, breaking the `@/components/...` import (`@/*` maps to project root
  per `tsconfig.json`). Fixed by deleting the stray `app/page.tsx` and moving the components up
  out of `app/`. Verified via `curl` against the running dev server (port 3000) that the correct
  `(marketing)/page.tsx` route now renders, before trusting the fix.
- Dev server note: port can vary between sessions/machines (seen on 3000 and 3001) — check what's
  actually listening rather than assuming a fixed port.
- **Next step:** not yet decided — options are `/admin/tenants` (repeats the CRUD pattern) or
  wiring the login/property data to a real backend. Ask the user before picking.

## 2026-08-19 — Claude (MacBook) built real server-side sessions; /admin now protected

- User typed every file by hand, guided step-by-step, verified in-browser after each piece.
- `lib/session.ts`: server-side session store — `Map<token, SessionUser>`, globalThis-backed
  (same survive-hot-reload pattern as `lib/data/store.ts`). `createSession`, `getSessionUser`,
  `deleteSession`, plus the `SESSION_COOKIE_NAME` constant.
- `lib/get-session.ts`: reads the cookie, looks up the session via the store above.
- `app/login/actions.ts` (new): `loginAction`, a Server Action — checks hardcoded credentials
  (`admin@example.com`/`password`, still no real backend), creates a session, sets an **httpOnly
  cookie holding only the random token** (not the user data — deliberate improvement over the
  old `rentmanagementclient` monorepo attempt, which base64-encoded the whole user into the
  cookie). Redirects to `/admin` on success, `/login?error=1` on failure.
- `app/login/page.tsx`: rewritten back to a plain server-rendered form (dropped `"use client"`,
  `useState`, `useRouter`, `onSubmit` entirely) using `<form action={loginAction}>` — same shape
  as the `/admin/properties` add-form pattern from the previous entry.
- `app/admin/layout.tsx`: now `async`, calls `getSession()`, redirects to `/login` if there isn't
  one — protects everything under `/admin/*` in one place. Also added a working "Sign out" button.
- `app/admin/actions.ts` (new): `logoutAction` — deletes both the server-side session entry and
  the cookie.
- Verified end-to-end in-browser: `/admin/properties` while logged out → redirects to `/login`;
  correct login → lands on `/admin`; sign out → blocked from `/admin` again. No console/server
  errors at any step.
- Not yet done: still hardcoded credentials, no real backend call; no session expiry cleanup
  (tokens live in the `Map` until the dev server restarts); `/admin/tenants` nav link still 404s.
- **Next step:** not yet decided — options are `/admin/tenants` (repeats the CRUD pattern) or
  wiring the login/property data to a real backend. Ask the user before picking.

## 2026-08-19 — Claude (MacBook) built /admin/properties (list, add form, detail page)

- User typed every file by hand, Claude guided step-by-step and verified in-browser after each
  piece (per the guided-coding-mode rule in `AGENTS.md`).
- `lib/types.ts`: added `Property { id, address, city, rentAmount }` — deliberately minimal,
  more fields (units, province, etc.) can be added once the basic flow is proven out.
- `lib/data/store.ts`: new file, same `globalThis`-backed in-memory array pattern as the old
  monorepo attempt's `store.ts` — `listProperties`, `createProperty`, `getProperty`.
- `app/admin/properties/page.tsx`: list page (Server Component, no client JS).
- `app/admin/properties/new/page.tsx` + `actions.ts`: add-property form using a **Server Action**
  (`"use server"`, `<form action={fn}>`) — first Server Action in this rebuild.
- `app/admin/properties/[id]/page.tsx`: property detail page — first **dynamic route** in this
  rebuild; `params` is a `Promise` in this Next.js version, same pattern as `searchParams`
  elsewhere.
- Verified end-to-end in-browser at `localhost:3000`: add a property → redirects to list → shows
  up → click through → correct detail page renders. No server/console errors.
- Not yet done: edit/delete a property, and no session/auth guard on `/admin/*` yet (still true
  from earlier entries — login doesn't set any real session).
- **Next step:** decide the next feature — `/admin/tenants` (same CRUD pattern, less new
  concept-wise) or wiring up real server-side sessions (a stated user preference, not yet built)
  before adding more admin pages behind an unguarded route. Not yet decided — ask the user.

## 2026-08-19 — Claude (MacBook) reconciled handoff docs with Codex's

- Pulled and found Codex had independently just added this same "shared handoff protocol" idea
  (see entry below) — good convergence, no conflict in actual code.
- Trimmed `AGENTS.md`'s addition down to a pointer at this file's protocol section, instead of
  restating the protocol in both files — `PROGRESS.md`'s "Shared agent handoff protocol" section
  is now the single source of truth for the process; `AGENTS.md` just tells any agent to read it,
  plus states the guided-coding-mode rule (which belongs in AGENTS.md as a durable rule, not a
  changelog entry).
- No code/feature work done this entry — next step is still `/admin/properties` per Codex's note
  below. Starting that now.

## 2026-08-19 — Codex/Claude shared handoff established

- Codex pulled this MacBook checkout and confirmed `main` matches `origin/main` with a clean
  working tree.
- Both agents will use this `PROGRESS.md` protocol for cross-agent and cross-device context.
- Learning mode remains in effect: guide the user to write each feature, explaining the file,
  code, and reason rather than silently building it for them.
- **Current next step:** guide the `/admin/properties` feature: property list first, then the
  add-property form; use it to introduce dynamic routes and Server Actions.

## 2026-08-18 — Login now redirects to /admin; handing off to MacBook

- Login form's submit handler now calls `router.push("/admin")` on success (via `useRouter`
  from `next/navigation`) instead of `alert()` — verified end-to-end in-browser at
  `localhost:3001`: correct creds land on the `/admin` dashboard shell.
- Along the way, fixed a React 19.2.10 deprecation warning: form submit handlers should type
  the event as `React.SubmitEvent<HTMLFormElement>`, not the now-deprecated `React.FormEvent`.
- All of the above is pushed to `main` (through commit `e449a3a`).
- **Session ending here — next work continues from the MacBook.** Pick up with `/admin/properties`
  next: a list page plus an add-property form (dynamic routes + Server Actions are the next
  new concepts). `git pull` first before starting.

## 2026-08-18 — Home page, SEO, and login page (learn-by-building mode)

- User is building this project hands-on to learn React/Next.js/TypeScript — Claude guides
  step by step (what file, what code, why) rather than writing files directly. This is a
  deliberate fresh restart of a previous, more built-out monorepo attempt; that old code is
  not part of this repo.
- Real home page content + full SEO metadata (title template, Open Graph, Twitter card,
  `robots` object) added to `app/layout.tsx` and `app/page.tsx`.
- `app/robots.ts` and `app/sitemap.ts` added (Next.js special files that auto-generate
  `/robots.txt` and `/sitemap.xml`).
- Deployed to Vercel: **https://rentmanagement-liard.vercel.app/** (connects to
  `github.com/rentmanagement26/rent-manager-frontend`, auto-deploys on push to `main`).
  Note: Vercel only reflects what's been pushed — local work isn't visible there until pushed.
- `app/login/page.tsx` built: a client-side login form (`"use client"`, `useState` controlled
  inputs, `onSubmit` handler) with a hardcoded mock credential check
  (`admin@example.com` / `password`) since there's no backend yet. Verified working in-browser
  (both success and invalid-credential cases). Not yet wired to redirect anywhere real, since
  `/admin` doesn't exist yet.
- Page roadmap agreed: Phase 1 public site (`/`, `/login`) → Phase 2 admin/landlord portal
  (`/admin` dashboard shell, `/admin/properties`, `/admin/tenants`) → Phase 3 tenant portal
  → Phase 4 advanced features (leases/e-sign, payments, chat) later.
- Dev note: two unrelated local projects both had a `.claude/launch.json` config named `"web"`
  on port 3000, which caused tooling to attach to the wrong project's dev server. This
  project's config was renamed to `"rent-manager-web"` to disambiguate.

## 2026-08-18 — Project kicked off

- Started from `create-next-app` (Next.js 16, React 19, TypeScript, Tailwind v4, App Router).
- Added `lib/types.ts` with `AppRole` ("admin" | "tenant") and `SessionUser` — first piece
  of real domain modeling, laying groundwork for role-based/multi-tenant auth.
- `app/page.tsx` and `app/layout.tsx` are still default scaffolding (placeholder "Hello" page,
  default "Create Next App" metadata) — not yet built out.
- Backend is a separate ASP.NET / EF Core project (per project overview).
- Working across two machines (Windows desktop + MacBook), committing to
  `github.com/rentmanagement26/rent-manager-frontend` (`main`) from both.

### Next up
- Decide on and scaffold the auth/login flow around `SessionUser`.
- Build a basic layout/nav shell.
- Wire up API calls to the ASP.NET backend.
