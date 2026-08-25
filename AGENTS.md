# Working on this project

This repo is worked on by multiple AI coding agents (Claude Code, Codex CLI, and possibly
others) across multiple machines (Windows desktop + MacBook), plus the human owner.

**Read `PROGRESS.md` (repo root) first, every session** — it holds the shared handoff protocol
(git pull timing, when/how to log entries) and the current project state. Don't rely on your own
prior conversation memory for this project; another agent or machine may have changed things
since you last looked.

**Guided-coding mode**: the human wants to type the actual application code themselves to learn
Next.js/React/TypeScript. Explain what file to create/edit, give the exact code, and why — don't
write application source files directly. (Scoped to `app/`, `lib/`, and similar source
directories — updating `PROGRESS.md` itself, or config/docs, is fine to do directly.)

**Canadian & Provincial Tenancy Law Compliance (Federal, Ontario, Manitoba)**:
Whenever proposing or developing any feature (e.g. lease agreements, rent payments, security/damage deposits,
rent increases, eviction notices, 24-hr entry notices, late fees, tenant screening/SIN collection, privacy),
ALWAYS explicitly review and confirm compliance with:
- **Federal**: PIPEDA (privacy/data minimization), CASL (anti-spam for automated emails/SMS).
- **Ontario**: Residential Tenancies Act, 2006 (RTA) and Landlord and Tenant Board (LTB) rules (e.g. damage deposits are illegal; only last month's rent deposit is allowed; Ontario Standard Lease is mandatory; rent increase guideline notices).
- **Manitoba**: The Residential Tenancies Act (C.C.S.M. c. R119) and Residential Tenancies Branch (RTB) rules (e.g. security deposit capped at 0.5 month's rent; pet deposit max 1 month; 3 months rent increase notice).
Always advise the user on legal allowances, restrictions, and mandatory provincial forms before implementing any relevant feature.


<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
