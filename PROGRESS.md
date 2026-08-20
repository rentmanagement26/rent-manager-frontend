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

---

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
