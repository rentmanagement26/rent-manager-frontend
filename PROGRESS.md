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
