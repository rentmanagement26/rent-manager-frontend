# Progress Log

This file is the shared record of what's happening on this project, since it's
tracked in git and syncs across every machine we work from (Windows desktop +
MacBook). Claude reads this at the start of a session to catch up on decisions
made elsewhere; add a short entry whenever something meaningful changes.

Format: newest entries at the top.

---

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
