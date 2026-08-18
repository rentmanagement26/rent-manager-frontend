# Progress Log

This file is the shared record of what's happening on this project, since it's
tracked in git and syncs across every machine we work from (Windows desktop +
MacBook). Claude reads this at the start of a session to catch up on decisions
made elsewhere; add a short entry whenever something meaningful changes.

Format: newest entries at the top.

---

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
