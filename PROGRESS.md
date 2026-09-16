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

## 2026-09-16 — Claude (Windows) repositioned the "Add property" banner and surfaced role/Upgrade on mobile

- Continuation of the same day's session below — two small, user-directed placement follow-ups
  after the property/unit edit-archive work shipped.
- **"Add property" banner moved from below the property grid to right below the page header**
  (`app/landlord/properties/page.tsx`) — user wanted it visible without scrolling past the whole
  grid first. Same banner markup, just relocated above the stats cards instead of after the grid.
- **`Landlord` role badge and the `Upgrade` button were invisible below the `sm:` breakpoint**
  (both have had `hidden sm:inline-flex` in `account-menu.tsx` since the original mobile-header
  work, deliberately, since the mobile header row has no room to spare). User asked where else
  these could go on mobile without changing the existing design — mocked up 3 options with the
  `visualize` tool first (a permanent strip below the header, moving/adding to the top of the
  slide-out drawer, or surfacing inside the already-existing avatar dropdown) before writing any
  code. **User picked the dropdown.** The role badge already showed there for every screen size;
  added an "Upgrade to Pro" link right below it, wrapped in `sm:hidden` so it only appears in the
  dropdown on mobile — desktop is completely unchanged (still just the top-bar pill, confirmed via
  screenshot: no duplicate entry in the dropdown at desktop width).
- Verified both in-browser at real mobile (375px) and desktop widths, `npx tsc --noEmit` clean, no
  console/server errors.
- **Not committed this session, still local-only**: the `heic2any` dependency, held again.
- **Next step**: nothing open from this entry. Same still-open items as the entry below.

## 2026-09-16 — Claude (Windows) built property/unit edit + archive, fixed a real layout-clipping bug, and unified the "Add property" CTA

- User explicitly authorized writing these files directly this session ("do it yourself"),
  overriding the standing guided-coding-mode rule for this work only — not a permanent change to
  that rule.
- **Confirmed backend support before coding**: `PropertiesController.cs` already has
  `PUT /api/v1/properties/{id}` (update), `POST /api/v1/properties/{id}/archive`,
  `PUT /api/v1/properties/units/{id}` (update, including `Status`), and
  `POST /api/v1/properties/units/{id}/archive` — all fully built, all returning `204` on success.
  Archiving a property is blocked server-side while it still has any active unit ("Archive all
  units before archiving this property"); archived items disappear from every list/detail view
  automatically. This finally unblocks the old unit-edit stub, which had been waiting on exactly
  this endpoint since 2026-08-27.
- **New**: `app/landlord/properties/[id]/edit/` (property edit form, mirrors `new-property-form.tsx`
  pre-filled), `app/landlord/properties/[id]/units/[unitId]/edit/` (real unit edit form — replaces
  the "coming soon" stub — includes a `Status` dropdown backed by the real
  `GET /unit-statuses` enum, which `new-unit-form.tsx` never had), `archive-property-button.tsx` /
  `archive-unit-button.tsx` (inline confirm UI, see below), `updatePropertyAction` /
  `archivePropertyAction` / `updateUnitAction` / `archiveUnitAction` in `properties/actions.ts`,
  `UpdateUnitInput` type, `getUnitStatuses()` in `lib/unit-types.ts`.
- **Real bug caught and fixed, not just a testing inconvenience**: built the Archive buttons with
  a native `confirm()` dialog first. Browser-tool testing showed **this in-app browser suppresses
  all native JS dialogs and always returns `false`** — but the underlying problem is real beyond
  just this testing tool: `confirm()` is genuinely unreliable in production too (some mobile
  WebViews block it outright; desktop browsers let users permanently silence repeated dialogs on a
  site). Replaced with a small inline confirm UI built into each button component itself
  (click → reveals an inline message + Cancel/Confirm — no browser API involved) — more reliable
  everywhere and now actually testable end-to-end.
- **Real pre-existing layout bug found and fixed, not introduced by this work**: adding the new
  "Danger zone" section made a property/unit detail page tall enough to finally expose a bug that's
  been in `app/landlord/layout.tsx` all along. `<main>` had both `lg:h-screen` (forcing exactly
  100vh) *and* sat in a grid row already sized by `grid-rows-[auto_minmax(0,1fr)]` — the two
  conflict, so `<main>`'s own box rendered exactly as tall as the header above it (measured: 117px
  in one repro), with that excess hard-clipped by the outer grid's `overflow:hidden`. Not a scroll
  bug — no amount of scrolling `<main>`'s own content could ever reach the clipped region, since
  `<main>`'s box itself was drawn past the bottom of the screen. Fixed by swapping `lg:h-screen` for
  `lg:min-h-0`, letting the grid track size it correctly — same fix pattern as the 2026-08-28
  sidebar-clipping bug. Verified precisely (computed exact pixel overflow before/after: 117px → 0),
  confirmed on both the newly-tall property page and the dashboard (no regression).
- **User-directed placement decisions, not assumed**: Archive was first added to the `PageHeader`
  action slot (matching Edit) — user explicitly said no, moved both to a "Danger zone" card at the
  bottom of each detail page instead. Separately, user flagged the "Add property" button rendering
  differently on the dashboard vs. the Properties page (a `rounded-full` pill with an icon vs. a
  plain `rounded-xl` button) — fixed to match everywhere, then user asked to see placement
  alternatives to moving it out of the header entirely. **Mocked up 4 options with the `visualize`
  tool before writing any code** (per standing mockup-first preference): a grid "+" tile (matching
  the existing photo-upload pattern), a banner below the grid, a floating action button, and a
  sidebar quick-add. **User picked the banner.** Removed the header button from both the Dashboard
  and Properties pages; added a new banner CTA below the property grid on the Properties page;
  left the Dashboard as-is otherwise since it already has two other entry points (the "Quick
  actions" tile and the empty-state link) — no redundant banner added there.
- **Verified end-to-end against the real Azure backend** for every path: property edit (real save,
  reverted after), property archive success (throwaway test property) and the backend-blocked case
  (real property with active units — real error message shown, nothing touched), unit edit (real
  status change, reverted), unit archive (throwaway test unit). `npx tsc --noEmit` clean after every
  step. No console or server errors at any point.
- **Compliance note**: no new PIPEDA/CASL/RTA/RTB angle — editing/archiving a landlord's own
  property/unit records, no new personal data collected or exposed.
- **Not committed this session, still local-only**: the `heic2any` dependency
  (`package.json`/`package-lock.json`) from the paused HEIC photo-conversion work — held again per
  user's earlier instruction, kept out of this push too.
- **Next step**: nothing open for this session's work. Still open: the HEIC upload fix itself, the
  Option A tenant-invite backend change (route existing-account invitees straight to login instead
  of showing a registration form — needs a change in `Rent Management Back-End`, not this repo),
  and the two still-open PROGRESS.md items from 2026-09-14 below (the `/landlord/tenants`-vs-"Add
  rent"/"Reports" duplicate-link bug, and the broken HEIC seed photo needing manual cleanup).

## 2026-09-15 — Claude (Windows) built the tenant-invite feature (invite-send + public accept/register flow)

- Last open item from the mobile→web handoff doc — the dashboard's "Add tenant" / sidebar "Tenants"
  links have pointed at `/landlord/tenants` (a 404) for a while; this builds that page plus the
  matching public accept-invite flow.
- **Verified before coding, not guessed**: researched the real backend source directly
  (`PropertyManagementRepo/.../AuthController.cs`) and confirmed the entire backend for this feature
  already exists and works (4 endpoints under `/api/v1/auth`: `POST tenant-invites`,
  `GET tenant-invites/{token}`, `POST register/tenant`, `POST tenant-invites/{token}/accept`) — but
  neither this web app nor the mobile app had any UI for it (mobile's "Invite tenant" menu item is
  literally `Alert.alert("Coming soon")`). No "list my tenants" endpoint exists yet, so a tenant
  roster/list page is explicitly out of scope for this pass — invite-send + invite-accept only.
- Confirmed the invite email's link is hardcoded backend-side to
  `https://rentmanagement-liard.vercel.app/register/tenant?token={token}` (`Frontend:TenantSignupUrl`
  in the backend's `appsettings.json`) — so the route had to be exactly `/register/tenant` reading
  `token` from the query string, matching how `/reset-password` and `/confirm-email` already work.
- **New**: `lib/tenant-invite-api.ts` (mirrors `lib/media-api.ts`'s shape — public calls via plain
  `fetch`, authenticated calls via `backendFetch`), `app/landlord/tenants/` (invite-send page + form +
  action, landlord-only), `app/(auth)/register/tenant/` (public preview/accept/register page + actions
  — branches on missing/expired/used token, not-logged-in vs. logged-in-matching-email vs.
  logged-in-wrong-email). `lib/types.ts` gained the request/response shapes for all 4 endpoints.
- **`/login` gained an optional `redirect` param** (so "you already have an account" on the invite
  page can send someone to log in and land back on their invite) — added `isSafeRedirectTarget()` in
  `lib/auth-guard.ts` (same-origin relative paths only, `/^\/(?!\/|\\)/`) to close the open-redirect
  hole this would otherwise create, applied on both the login success *and* error-retry paths (a
  mistyped password shouldn't lose the link back).
- **Closed a real dead-end in the new-account path**: a brand-new tenant's journey is register →
  confirm email (external link, unrelated to the invite token) → log in → accept (still needs the
  *original* invite token, which is otherwise gone from the URL by then). Fixed with a short-lived
  (~2h) `httpOnly` `pending_tenant_invite` cookie set right before the post-registration redirect;
  `loginAction` checks for it after building the session and, if present (and no explicit `redirect`
  already won), sends them straight back to `/register/tenant?token=...` instead of their default
  dashboard.
- **Verified end-to-end against the real Azure backend and real SMTP**, all via the guided-coding
  process (user typed every file): `npx tsc --noEmit` clean throughout. Sent a real invite from
  `/landlord/tenants` — real email arrived from the backend's own mailer, confirming the SMTP path
  end-to-end, not just the frontend call. Loaded the real invite token locally (swapped the email's
  Vercel domain for `localhost:3000` — the token itself is backend-issued and works on either
  frontend) and confirmed two real branches live: **wrong-account mismatch** (logged in as a
  different real account than the invite's target — correct message + logout button, real
  landlord/unit/property/address data rendered in the intro card, no raw 403 leaked) and **matching-
  account accept** (logged in as the actual invited email, which turned out to already hold a
  Contractor role — a genuine multi-role test, not just a fresh signup — accept succeeded, redirected
  to the success screen, "Go to your portal" link worked). Zero console/server errors throughout.
- **Not yet verified**: the brand-new-account signup branch (`register/tenant` → confirm-email →
  login → auto-return via the `pending_tenant_invite` cookie), the expired/already-used-invite
  messaging (the token used above is now itself in the "already used" state and hasn't been reloaded
  to confirm that message), and the whole flow against the **live Vercel deployment** using the real,
  unmodified email link (this session tested locally by swapping the domain on a real token — about
  to push and test live next).
- **Not part of this push, still sitting local-only**: `heic2any@0.0.4` was added as a dependency in
  an earlier part of this session (HEIC→JPEG client-side conversion for the photo-upload feature),
  but that work was paused before any file was written to use it, and the user chose to hold off on
  committing it too — `package.json`/`package-lock.json` still show it modified locally but
  uncommitted. Pick that work back up (and commit it then) whenever HEIC photo handling comes up
  again; see the 2026-09-14 HEIC investigation entry below for full context.
- **Next step**: push and confirm on the live Vercel deployment with the real, unmodified invite
  email link (this is the one thing local testing can't prove — whether Vercel's own env vars/config
  match). After that: the new-account signup branch and the expired/used-invite messaging, both
  easy to test with a second throwaway invite. Separately, still open: the dashboard's "Add
  rent"/"Reports" quick actions both still incorrectly link to `/landlord/tenants` (pre-existing
  copy-paste bug, not touched this session) — they need their own real destinations once those
  features exist. Also still open (unrelated, deferred by user mid-session): the HEIC upload fix
  itself (`lib/heic-convert.ts` + wiring into the photo-carousel/photo-strip upload flow) and its
  optional display-side fallback for already-broken HEIC blobs in storage — see the 2026-09-14 HEIC
  investigation entry below for full context.

## 2026-09-14 — Claude (MacBook) verified the property/unit photo feature end-to-end; found and scoped an iPhone/HEIC upload bug (not fixed anywhere yet)

- Verified the property-photo (add/cover/delete) and unit-photo (add + real view page) feature built earlier
  this session, end-to-end against the real Azure backend, logged in as a real landlord: deleted a real
  property photo (count updated correctly), set a different photo as cover (star badge + hero image updated),
  uploaded a synthetic test photo via a JS-simulated `<input type=file>` change event (real SAS URL issued →
  real PUT to Azure Blob → real backend registration → appeared after `router.refresh()`), then deleted it to
  leave demo data clean. Unit page: real unit details render correctly, add-photo flow works end-to-end the
  same way, lightbox (prev/next/counter/close) all work, no delete UI (by design — the "Photos can't be
  removed without admin help." note shows, matching the mobile app's behavior).
- Hit a stale Turbopack dev-cache issue mid-testing (phantom "export doesn't exist" console errors for
  exports that were actually present and correct on disk). Same class of bug as the `.next/cache` staleness
  noted 2026-08-28, just the module graph instead of static images this time. Fixed by killing and restarting
  the dev server — not a real code defect, don't chase it as one if it recurs.
- **Found a real, unrelated bug while testing the unit page**: one of unit 2's existing seed photos renders
  as a broken image. Traced it (not guessed): the blob at
  `property-media/units/2/f1b4804b-bc22-4d26-8ff7-de9c3a339cfd.jpg` is actually HEIC content (`ftypheic`
  magic bytes, `Content-Type: image/heic`, confirmed by fetching the SAS URL directly), which browsers can't
  decode — despite the `.jpg` extension. Root cause: `rent-management-mobile`'s two `launchImageLibraryAsync`
  calls (`src/app/properties/[id]/index.tsx:79`, `src/app/properties/[id]/units/[unitId].tsx:85`) don't set
  `preferredAssetRepresentationMode`, so it defaults to `Automatic` — which on a HEIC-shot iPhone photo can
  hand back the original HEIC asset instead of converting it. That's the primary fix, and it's in the mobile
  repo, not this one.
- **Since most landlords will be on iPhones** (HEIC is iOS's default capture format), rejecting HEIC outright
  anywhere in the pipeline would break the common case, not an edge case. Right shape is layered: fix at the
  mobile picker (primary — see above), confirm this repo's web upload inputs' existing
  `accept="image/jpeg,image/png,image/webp"` restriction actually triggers Safari's documented HEIC→JPEG
  auto-conversion (needs a real-iPhone check, not just code review — not yet done), and validate real file
  content server-side as a safety net, not the primary handler (full server-side HEIC *decoding* would need a
  native libheif/ImageMagick dependency .NET doesn't have — not worth it unless client-side conversion proves
  unreliable in practice).
- **Backend fix was prototyped and reverted, not shipped**: built real content-sniffing validation in
  `PropertyManagementRepo` — new `SharedKernel/ImageSignature.cs` (magic-byte check for JPEG/PNG/WEBP), a
  ranged `DownloadHeaderBytesAsync` added to `IBlobStorageService`, wired into `AddPropertyMediaCommand`/
  `AddUnitMediaCommand` right after the existing size check (same reject-and-delete-blob pattern already used
  there for the size limit). `dotnet build` verified clean, 0 warnings. **Reverted per explicit user
  instruction** ("do not change anything on backend") — this was a design proof, not a shipped fix. Full task
  write-up (all 3 parts) also logged in `PropertyManagementRepo/PROGRESS.md`'s "Known issues / follow-ups"
  section for whoever picks it up there.
- **Next step**: three independent tasks, any order —
  1. Mobile (`rent-management-mobile`): add
     `preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible`
     to both `launchImageLibraryAsync` calls above; test with a real iPhone-shot HEIC photo, not the
     simulator (simulator photo libraries are usually already JPEG).
  2. Web (this repo): confirm on a real iPhone that the existing `accept`-restricted file inputs already
     convert HEIC to JPEG on selection; only needs a code change (e.g. a client-side conversion library) if
     that check fails.
  3. Backend (`PropertyManagementRepo`): re-implement the reverted content-sniffing validation described
     above.
  Separately, still open from earlier this session: whether to commit+push this repo's photo-feature code
  (verified working per above, but still uncommitted) — waiting on the user.
- Also: the broken seed photo itself (`property-media/units/2/f1b4804b-...jpg`) is still sitting there
  broken — none of the above fixes it retroactively. Needs a manual delete via DB/blob access, since there's
  no unit-photo delete UI by product design.

---

## 2026-09-14 — Claude (MacBook) fixed the header "Add property" button wrapping mid-word on tablet-width screens

- User reported the button "not looking good on lower screens" — reproduced in-browser (not guessed):
  at exactly the width where the mobile header layout (`lg:hidden`, active up to 1024px) is showing the
  `sm:`-and-up "Landlord" badge + "Upgrade" link (640px+) alongside the title and the "Add property" pill,
  none of the header row's flex children had shrink protection, so the button got squeezed and its text
  wrapped to "Add" / "property" on two lines instead of the title truncating first.
- **Root-cause fix in `components/page-header-slot.tsx`**: gave the title wrapper `min-w-0 flex-1` (so it's
  the element that shrinks/truncates under pressure — it already had `truncate` on the `<h1>` but nothing
  upstream constrained its width) and the action wrapper `shrink-0` (so the button never gets compressed).
  Fixes this for all 4 pages that use `PageHeader`'s `action` slot, not just the 2 with this button.
- Added `whitespace-nowrap` directly to the two "Add property" pill buttons (`app/landlord/page.tsx`,
  `app/landlord/properties/page.tsx`) as a second line of defense.
- **Verified in-browser at the exact width that broke** (800px CSS, reproduced via the browser tool's
  custom-size resize) on both pages — button now stays on one line — plus re-checked true mobile (375px)
  and desktop for no regression. `npx tsc --noEmit` clean.
- **Next step**: nothing open from this fix. Separately, the property/unit photo feature below (add/cover/
  delete for properties, add-only for units, plus a real unit detail page replacing the old stub) has been
  built per the plan in the entry below but **not yet verified end-to-end against the real backend** — an
  agent couldn't log in to test it (won't type a password into the login form), so the next session/human
  should click through add/cover/delete on a real property and unit before trusting it fully.

---

## 2026-09-14 — Claude (Windows) planned the property/unit photo (media) feature — NOT YET BUILT, plan only

- User wants full parity with the mobile app's media feature next: adding property photos, cover-image
  selection, deleting photos, and unit photos — researched the mobile app + backend thoroughly (agent-based
  deep read of both codebases, not guessed) and wrote this plan instead of code, since the user will
  continue the actual implementation on the MacBook. **Nothing in this entry is built yet** — read this plan
  fully before writing any code against it, and re-verify against the live backend/mobile source if much
  time has passed, per this project's standing "verify before coding" process.
- **Scope decision (user confirmed)**: match mobile exactly — **property photos get add + cover-select +
  delete; unit photos are add-only**, no cover/delete UI for units, same as mobile today (even though the
  backend supports cover/delete for units too — just build it for properties only, consistent with mobile).
- **Build order (user confirmed)**: property and unit media together in one pass, sharing the same
  upload/API layer rather than building one then the other.

### The upload mechanism (confirmed from backend source + mobile's working implementation)

Direct-to-Azure-Blob, 3 HTTP calls per photo, in this exact order — **the API server never touches file
bytes**:
1. `POST /api/v1/properties/{propertyId}/media/upload-url` (or `.../units/{unitId}/media/upload-url`) —
   body `{ fileExtension: ".jpg" }` (derive from the file's MIME type: `image/jpeg`→`.jpg`, `image/png`→
   `.png`, `image/webp`→`.webp`, default `.jpg`) — returns `{ blobPath: string, uploadUrl: string }`
   (`uploadUrl` is a write-only SAS URL, 15 min expiry).
2. **`PUT` the raw file bytes directly to `uploadUrl`** — headers `{ "x-ms-blob-type": "BlockBlob",
   "Content-Type": <file's mime type> }`, body = the raw `File`/`Blob` itself (NOT `FormData`, NOT base64).
   The `x-ms-blob-type` header is mandatory for Azure's SAS "Put Blob" operation. No `Authorization` header
   on this call — the SAS token in the URL query string is the auth.
3. `POST /api/v1/properties/{propertyId}/media` (or `.../units/{unitId}/media`) — body
   `{ blobPath, sortOrder }` (`sortOrder` = current photo count + index, appended after existing photos) —
   registers the DB row. This is where the backend enforces the 6MB file-size limit (checks actual blob size
   in storage after upload) and the per-property/unit photo count limit — a rejected file's blob is deleted
   server-side, nothing orphaned lingers.

Reads: `GET .../media` returns `[{ id, url, sortOrder, isCover }]` — `url` is a **fresh 10-minute read-only
SAS URL**, regenerated on every call. Never cache/store this URL past the current page load; re-fetch on
every page visit (mobile does this via `useFocusEffect`; web should do it via a normal server-rendered
`GET` on every page load, which happens naturally with Server Components).

**Confirmed limits**: 5 photos per property, **10 photos per unit** (not 5 — verified against the backend's
`MaxPhotosPerUnit` constant and mobile's own `MAX_UNIT_PHOTOS = 10`, don't assume it matches the property
limit). 6MB per file, both provinces/limits enforced server-side already — client-side pre-checks are a nice-
to-have for UX, not required for correctness.

**Cover image**: `POST .../media/{mediaId}/cover` (property only, per the scope decision above), empty body
— unsets the previous cover, sets this one. The backend auto-sets the *first* photo ever uploaded as cover,
so no explicit cover call is needed after the very first upload. On the property detail page, mobile
reorders cover-first client-side (`isCover` photo moved to index 0 in a `useMemo`, regardless of
`sortOrder`) — worth doing the same on web rather than relying on `sortOrder` alone.

**Delete**: `POST .../media/delete` (property only, per scope decision), body `{ mediaIds: number[] }` —
always send a single-element array from the UI (bulk delete exists backend-side but nothing client-side
needs it). IDs that aren't yours are silently skipped, not an error.

### Architecture decision for this Next.js app — recommended, not yet built

Mobile does the actual file-bytes PUT (step 2 above) directly from the device to Azure. **This web app
should do the same — the PUT must happen client-side (browser), not inside a Server Action** — because
Vercel serverless functions have a request body size limit (historically ~4.5MB) well under this feature's
6MB file-size limit; routing file bytes through a Server Action risks silently failing on exactly the
photos most likely to hit the size cap. Recommended split:
- Steps 1 (`upload-url`) and 3 (`media` register) — small JSON payloads, need `session.backendToken` — fit
  naturally as **Server Actions**, same pattern as every other backend call in this app.
- Step 2 (the actual PUT) — **must run in a `"use client"` component**, calling `fetch(uploadUrl, {...})`
  directly from the browser to Azure, in between calling the two Server Actions above (client calls Server
  Action 1 → gets `{blobPath, uploadUrl}` back → client does the PUT itself → client calls Server Action 3
  with `blobPath`). This means the property/unit detail pages need a small client component for the
  upload/cover/delete UI (they're currently pure Server Components) — mirrors how `properties-grid.tsx`
  already exists as this app's one precedent for a client component alongside server-rendered pages.

### File-by-file plan

- **`lib/types.ts`** — add:
  ```ts
  export interface MediaItem { id: number; url: string; sortOrder: number; isCover: boolean; }
  ```
  (request/response shapes for the upload-url/register/delete calls can just be inline `JSON.stringify`
  bodies and `await response.json()` casts, matching how `CreatePropertyInput` etc. are already used — no
  need for dedicated request/response interfaces unless it gets unwieldy.)
- **New `lib/media-api.ts`** (mirrors mobile's `lib/media-api.ts` 1:1 in spirit, adapted to this app's
  `backendFetch(path, token, init)` helper) — server-side functions, callable from Server Actions:
  `getPropertyMedia(propertyId, token)`, `getUnitMedia(unitId, token)`, `getPropertyMediaUploadUrl(propertyId, fileExtension, token)`, `getUnitMediaUploadUrl(unitId, fileExtension, token)`, `registerPropertyMedia(propertyId, blobPath, sortOrder, token)`, `registerUnitMedia(unitId, blobPath, sortOrder, token)`, `setPropertyMediaCover(propertyId, mediaId, token)`, `deletePropertyMedia(propertyId, mediaId, token)`.
- **`app/landlord/properties/actions.ts`** — add Server Actions wrapping the above:
  `getPropertyUploadUrlAction`, `registerPropertyMediaAction`, `setPropertyCoverAction`,
  `deletePropertyMediaAction`, and unit equivalents (`getUnitUploadUrlAction`, `registerUnitMediaAction`) —
  no cover/delete actions needed for units per scope decision.
- **New client component** (e.g. `app/landlord/properties/[id]/photo-carousel.tsx`) — property detail's
  photo carousel: cover-first ordering, "add" tile (disabled at 5/5, spinner while uploading), count badge
  ("N/5"), edit-mode toggle revealing a delete button on the active photo, cover-star toggle button.
  Orchestrates the 3-step upload per file the user picks (sequentially per file, not `Promise.all`, so the
  server-side count check isn't raced — same reasoning mobile's code comment gives).
- **New client component** (e.g. `app/landlord/properties/[id]/units/[unitId]/photo-strip.tsx`) — unit
  detail's simpler photo strip: fixed-size thumbnails, "add" tile (disabled at 10/10), no cover/delete UI,
  click-to-open lightbox (a plain full-screen overlay with prev/next, no library needed — mobile's
  `PhotoViewerModal` has no special logic worth porting beyond "show the image full-screen with a counter").
- **`app/landlord/properties/[id]/page.tsx`** — wire in `<PhotoCarousel>`, fetching `getPropertyMedia`
  alongside the existing property fetch (`Promise.all`, matching mobile's pattern).
- **`app/landlord/properties/[id]/units/[unitId]/page.tsx`** — **currently a total stub** (`return <div>Hello</div>`,
  confirmed just now) — needs real content built from scratch, not just a photo strip added: unit
  label/type/status/bed-bath-sqft/asking-rent display (same data already fetched for the property detail's
  unit cards) plus the new `<PhotoStrip>`.
- Add `"Photos can't be removed without admin help."` static note on the unit detail page, matching mobile's
  exact copy — this is a deliberate product decision (unit photos are never landlord-deletable), not a
  missing feature to build around.

### Compliance note (per AGENTS.md's standing rule)

No new PIPEDA/CASL/RTA/RTB angle beyond what `COMPLIANCE.md` already recorded for Properties/Units — these
are photos of the landlord's own property/unit, not tenant PII. Same caveat as before: if a photo happens to
capture an identifiable person, that's a copy/product-policy question, not something this plan needs to
solve.

### Next step

Pick this plan up (any machine/agent) by: (1) re-confirming the backend routes/limits above still match
live source if this is a new session, (2) building `lib/types.ts`'s `MediaItem` + `lib/media-api.ts` first
(no UI dependency, easy to verify in isolation), (3) then the two client components, (4) then wiring both
detail pages, verifying end-to-end against the real Azure backend (upload a real photo, confirm it appears,
confirm cover/delete work, confirm the unit stub page now shows real content) before considering this done.

---

## 2026-09-14 — Claude (Windows) started the mobile→web visual retheme: design tokens, landlord dashboard/sidebar/header, new logo

- Continuation of the same day's session — after the outage fix (below), picked the visual retheme over the
  tenant-invite feature as the next mobile→web handoff doc item, per the user's own choice on sequencing.
- **Mockup-first, per standing preference**: used the `visualize` tool to mock up the dashboard before
  touching real code, iterated twice on user feedback (fixed an oversimplified Rent Overview section against
  a real screenshot of the mobile app the user shared — the real design has two stacked Last month/This
  month blocks with progress bars and a Collected/Outstanding legend, not the single simplified block first
  drafted; adjusted the "+" header button to be a full "+ Add Property" pill on desktop vs. mobile's
  icon-only circle), then got explicit go-ahead before writing real code.
- **`app/globals.css`**: retheme is just new hex values inside the existing `:root` block — `--bg`/
  `--surface`/`--heading`/`--body-text`/`--muted`/`--default`/`--subtle`/`--accent`/`--accent-tint` all
  repointed to the mobile app's real `src/constants/colors.ts` values (verified against that file directly,
  not guessed), `--brand-blue` repointed to `primaryDark` (the old blue predated the mobile redesign),
  `--brand-green*` repointed to `accentTeal`/`greenDark`/`tealTint`. Cascaded correctly across the
  properties list/detail pages (already fully token-driven) with zero component changes needed there.
- **Dashboard (`app/landlord/page.tsx`) — bigger than a restyle, real new content added**: moved "Add
  property" from the welcome banner into the page header's action slot (matching the Properties page's own
  pattern) as an orange pill; replaced the 3 raw-Tailwind-colored KPI cards (Properties/Occupancy/Revenue)
  with the mobile design's 4 colored stat tiles (Properties=greenDark, Occupied=accentOrange,
  Maint.=purple, Vacancy=accentBlue); added a brand new "Rent overview" card (two stacked Last
  month/This month blocks, progress-bar track, Collected/Outstanding legend with colored dots) that didn't
  exist before — still always "No data yet" placeholders, no rent backend exists yet, matching the
  handoff doc's own note; restyled "My properties" rows to icon-tile cards with the property type shown in
  orange; expanded "Quick actions" from 2 to the mobile design's real 4 (Add property/Add tenant/Add
  rent/Reports) with tinted icon backgrounds per action.
- **`components/landlord-sidebar.tsx`**: active nav link recolored to `bg-accent-tint`/`text-accent`
  (orange, was blue); "Free plan" card rebuilt into "Upgrade to Pro" — solid dark (`bg-heading`) card with a
  shadow, per the mobile design's explicit rule that this is **the one deliberate shadow in the whole app**.
- **`components/account-menu.tsx`**: notification bell wrapped in a 40px white circle button, matching the
  handoff doc's "icon buttons" pattern (was a bare icon before).
- **New logo, in 3 places** — user provided two real asset files (not generated): `domuspro-logo.png` (full
  color: red skyscraper icon + "Domus" black + "PRO" red + tagline, 600x200px) for light backgrounds, and
  `domouspro-white-logo.png` (all-white version) specifically for the orange gradient brand panel on
  login/register. Wired into `landlord-sidebar.tsx` (150x50, was the old blue "D" icon at 140x32),
  `site-header.tsx` (marketing site, 150x50, was `logo.svg`), and both `login/page.tsx`/`register/page.tsx`
  (180x60, was `logo-white.svg`) — confirmed the white variant was made specifically for that orange panel
  by rendering it against the panel's actual gradient before wiring it in, not just trusting the filename.
- **Real bug hit and fixed, worth remembering**: after swapping `public/domuspro-logo.png`'s file content
  (same filename), the marketing site kept showing the *old* logo — root cause was Next.js's image
  optimizer disk cache (`.next/cache/images`) still serving a pre-swap cached render for that exact
  URL+size combination (confirmed via network tab: `304 Not Modified` responses for `/_next/image?...`).
  Replacing a static file's *content* while keeping the same filename doesn't bust that cache on its own —
  fixed by clearing `.next` and restarting the dev server. Worth knowing for next time a `public/` asset is
  swapped in place rather than renamed.
- **Also hit and correctly diagnosed as a false alarm**: a `SyntaxError: Unexpected end of JSON input` on
  the dashboard's `response.json()` call, reproducing across two fresh logins, initially looked like a real
  bug. Added a temporary diagnostic (read the body as text first) and found the actual backend response was
  a perfectly valid, complete `200` JSON payload — the error was stale Turbopack dev-overlay output from
  requests landing mid-hot-reload while files were being edited, not a real defect. Removed the diagnostic
  once confirmed; no code change was needed for this one.
- Verified with `npx tsc --noEmit` (zero errors throughout) and in-browser against the real Azure backend
  after every file change — dashboard, properties list, property detail, login, register, and the marketing
  homepage all confirmed rendering correctly with zero console/server errors on a clean load.
- **Next step**: two items still open from the mobile→web handoff doc — finish the retheme on the remaining
  pages not yet touched (properties detail/create/edit flows, unit pages, tenants stub, profile/settings/
  billing stubs — these will mostly cascade for free from the token change but haven't been visually
  confirmed one-by-one), and separately, build the tenant-invite feature (new `register/tenant` route, the
  dual-path new-account-vs-existing-account branching flow) whenever that's picked up next.

---

## 2026-09-14 — Claude (Windows) built the access-token refresh flow (Part 2 of the same session's outage fix)

- Continuation of the `/api/v1` outage fix below, same session. That fix alone left a second gap from the
  same backend change: access tokens dropped from 4h to **15 minutes**, with a new rotating refresh-token
  pair (`POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`) issued alongside login. Without handling
  it, any session older than 15 minutes would start silently failing backend calls.
- **Confirmed a real Next.js 16 breaking change the hard way**: built the fix as standard `middleware.ts` /
  `export function middleware`, which failed to load at all — Next.js 16 renamed the whole convention to
  `proxy.ts` / `export function proxy` (confirmed in `node_modules/next/dist/docs/.../proxy.md`; a codemod
  `npx @next/codemod@canary middleware-to-proxy .` exists but wasn't used since this was a from-scratch new
  file, not a migration). Exactly the class of issue `AGENTS.md`'s "this is NOT the Next.js you know"
  warning is about — worth remembering for any future proxy/middleware work in this project. Bonus from the
  same version bump: Proxy now defaults to the **Node.js runtime** instead of Edge, so no Edge-runtime
  restrictions apply here.
- **User decision**: sessions are now a **sliding 30 days** (was a flat 8-hour cap) — `proxy.ts` re-issues
  the session cookie with a fresh 30-day `maxAge` on every successful refresh, matching the backend's
  refresh-token lifetime. Chosen over keeping the 8h cap since refresh tokens make it possible without
  meaningfully changing the threat model (still one signed httpOnly cookie either way).
- **Architecture**: `lib/types.ts`'s `SessionUser` gained `backendTokenExpiresAt`/`refreshToken`/
  `refreshTokenExpiresAt`; `lib/session.ts` carries them through `getSessionUser` and bumped
  `SESSION_DURATION_SECONDS` to 30 days. `proxy.ts` (new) runs on `/landlord|tenant|contractor|admin/:path*`,
  checks the stored token's expiry before each request, and refreshes+re-signs the session cookie ahead of
  time — done here rather than reactively in `backendFetch` because Server Components (most call sites)
  can't set cookies during render, only Proxy/Server Actions/Route Handlers can. `app/(auth)/login/actions.ts`
  now stores the 3 new fields at login. `app/actions.ts`'s `logoutAction` now also calls the backend's
  `/api/v1/auth/logout` to revoke the refresh token server-side (best-effort, `.catch(() => {})` — logout
  must not get stuck on a network blip), closing a gap where the old logout only cleared the local cookie.
- **Real bug caught during manual verification, not just reasoned about**: initially had `proxy.ts` force a
  full logout (delete cookie + redirect to `/login`) on any failed refresh. Manually forced a refresh on
  every request to test it end-to-end (temporary `FORCE_REFRESH_FOR_TESTING` flag + console logging, both
  removed after) and caught a real race: the backend's refresh-token rotation has theft-detection (reusing
  an already-rotated token revokes *every* refresh token on the account, confirmed in the backend's own
  `PROGRESS.md`) — two near-simultaneous requests (Next.js's own prefetching can cause this) both reading
  the same pre-refresh cookie will race, the loser gets treated as token reuse, and the old "force logout on
  failure" behavior would have nuked an otherwise-healthy session over a harmless race. **Fixed**: a failed
  refresh in `proxy.ts` now just passes the request through with the existing token instead of forcing
  logout — a losing race self-heals on the next request once the winning request's cookie has propagated;
  the only regression is the narrow case of a *genuinely* dead refresh token no longer getting a clean
  redirect (falls back to pre-this-session silent-failure behavior for that one case, not a new problem).
- Verified end-to-end against the real Azure backend on the local dev server, with the forced-refresh test
  above: a real login → real refresh call → `200` with a rotated token pair, confirming the mechanism itself
  works. Final clean pass (no forcing) after the race fix: fresh login → dashboard renders real data →
  `proxy.ts` correctly passes through in ~10ms without refreshing (token still fresh) — no false triggers,
  zero console errors, zero `tsc` errors.
- **User granted one-off exceptions to guided-coding-mode** for the temporary test scaffolding (added and
  removed by Claude directly, not typed by the user, since it was throwaway debug code rather than
  application logic) and for the final race-condition fix in `proxy.ts` ("change it yourself"). The 5 real
  files (`lib/types.ts`, `lib/session.ts`, `app/(auth)/login/actions.ts`, `app/actions.ts`, and the initial
  `proxy.ts`) were typed by the user per the standing rule.
- **Next step**: nothing open for the outage/refresh-token work — both parts of this session's fix are
  verified working. Still open from the mobile→web handoff doc: the visual retheme (design tokens/component
  patterns) and the tenant-invite feature (needs a new `register/tenant` route) — user's choice which to
  start next.

---

## 2026-09-14 — Claude (Windows) fixed a live production outage: backend moved to `/api/v1/...`, this app still called the old unversioned routes

- Triggered by a mobile→web handoff doc the user shared (mockup-first design retheming + a tenant-invite
  feature to build next) — while cross-checking its claims against the actual sibling repos (all present
  locally: `rent-management-mobile`, `Rent Management Back-End`), found the backend's `PROGRESS.md` and git
  log (`6d77c03`, on `master`, pushed) show **all API routes moved to `/api/v1/...`** as a documented
  breaking change. This frontend was still calling the old unversioned paths everywhere.
- **Confirmed this was a live outage, not just a theoretical mismatch**: curl'd the real Azure backend
  directly (`BACKEND_API_URL` in `.env.local`) — `/api/auth/login` → `404`, `/api/v1/auth/login` → `400`
  (reachable, just moved). **Nobody could log in on the live Vercel deployment.** Also confirmed every route
  is a pure prefix change (checked `AuthController.cs`/`PropertiesController.cs` directly) — no paths were
  otherwise renamed, so the fix is purely mechanical.
- **Fixed all 11 call sites** (grepped every `backendFetch(`/`BACKEND_API_URL` usage in `app/` and `lib/` to
  confirm completeness) by inserting `v1/` after `api/`: `lib/property-types.ts`, `lib/unit-types.ts`,
  `app/(auth)/confirm-email/page.tsx`, `app/(auth)/forgot-password/actions.ts`,
  `app/(auth)/login/actions.ts`, `app/(auth)/register/actions.ts`, `app/(auth)/reset-password/actions.ts`,
  `app/landlord/page.tsx`, `app/landlord/properties/actions.ts` (2 call sites),
  `app/landlord/properties/page.tsx`, `app/landlord/properties/[id]/page.tsx`.
- **User granted a one-off exception to the standing guided-coding-mode rule** ("change it") — edits were
  made directly rather than the user typing them, given this was an active production outage rather than
  new feature work.
- Verified with `npx tsc --noEmit` (zero errors — pure string changes, no type impact), then end-to-end
  in-browser against the real Azure backend on the local dev server: logged in with a real account,
  confirmed the dashboard (real property count/occupancy), properties list (real per-property unit counts),
  and a property detail page (real address/units/rent) all render real data with zero console errors.
- **Also surfaced but not yet fixed**: the same backend change dropped the access token lifetime from 4h to
  15 minutes and added a refresh-token flow (`POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`,
  login/refresh responses now include `refreshToken`/`refreshTokenExpiresAt`). This app's session
  (`lib/session.ts`) only stores the access token in an 8-hour cookie and never refreshes it, so any session
  older than 15 minutes will start silently failing backend calls (not logged out of the site, just unable
  to load data). Fixing this needs Next.js Middleware (`middleware.ts`, doesn't exist in this project yet)
  since Server Components can't set cookies — user chose to ship this outage fix alone first and pick up
  the refresh-token/middleware work as its own next step.
- **Compliance note**: no tenancy-law angle on this fix itself (routing only); the mobile→web handoff doc's
  design-retheme and tenant-invite work it was found alongside are unstarted — tenant-invite compliance
  (PIPEDA data minimization on the invite/registration fields) still needs a pass when that's built, per the
  existing "Not yet built" section in `COMPLIANCE.md`.
- **Next step**: push this fix and confirm on the live Vercel deployment (this is where the actual outage
  is — local verification alone doesn't prove it). After that: build the `middleware.ts` refresh-token flow
  (Part 2 above), then decide between the visual retheme and the tenant-invite feature from the handoff doc.

---

## 2026-08-28 — Claude (Windows) started a native mobile companion app (new sibling repo)

- New sibling repo, `rent-management-mobile` (Expo + React Native + Expo Router, TypeScript),
  alongside this repo and `Rent Management Back-End` — same owner, same backend. Not a rewrite of
  this Next.js app; a separate native app hitting the same Azure-hosted backend.
- Built out a first real feature set this session — login (+ forgot-password, + biometric login),
  dashboard, properties (list/detail/create), units (create) — all against the real backend, no
  mocked data. See `rent-management-mobile/PROGRESS.md` for the full session log; not duplicated
  here since it's a different codebase with its own history.
- Mentioning it here only so any agent working in *this* repo knows a mobile companion now exists —
  no changes were made to this web repo itself this session.
- **Next step for the mobile repo**: real device testing on the MacBook (`npx expo run:ios`) —
  see that repo's `PROGRESS.md` for why (Expo Go's App Store build lagging the project's SDK
  version, worked around by waiting rather than fighting it on a locked-down office PC).

---

## 2026-09-02 — Claude (MacBook) added `COMPLIANCE.md`, a standing compliance checklist

- User asked to sync the repo with git; found one untracked file, `COMPLIANCE.md` (not authored
  in this conversation — pre-existing local work from an earlier session that was never committed).
  Read it, confirmed it's a legitimate doc-only addition (no application code), and it directly
  operationalizes the standing Canadian/provincial tenancy-law compliance-review rule already in
  `AGENTS.md`/this file's protocol section: a per-feature checklist recording what's been reviewed
  (Login/Register/Session, Forgot/Reset-password, Properties/Units, marketing copy) vs. what still
  needs a pass when built (Tenants, Leases, Deposits, Rent increases, Entry/Eviction notices,
  Payments, AI features).
- Confirmed with the user before committing, then pushed directly to `main` (`83915cd`) — this is a
  docs/config file, not `app/`/`lib/` application source, so it's outside the guided-coding-mode
  restriction.
- Repo is otherwise fully in sync: local `main` matched `origin/main` exactly before this, no
  divergence, no unpushed commits.
- Sanity-checked a few other entries' "still open" claims against current repo state while here (all
  still accurate, no drift): `/landlord/tenants` still doesn't exist, the unit edit page
  (`[unitId]/edit/page.tsx`) is still the "coming soon" stub, the DomusPRO palette (entry directly
  below) hasn't been ported into `app/globals.css` yet, and both `public/domuspro-logo-hq.svg` and
  `public/logo.jpg` are still sitting unresolved.
- **Next step:** keep `COMPLIANCE.md` updated whenever a listed feature changes or a new
  lease/deposit/rent-increase/notice/payment feature is built, same trigger as the standing
  `AGENTS.md` rule. No other action needed from this entry.
  (Note: this entry originally also logged a pending "DomusPRO palette not yet ported" note from
  the same session; dropped on the 2026-09-14 sync-merge below since the "Retheme landlord
  dashboard/sidebar/header" entry above shows that port already happened.)

---

## 2026-08-28 — Claude (MacBook) fixed the landlord portal's mobile scroll/bounce bugs and a desktop sidebar clipping bug

- Long debugging session, several wrong turns before landing on the real fixes — summarizing the
  end state; see conversation history for the full trail if needed. User reported two symptoms on
  the live Vercel deployment (iPhone Safari): pull-to-refresh didn't work, and an ugly "double
  bounce" feel when overscrolling.
- **Root cause #1 (found and fixed):** `app/landlord/layout.tsx`'s `<main>` had `h-screen
  overflow-y-auto overscroll-y-none` applied at **all** screen sizes (no `lg:` scoping), making it
  an independently-scrolling box on mobile instead of letting the real page scroll — and
  `overscroll-y-none` (plus a matching `overscroll-none` on `<body>` in `app/layout.tsx`, same
  original commit `64069b4`) blocked the scroll-chaining that Safari's native pull-to-refresh
  depends on. Fixed by scoping `<main>`'s height/overflow to `lg:` only and removing both
  `overscroll-none` rules, making the actual document the sole scroll container on mobile (verified
  via injected JS: `body.scrollHeight > html.clientHeight` after the fix). A deliberate revert-for-
  testing round trip happened here (commit `5bb3686` then `b0c501f` restoring the fix) — worth
  knowing about if `git log` looks like it flip-flopped, that was intentional.
- **Root cause #2 (found and fixed):** the sidebar's "Free plan" card was silently clipped at the
  bottom on desktop, with no way to scroll to it. Two nested instances of the same CSS gotcha —
  `min-height: auto` letting a box grow past its available space instead of respecting it: (1) the
  nav+card flex column in `components/landlord-sidebar.tsx` needed `lg:min-h-0`; (2) the outer
  grid's `grid-rows-[auto_1fr]` in `app/landlord/layout.tsx` needed `auto_minmax(0,1fr)` — a bare
  `1fr` track has an implicit `auto` minimum too. Confirmed **empirically**, not just reasoned about
  — logged into the local dev server with real Browser-tool access (test creds:
  `hardeep2792@gmail.com`), measured the actual computed `grid-template-rows` and element rects via
  injected JS, verified the fix live before advising, then re-verified with a screenshot after.
- **Sidebar refactor**: per user's request, converted `landlord-sidebar.tsx`'s mobile-drawer classes
  from implicitly-cancelled-out (relying on `lg:contents`/`lg:hidden` to neutralize unprefixed
  mobile styles) to explicit `max-lg:`/`lg:` pairs throughout, so nothing depends on remembering to
  add a cancel-out override at the other breakpoint. `app/landlord/layout.tsx` needed no changes —
  audited and confirmed already fully explicit.
- **Researched how spavaro.com and amazon.com handle their mobile hamburger menus** (live via the
  Browser tool) at the user's request — both turned out to use the exact same slide-in-drawer +
  backdrop pattern we already had, just vanilla JS/class-toggling instead of React state, so nothing
  fundamentally different to borrow. Two real differences adopted anyway: an explicit **X close
  button** in the drawer header (`landlord-sidebar.tsx`, `lg:hidden`), and a **scroll-lock** while
  the drawer is open (`lib/sidebar-context.tsx`).
- **Scroll-lock went through two iterations**: first pass used `overflow-hidden` toggled on `<body>`
  — worked on Chrome but left a stray backdrop-colored strip at the top/bottom of the screen on
  Safari after closing the menu (a known-unreliable technique on iOS specifically). Rewrote to the
  standard iOS-safe pattern: `position: fixed` + a negative `top` offset recording/restoring
  `window.scrollY`, instead of plain `overflow-hidden`.
- **That didn't fully fix it either** — user still saw the same stray strip on Safari (initially
  misreported as "Chrome", corrected to Safari). User found the actual cause via their own research:
  a known **Safari 26 "Liquid Glass" bug** with `position: fixed` overlays and safe-area/toolbar
  compositing (referenced a `mui/material-ui` GitHub issue, #46953, hitting the identical symptom —
  confirmed by fetching it). Real fix: **`app/layout.tsx` was missing a `viewport-fit=cover`
  viewport meta tag entirely** (no `export const viewport` existed before this) — without it,
  Safari's layout viewport doesn't extend into the safe-area regions at all, so fixed-position
  elements can't cover them. Added `export const viewport: Viewport = { width: "device-width",
  initialScale: 1, viewportFit: "cover" }`. Also made the drawer backdrop always-mounted (fades via
  `opacity`/`transition-opacity` instead of instant DOM add/remove) as a second mitigation for the
  same class of stale-paint-on-abrupt-removal issue. **Confirmed fixed on the user's real iPhone**
  against the live Vercel deployment: pull-to-refresh works, single natural bounce (no more double-
  bounce), sidebar "Free plan" card fits with no clipping, and the stray Safari backdrop strip is
  gone. Bug closed.
- User granted one-off exceptions to the standing guided-coding-mode rule twice this session (the
  `max-lg:` sidebar refactor, and the viewport-fit/backdrop fix) — explicitly said "change it
  yourself this time only" / "change it yourself" each time. Standing rule (user types application
  code, guided step-by-step) still applies by default; these were not a permanent change to that.
- Verified with `npx tsc --noEmit` after every step (always clean). In-browser verification used the
  Browser tool directly against the local dev server (logged in with real test creds) for the
  desktop sidebar bug and the drawer/backdrop mechanics — first time this session used live
  DOM/CSS inspection instead of relying on the user's own screenshots, and it's what actually cracked
  the sidebar clipping bug after CSS-reasoning-only guesses kept missing it.
- **Next step**: nothing open for this bug. Still open from the 2026-08-27 entry below: unit edit
  flow (blocked on backend update endpoint), `[unitId]/page.tsx` real content, `/landlord/tenants`
  wiring.

---

## 2026-08-27 — Claude (MacBook) built the forgot-password / reset-password flow

- Continuation of the same day's session below — picked up the "next step" note about a possible
  forgot-password feature. User typed every file by hand, guided step-by-step.
- **Verified before building, per this project's standing process**: checked the local backend's
  live Swagger spec (`http://localhost:5080/swagger/v1/swagger.json`) and confirmed both
  `POST /api/auth/forgot-password` (body `{ email }`) and `POST /api/auth/reset-password` (body
  `{ userId, token, newPassword }`, same `userId`/`token` convention as `confirm-email`) actually
  exist and got their real request schemas. Also curl-tested `forgot-password` directly with a
  fake, non-existent email — confirmed the backend already returns a generic
  `"If an account with that email exists, a password reset link has been sent."` (HTTP 200)
  regardless of whether the account exists, i.e. account-enumeration protection is already handled
  backend-side.
- **Compliance pass** (PIPEDA/CASL, federal only — no Ontario RTA/Manitoba RTB angle here, this
  isn't a tenancy-terms feature): frontend only collects `email` (forgot-password form) and
  `newPassword` (reset form) — no extra fields. The reset email is sent server-side and is
  transactional only (just the link), so CASL's consent/unsubscribe rules don't apply. The
  frontend's success message reuses the backend's own generic wording rather than ever branching on
  "account not found," matching the enumeration protection confirmed above.
- **New**: `app/(auth)/forgot-password/page.tsx` + `actions.ts` (email form, generic success/error
  message, no split brand-panel — lean utility page like `confirm-email`, not a primary entry point
  like login/register). `app/(auth)/reset-password/page.tsx` + `actions.ts` (reads `userId`/`token`
  from the URL exactly like `confirm-email/page.tsx`, shows "Invalid or expired reset link." if
  either is missing; on a failed reset, redirects back to itself with `userId`/`token` preserved in
  the URL so the form still works without re-clicking the email link). `login/page.tsx`: added a
  "Forgot password?" link and a `?reset=1` success message.
- **Bug caught before commit**: first pass at the login page edit nested the new "Forgot password?"
  `Link` *inside* the password field's `<div>` instead of after it — valid JSX, so `tsc` didn't
  catch it, would've just rendered the link squeezed under the input instead of as its own row
  before the submit button. Caught by inspection, fixed by moving the `</div>` up to close right
  after the password `<input>`.
- Verified with `npx tsc --noEmit` (zero errors) after each step, then **confirmed working
  end-to-end by the user on the live Vercel deployment** (`https://rentmanagement-liard.vercel.app`)
  against the real Azure-hosted backend — forgot-password → real email → reset link → new password
  set → logged in successfully with it.
- **Note for later**: this was verified against the local backend's Swagger spec and curl, and
  separately confirmed working live on Vercel/Azure — so both are known-good as of this entry. If a
  future session finds either environment's backend has changed, don't assume the other still
  matches.
- **Next step**: not yet decided. Open options carried over from the entry below: build the real
  unit edit flow once the backend adds a `PUT`/`PATCH` endpoint for units, give the still-stub
  `[unitId]/page.tsx` real content, or wire `/landlord/tenants` to the real backend.

---

## 2026-08-27 — Claude (MacBook) fixed the create-unit form gaps, listed real units on the property detail page, added View/Edit buttons

- Continuation of the session below (Claude/Windows) in the same day — picked up its four flagged
  `new-unit-form.tsx` gaps and its "verify before coding" units read-shape gap. User typed every
  file by hand, guided step-by-step.
- **Fixed all four flagged gaps in `[id]/units/new/new-unit-form.tsx`**: added the missing submit
  button (was only reachable via Enter), fixed `PageHeader` title from "Add property" to "Add
  unit", fixed the Asking Rent `<label>`'s `htmlFor` from `"postalCode"` to `"askingRent"`, and
  added `required` to the `bedrooms` field.
- **Confirmed the real read shape for a property's `units` array** by having the user open the app
  in-browser (real login, real dev server) and paste the actual `GET /api/properties/{id}` JSON
  for a property with a unit already on it — first time this was verified rather than guessed.
  Confirmed: each unit read-item has `id`, `label`, `unitType: string` (resolved name, same
  read/write split pattern as `Property`/`PropertyType` — write still sends `unitTypeId: number`
  via `CreateUnitInput`, unchanged), `bedrooms`, `bathrooms`, `squareFeet`, `askingRent`, and a new
  `status: string` field (e.g. `"Listed"`) not present anywhere in the types before.
- **`lib/types.ts`**: rewrote the previously-dead `Unit` interface (flagged dead in the entry
  below — it had been an exact duplicate of `CreateUnitInput`, `unitTypeId: number`, no `id`) to
  match the confirmed shape above (`unitType: string`, `status: string`, `id`). Changed
  `Property.units` from `unknown[]` to `Unit[]` — the last `unknown` in the codebase is gone, and
  `Unit` is no longer dead code (now consumed by `Property`).
- **`[id]/page.tsx`**: replaced the units section's plain `"N units"` count with an actual grid of
  unit cards (label, status pill — same `bg-accent-tint`/`text-accent-dark` style as the property
  badges — unit type, bed/bath/sqft line, formatted rent via `.toLocaleString()`), each with small
  View/Edit buttons. Caught and fixed a self-introduced bug along the way: the first pass at this
  edit didn't replace the existing ternary, it nested a second (unreachable) copy of it inside the
  `else` branch — `tsc` didn't catch it since both branches were valid JSX: dead code, not a type
  error. Fixed by collapsing back to a single ternary.
- **View/Edit buttons**: View links to the existing (still-stub, unrelated to this session)
  `[unitId]/page.tsx`. Edit links to a **new stub page**, `[unitId]/edit/page.tsx` — deliberately
  *not* a real edit form, because the local backend's live Swagger spec
  (`http://localhost:5080/swagger/v1/swagger.json`) has no `PUT`/`PATCH` route for units at all
  (checked directly, not assumed) and the user confirmed the backend doesn't have one yet either.
  Stub mirrors the exact existing "coming soon" placeholder pattern from
  `app/landlord/profile/page.tsx`.
- Verified with `npx tsc --noEmit` after each step (zero errors throughout, including through the
  ternary-duplication bug above, since it wasn't a type error) plus a final check after all changes
  landed. Visual/in-browser check for this session's changes was done by the user directly on
  their own already-running local dev server (port 3000) rather than a separate Claude-driven
  preview session.
- **Next step**: build the real unit edit flow once the backend adds an update endpoint for units
  (`PUT`/`PATCH /api/properties/units/{unitId}` or similar — re-check the Swagger spec, don't
  assume the route name). Until then: the still-stub `[unitId]/page.tsx` (real unit detail content,
  same `GET /api/properties/units/{unitId}` endpoint already confirmed to exist) or wiring
  `/landlord/tenants` to the real backend are both open, unstarted. User is now considering a
  forgot-password flow as a possible next feature — not started, needs the real backend endpoint
  confirmed first (same "verify before coding" process as everything above) before any code is
  written, and should get the usual Canadian/PIPEDA compliance pass per `AGENTS.md` given it deals
  with account recovery / user identity.

---

## 2026-08-27 — Claude (Windows) built the create-unit flow and redesigned the properties pages

- User typed every file by hand, guided step-by-step.
- New create-unit flow, associated with its parent property via the URL rather than the request
  body (mirrors the backend's real endpoint, `POST /api/properties/{propertyId}/units`, confirmed
  in the entry below): routes moved from a flat, ID-less `app/landlord/properties/units/new/` to
  `app/landlord/properties/[id]/units/new/` (the still-stub unit detail page moved alongside it, to
  `units/[unitId]/page.tsx`, renamed from `[id]` to avoid two same-named dynamic segments in one
  path). `createUnitAction` added to `app/landlord/properties/actions.ts`, reading `propertyId`
  from a hidden form field and posting to `/api/properties/${propertyId}/units`.
- `lib/types.ts`: added `CreateUnitInput` (write shape, no `propertyId` field — that travels in the
  URL, not the body, same read/write split reasoning as `CreatePropertyInput`/`Property`) and
  `UnitType` (`{id, name}`, mirrors `PropertyType`). Also ended up with a `Unit` interface with an
  identical shape to `CreateUnitInput` (typed as a separate addition instead of a rename as
  intended) — **dead/duplicate, not used anywhere, worth deleting**.
- Unit type dropdown wired to a real backend endpoint the user confirmed: `GET
  /api/properties/unit-types` (new `lib/unit-types.ts`, `getUnitTypes()`, mirrors
  `lib/property-types.ts`).
- Redesigned both properties pages to surface fields that already existed on `Property` but were
  never rendered (`propertyType`, `units.length`): the list page
  (`app/landlord/properties/page.tsx`) gained a 3-tile stats strip (Properties/Total units/Cities,
  all real counts from fetched data, no fabricated numbers) and its row-list became a card grid via
  a new client component (`properties-grid.tsx`) with a live client-side search box (filters by
  name/city, no refetch) and per-card "Add unit"/"View" buttons. The detail page (`[id]/page.tsx`)
  gained a two-column card layout, a property-type badge, a units count with an empty-state "Add
  the first one" link, and a header "Add unit" action button.
- **Known gap, not yet fixed:** `[id]/units/new/new-unit-form.tsx` is missing a submit button
  entirely (only reachable by pressing Enter in a text field) and still has two leftover copy/paste
  bugs from the property form it was based on — the `PageHeader` still reads "Add property" instead
  of "Add unit", and the Asking Rent `<label>`'s `htmlFor` still points at `"postalCode"` instead of
  `"askingRent"`. `bedrooms` is also still missing `required` (inconsistent with the other three
  number fields). None of these are type errors, so `tsc` doesn't catch them.
- Verified with `npx tsc --noEmit` (zero errors) after each step. **Not yet verified in-browser** —
  the create-unit flow hasn't been exercised against the real backend yet, partly blocked by the
  missing submit button above.
- **Next step:** fix the three `new-unit-form.tsx` gaps above, delete the dead `Unit` type, then
  verify the full create-unit flow end-to-end in-browser against the real backend. After that:
  render an actual unit list on the detail page (currently just a count, since the backend's
  per-unit read shape is still unconfirmed — same "verify before coding" gap noted for the property
  read/write split below).

---

## 2026-08-26 — Claude (MacBook) wired `/landlord/properties` to the real ASP.NET backend

- User typed every file by hand, guided step-by-step. Replaced the local mock store
  (`lib/data/store.ts`, deleted — confirmed zero remaining importers before removal) with real
  calls to the backend, discovered by reading the live OpenAPI spec directly
  (`http://localhost:5080/swagger/v1/swagger.json` — the Azure instance's `/swagger` route was
  inaccessible from this session, but the user's local backend instance's spec worked) since
  nothing in this repo had documented the properties endpoints before.
- **Endpoints found**: `POST /api/properties` (create, returns just `{ propertyId: number }`, no
  full entity), `GET /api/properties/mine` (list, already scoped to the logged-in landlord — no
  manual filtering needed), `GET /api/properties/{propertyId}` (single), `GET
  /api/properties/property-types` (real property types — replaces the old hardcoded, TODO-flagged
  `lib/property-types.ts` list entirely). Property IDs are backend-assigned **integers**, not the
  frontend's old `crypto.randomUUID()` strings.
- **Read vs. write shape mismatch discovered**: creating a property takes `propertyTypeId: number`,
  but listing/reading one returns `propertyType: string` (the resolved type name, e.g.
  `"SingleFamilyHouse"`) — no `propertyTypeId` in the read shape at all. Split `lib/types.ts`'s old
  single `Property` interface into three: `Property` (read shape, `id: number`, `propertyType:
  string`, plus a `units: unknown[]` array not yet used by any UI), `CreatePropertyInput` (write
  shape, `propertyTypeId: number`), and `PropertyType` (`{id, name}`, for the type dropdown).
- **New `lib/api-client.ts`**: a minimal `backendFetch(path, token, init)` helper — prefixes
  `BACKEND_API_URL`, attaches `Authorization: Bearer <token>`. First real use of a bearer token
  against the backend anywhere in this app.
- **This exposed and fixed a real gap flagged in yesterday's session-JWT rewrite discussion**: the
  backend's own login JWT (in the login response's `token` field, confirmed via the user's own
  curl test) was being silently discarded — nothing after login ever needed it, since no real
  backend calls existed yet. Added `backendToken?: string` to `SessionUser` (`lib/types.ts`) and
  populated it at login (`app/(auth)/login/actions.ts`) so it rides inside our own signed session
  JWT, retrievable server-side for every backend call. Added `requireBackendToken()` in
  `lib/auth-guard.ts` — wraps `requireAuth()`, additionally redirects to `/login` if
  `backendToken` is missing (covers anyone with a session predating this change).
- **Two unrelated real bugs found and fixed in passing** while wiring the token capture:
  (1) `app/(auth)/login/actions.ts` read `data.name` for the session's display name, but the real
  backend field is `data.fullName` — `SessionUser.name` had been `undefined` in every session since
  login was first wired up (2026-08-23). Renamed the field to `fullName` throughout
  (`lib/types.ts`, `lib/session.ts`, `app/landlord/page.tsx`) and fixed the source read. (2) User
  briefly set `SESSION_SECRET` to the well-known example JWT from jwt.io's homepage while testing —
  caught and rotated before it reached Vercel; see the entry directly below for the full story.
- **Rewired, all now hitting the real backend**: `app/landlord/properties/page.tsx` (list, via
  `GET /mine`), `app/landlord/properties/actions.ts` (`createPropertyAction`, via `POST`),
  `app/landlord/properties/[id]/page.tsx` (detail, via `GET /{id}`), `lib/property-types.ts`
  (rewritten from a hardcoded array to `getPropertyTypes(token)`), `app/landlord/page.tsx`
  (dashboard's Properties KPI count and "Your properties" preview list). Split
  `app/landlord/properties/new/page.tsx` into a server component (fetches real property types,
  calls `requireBackendToken`) plus a new `new-property-form.tsx` client component (keeps the
  existing live-preview `useState` behavior, now driven by fetched types instead of the hardcoded
  list).
- **Verified end-to-end locally** (real backend, not mocked): typechecked clean (`npx tsc
  --noEmit`), then in-browser — properties list shows real backend data, detail page for an
  existing property renders correctly, and a brand-new property was created through the actual
  form (not curl) and correctly appeared in both the properties list and the dashboard's KPI count
  (2) and preview list immediately after. Zero console errors.
- **Not yet done**: the single-property response shape (`GET /api/properties/{id}`) was inferred
  to match the list item shape rather than confirmed against a real captured sample before writing
  the code — it worked in the live test, so this is now confirmed correct, but worth noting the
  process gap for next time. Units (`POST /api/properties/{propertyId}/units`, `GET
  /api/properties/units/{unitId}`) exist on the backend but have no UI yet. Tenants still use
  fully separate, unrelated mock data (`Tenant` type only, no store or pages wired).
- **Next step**: decide whether to build unit management next (natural follow-on, backend already
  supports it), or move to wiring `/landlord/tenants` the same way.

---

## 2026-08-26 — Claude (MacBook) caught and rotated an insecure `SESSION_SECRET`

- While discussing HS256 vs HS512 for the session JWT (see entry below), the user pasted a new
  `SESSION_SECRET` value into `.env.local` that turned out to be **the well-known example JWT from
  jwt.io's homepage** (`eyJhbGc...` decoding to `{"sub":"1234567890","name":"John Doe",...}`), not
  an actual secret — an easy mix-up since both are long base64-looking strings, but this one is
  public knowledge copied into tutorials/screenshots everywhere. Using it as the HMAC signing key
  would have let anyone forge a valid session cookie (e.g. claim `role: "Admin"`) without ever
  needing a real password, since `lib/session.ts`'s `getSecretKey()` only checks that the env var
  is non-empty, not that it's actually secret.
- Generated a fresh random 32-byte secret (`crypto.randomBytes(32).toString('base64')`), replaced
  the compromised value in local `.env.local`, and had the user update the same value in Vercel's
  production environment variables.
- Verified on the live deployment (`https://rentmanagement-liard.vercel.app`): logged in fresh
  (old sessions signed with the leaked secret are now correctly invalid), refreshed, stayed on
  `/landlord` — confirms the new secret is live and session verification still works end-to-end.
- Algorithm stays **HS256** (not HS512) per the same discussion — HS256 already gives a 128-bit
  security level, sufficient here; HS512's only difference is a larger security margin and bigger
  token/key, not a meaningful practical improvement for a session cookie, and the user had no
  specific reason (compliance, interop) requiring it.
- **Lesson for future sessions:** never copy a `SESSION_SECRET`/signing-key value from a website,
  tutorial, or JWT decoder example — always generate fresh random bytes. Worth a quick sanity check
  any time a secret value is pasted in rather than generated.
- **Next step:** none open for this. `SESSION_SECRET` is confirmed matching between local and
  Vercel, both verified working live.

---

## 2026-08-26 — Claude (MacBook) fixed the "logged out on refresh" bug on the live server by finishing the JWT session rewrite

- User reported: after logging in on the deployed (Vercel) site, refreshing the page logged them
  back out. Root cause: `lib/session.ts` stored sessions in a plain in-memory `Map`
  (`globalThis.__sessions`), scoped to a single Node process — the cookie only held a random
  token, with the actual user data living only in that `Map`. On localhost this is invisible (one
  long-lived dev process), but on Vercel's serverless platform, requests can land on different
  ephemeral function instances, so the instance handling a refresh often doesn't have the token
  from the instance that handled login — `getSessionUser()` returns nothing, `requireAuth()` sees
  `null`, and the user is bounced to `/login`.
- This is exactly the unfinished JWT rewrite flagged as "found but NOT fixed" in the 2026-08-24
  entry below — that version was left uncommitted because `getSecretKey()`/equivalent had **no
  validation** on a missing `SESSION_SECRET`, which would've silently signed with an empty key
  (anyone could forge a session). Rewrote `lib/session.ts` from scratch (not recovered from any
  git history — the old WIP was never committed anywhere, confirmed via `git log --all`, branches,
  stash, reflog — all came up empty) using `jose` (`SignJWT`/`jwtVerify`, already a dependency)
  with a hard `throw` in `getSecretKey()` if `SESSION_SECRET` is unset, so a missing secret fails
  loudly at request time instead of silently weakening security.
- Session is now fully stateless: the JWT itself (containing `id`/`email`/`name`/`role`, 8-hour
  expiry) is the cookie value — no server-side store at all, so it works identically regardless of
  which serverless instance handles a given request. `createSession`/`getSessionUser` are now
  `async`; updated their two call sites (`app/(auth)/login/actions.ts`,
  `lib/get-session.ts`) to `await` them. `deleteSession()` is now a no-op stub (kept for call-site
  compatibility in `app/actions.ts`'s `logoutAction`) — actual logout is just the existing
  `cookieStore.delete(SESSION_COOKIE_NAME)` right after it.
- Added `SESSION_SECRET` (random 32-byte value) to local `.env.local`; user confirmed it is already
  set in Vercel's production environment variables.
- Verified with `npx tsc --noEmit` (zero errors) and in-browser locally (login succeeds, lands on
  `/landlord`, `session_token` cookie correctly invisible to `document.cookie` since it's
  `httpOnly`). Full proof of the fix — surviving a serverless instance swap — is being verified on
  the actual Vercel deployment as this entry is written, since a local refresh alone (same
  long-lived dev process) can't reproduce the original bug.
- **Confirmed fixed** on the live deployment (`https://rentmanagement-liard.vercel.app`): logged
  in, landed on `/landlord`, then did a full server round-trip navigation back to `/landlord`
  (equivalent to a hard refresh) — stayed on the dashboard, no bounce to `/login`. Bug closed.
- **Next step:** none for this bug. Minor cleanup still open: `lib/get-session.ts` and
  `lib/session.ts` are missing trailing newlines (pre-existing, not touched this session); a
  console 404 for `/landlord/tenants` prefetching is expected/unrelated — that page doesn't exist
  yet (see earlier entries).

---

## 2026-08-26 — Claude (Windows) implemented the landlord shell redesign (sidebar, header, dashboard)

- Followed on from Antigravity's exploration below — mocked the design up interactively first
  (visualize tool, several rounds of feedback) before writing any real code, then built it guided
  step-by-step; user typed every file by hand and verified after each piece.
- **Brand colors** (`app/globals.css`): added `--brand-blue` (`#1565c0`), `--brand-green`
  (`#2ecc8e`), `--brand-green-dark` (`#0f8a5f`), `--brand-green-tint` (`#e7faf1`) as new `@theme
  inline` tokens (`bg-brand-blue`, `text-brand-green-dark`, etc.), matching the real DomusPRO logo
  colors. Note this is a **separate token set from the existing `--accent`** (`#3358d6`, used by
  the marketing site) — the landlord portal never consumed `--accent` in the first place (it
  hardcoded raw Tailwind `blue-600`), so this doesn't touch/replace that system, just gives the
  landlord portal its own on-brand palette where it previously hardcoded arbitrary blues.
- **Logo wired in** (`components/landlord-sidebar.tsx`): swapped the old icon+text pairing for the
  real `public/domuspro-logo.png` (user-provided this session) via `next/image`. Found but did
  **not** use `public/domuspro-logo-hq.svg` — an unused, uncommitted wordmark SVG already sitting
  in `public/` from some earlier point, visually the same logo. Left as-is, untracked; worth
  clarifying later whether it should replace the PNG or be deleted as a duplicate.
- **Sidebar rebuilt**: removed the border under the logo at `lg:` (desktop) only — the header row's
  own border now reads as one continuous line since both sit in the same grid row (mobile keeps its
  border, since the drawer still needs a break between logo and nav there). Removed the "{role}
  Portal" badge (moved to the header). Replaced the old "logged in as / sign out" card at the
  bottom with a "Free plan / View plans" card. Added simple inline-SVG nav icons (dashboard/
  properties/tenants), no new icon library.
- **New `components/account-menu.tsx`** (client component): notifications bell (decorative only —
  no real notification system exists yet), an "Upgrade" link, and an avatar-initials dropdown
  (click-outside-to-close via a `mousedown` listener) holding Profile/Settings/Sign out —
  `logoutAction` moved here from the sidebar. Rendered in **both** the desktop header row and the
  mobile inline header in `app/landlord/layout.tsx`, since sign-out no longer lives in the sidebar
  drawer at all.
- **Three stub pages added** (`/landlord/profile`, `/landlord/settings`, `/landlord/billing`) so
  the dropdown/upgrade links the header now has don't 404 — same "coming soon" placeholder pattern
  as the pre-existing `/landlord/tenants` gap. None have real content yet.
- **Dashboard content** (`app/landlord/page.tsx`): added a welcome banner (gradient backdrop + a
  generic house illustration, per Antigravity's requirement below for the no-image-uploaded case)
  with the "Add property" CTA moved into it; trimmed 4 KPI cards down to 3 (Properties, Occupancy,
  Revenue — dropped "Maintenance & alerts", which always showed a fake `0`); recolored the page's
  hardcoded blues/greens to the new `brand-*` tokens.
- **Responsive pass**: role badge and "Upgrade" button in `AccountMenu` now hide below `sm`
  (640px) to avoid crowding the mobile header next to the hamburger button; `PageHeaderSlot`'s
  title now truncates and shrinks a step on mobile (user also dropped the description line
  entirely from `PageHeaderSlot`, simplifying it further); fixed an asymmetric-padding bug in
  `app/landlord/layout.tsx`'s mobile header wrapper (`pt-8` with no bottom padding, pre-existing
  but only visually obvious once the header content got shorter) — changed to `py-6` so the header
  row sits centered in its bar instead of hugging the bottom border.
- Not yet done / known gaps: notification bell has no real backend; Profile/Settings/Billing pages
  are empty placeholders; the "Active" status pill on property rows is still hardcoded (pre-existing,
  not addressed this session — `Property` has no status field); the public marketing site
  (`components/site-header.tsx`, `public/logo.svg`/`logo-sm.svg`) still uses the **old** logo/blue
  (`#004eeb` skyscraper monogram) — not updated to match the new brand colors, since this session
  was scoped to the landlord portal only.
- **Next step:** decide whether to extend the new brand colors/logo to the public marketing site
  and `/login`/`/register` pages for consistency, resolve the unused `domuspro-logo-hq.svg` vs
  `domuspro-logo.png` duplication, and eventually give Profile/Settings/Billing real content.

---

## 2026-08-26 — Antigravity (Windows) explored Landlord Dashboard redesign options & refined requirements

- Explored dashboard redesign directions for `app/landlord/page.tsx`:
  1. Clean Modern SaaS style (4 KPI cards + property list + quick action & compliance hub).
  2. Bento Grid style (high-density modular tiles).
  3. Playful Vibrant style (circular occupancy progress rings).
  4. Modern Eye-Catchy with vibrant mesh gradient welcome banner (`bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700`).
- **User design requirements clarified:**
  - When no property image is uploaded: display a clean, tasteful generic architectural house illustration header with a subtle gradient backdrop.
  - Buttons must be **simple and decent** (clean solid blue for primary `+ Add Property`, subtle outlined/gray-bordered buttons for card actions).
  - Modern and eye-catchy yet clean and super user-friendly with zero clutter (3 clean KPI metrics: Properties, Occupancy, Revenue).
- Standalone HTML visual layout drafted for `app/landlord/page.tsx`.
- **Next step:** In the new session, guide the user to implement the refined `app/landlord/page.tsx` dashboard code incorporating the generic house placeholder and decent button styling.

---

## 2026-08-26 — Claude (MacBook) fixed TypeScript build errors from the incomplete Property type migration

- `lib/types.ts`'s `Property` type was changed to match the real backend JSON shape earlier
  (`name`/`line1`/`line2`/`city`/`region`/`postalCode`/`country`) but three consumers
  (`app/landlord/page.tsx`, `app/landlord/properties/page.tsx`,
  `app/landlord/properties/[id]/page.tsx`) were never updated and still referenced the old
  `address`/`rentAmount` fields — caught by `npx tsc --noEmit`, not by the dev server (Turbopack
  dev doesn't block rendering on type errors, only `tsc`/production builds do).
- Also found: `Property` still had a leftover, unused `rentAmount: number` **required** field
  tacked onto the end of the interface from the old shape — removed entirely, since there's no
  rent data anywhere in the real backend's property model right now. Everywhere rent was
  displayed, either removed the line entirely (property list rows) or replaced with an honest
  "&mdash; rent data not tracked yet" placeholder (dashboard KPI card) rather than showing `$0` or
  fabricating a number.
- Same pass also fixed several leftover `/admin/...` links in `app/landlord/page.tsx` (View all,
  empty-state Add Property, Quick Actions) to `/landlord/...` — dead links from the route rename
  that predates this session. Note `/landlord/tenants` doesn't exist as a page yet (same as the
  sidebar's own Tenants link) — those links point there anyway for consistency, will 404 until
  that page is built.
- Verified with `npx tsc --noEmit` (zero errors) and in-browser (dashboard renders, no console
  errors).
- **Next step:** still the colorful redesign confirmation from the previous entry, plus building
  `/landlord/tenants` at some point.

## 2026-08-26 — Claude (MacBook) rebuilt the landlord shell as a true responsive grid; explored a colorful redesign (not yet built)

- User typed every file by hand, guided step-by-step. Long session — summarizing the end state,
  see conversation history for the full debugging trail if needed.
- **Root problem solved:** the page header (title/description) and the sidebar's brand-box header
  needed to align in height, and the whole shell needed to become responsive (sidebar was a fixed
  `w-64` block with zero mobile support). A `position: sticky` approach was tried first and hit
  multiple real bugs (padding gap letting content bleed through, then a `display:contents`-driven
  height mismatch) before landing on the actual correct architecture below.
- **New architecture — React Context "reporting" pattern** (first use of Context in this project):
  - `lib/page-header-context.tsx`: `PageHeaderProvider` + two hooks — `usePageHeader(data)` (called
    by pages, via `useEffect`, to report their title/description/action) and `usePageHeaderValue()`
    (called by the layout, to read the current page's header).
  - `components/page-header.tsx`: rewritten from "renders the header" to "reports it" — same props,
    renders `null`. Existing pages calling `<PageHeader title=... />` needed zero changes.
  - `components/page-header-slot.tsx` (new): the actual visual header markup, reading from context.
    Rendered in **two places** — once in a real grid row for desktop, once inline inside `<main>`
    for mobile (no grid there) — both read the same context value.
  - `components/landlord-sidebar.tsx`: rewritten to use `lg:contents` — below `lg:`, a normal fixed
    sliding drawer (border/bg/transform all real); at `lg:` and up, `display:contents` makes the
    wrapper vanish and its two children (brand-box, nav+logout) become **independent grid items**
    with explicit `lg:row-start-{1,2}` placement, in the *same* grid rows as the header row and the
    scrollable content row respectively. This is what actually guarantees alignment — both cells in
    a grid row are automatically the same height, no manual pixel matching, ever.
  - `lib/sidebar-context.tsx` + `components/menu-toggle-button.tsx`: same Context pattern again, for
    the mobile hamburger toggle — needed because the button (in the header) and the drawer (in
    `LandlordSidebar`) are siblings, not parent/child.
  - `app/landlord/layout.tsx`: rebuilt as the actual 2×2 grid (`grid-cols-[256px_1fr]
    grid-rows-[auto_1fr]`), wrapped in both providers.
- **Verified precisely** (not just visually) after a full dev-server restart cleared a Turbopack
  stale-module-graph issue (new files a plain browser reload didn't pick up): sidebar brand-box and
  header cell both exactly 99px tall (`rowsAligned: true`), sidebar background genuinely white vs
  content's slate-50, 32px gap between header and content. Mobile drawer + hamburger toggle also
  confirmed working.
- **Real bugs hit and fixed along the way**, worth remembering as a class of issue: (1) killing the
  dev server by `lsof -ti :3000` PID was briefly dangerous — that port query also returned unrelated
  Chrome/Claude helper process PIDs; always cross-check with `ps` before killing. (2) A generic
  `computer.scroll` browser-automation click/Enter-key wasn't reliably triggering real form
  submission in testing (unrelated to app code) — `form.requestSubmit()` via JS worked reliably
  instead. (3) A temporary file-based debug log (`fs.appendFileSync` in Server Actions) was used to
  diagnose the login redirect loop when neither browser console nor network tab surfaced enough —
  removed again once done; a full server-log-to-file approach (`nohup npm run dev > /tmp/dev-server.log`)
  turned out simpler for all debugging after that.
- Property type list is still a hardcoded placeholder (`lib/property-types.ts`) — **still waiting**
  on the user to confirm where real property types should come from (no backend endpoint found by
  probing; may need to be built backend-side, or just documented as a fixed enum like `UserType`).
- **Colorful redesign — explored extensively via mockups only, NOT implemented in real code yet.**
  User wants the whole app's visual style changed, more vibrant/energetic. Explored three distinct
  directions via the `visualize` tool (mockups only, no app code touched): (1) a muted
  semantic-color-per-category palette — rejected as "boring"; (2) a "Boardto"-reference style — big
  saturated circular icon badges, pill filters, floating `+` button, soft background blobs; (3) a
  language-learning-app-reference style — big full-color property cards with a decorative oversized
  icon + circular occupancy-percentage progress ring, stats panel with left-accent-bar tiles, bar
  chart. Landed on a **combined full-page mockup** (sidebar + top header with search/notification/add
  + stat tiles + property cards with rings + upcoming list) that the user seemed to like, explicitly
  **light-mode only** (fixed hex colors, not theme-adaptive tokens — matches this app having no dark
  mode at all currently). **Not yet confirmed as fully final, and zero real implementation exists**
  — next session should re-show the last mockup for final go-ahead before writing any code, then
  redo the design-token/component foundation (colors, card radius, icon-badge pattern) before
  touching individual pages.
- **Next step:** get final confirmation on the colorful redesign direction, then start with shared
  foundation (design tokens + `PageHeaderSlot`/card/button base styles) before applying to
  individual pages, per the user's own stated preference for that sequencing earlier.

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
