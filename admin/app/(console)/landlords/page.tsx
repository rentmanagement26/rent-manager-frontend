import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BulkBar, BulkSelectionProvider, RowCheckbox, SelectAllCheckbox } from "@/components/console/bulk-select";
import { ChangePlanButton } from "@/components/console/change-plan";
import { ProposalStatus } from "@/components/console/proposal-status";
import { ProposalWatcher } from "@/components/console/proposal-watcher";
import { Notice, Pill, cardClass, inputClass, secondaryButtonClass } from "@/components/console/ui";
import { requireAdmin } from "@/lib/auth-guard";
import { getPermissions, PERMISSIONS } from "@/lib/permissions";
import { initials } from "@/lib/format";
import { getAwaitingProposals, getRolloutStatuses } from "@/lib/proposal-api";
import { getSubscriptionList } from "@/lib/subscription-list-api";
import { getLandlords, getPackages } from "@/lib/subscription-api";

export const metadata: Metadata = { title: "Landlords" };

const PAGE_SIZE = 25;

interface SearchParams {
  search?: string;
  before?: string;
  plan?: string;
  terms?: string;
  status?: string;
  page?: string;
}

type RolloutStatus = "told" | "queued" | "chose_to_stay";

// One row of the list, whichever endpoint it came from (the full list, or the filtered one that only holds landlords on a plan).
interface Row {
  landlordProfileId: number;
  name: string;
  businessName: string | null;
  email: string | null;
  isActive: boolean;
  planName: string | null;
  planStatus: string | null;
  onOlderTerms: boolean;
  rollout?: RolloutStatus;
  proposal?: { changeId: number; expiresAt: string | null };
}

// Plan status from the backend ("Active", ...). Anything other than Active is flagged in amber.
function statusClass(status: string) {
  return status === "Active" ? "bg-c-ok text-c-okt" : "bg-c-wr text-c-wrt";
}

// Pill for a landlord whose plan is being changed in a rollout.
const ROLLOUT_STYLE = {
  told: { label: "Told", className: "bg-c-aci text-c-act2" },
  queued: { label: "Queued", className: "bg-c-sf2 text-c-tx2" },
  chose_to_stay: { label: "Chose to stay", className: "bg-c-ok text-c-okt" },
} as const;

// Keeps only the values the backend accepts, so a hand-edited URL can't send nonsense.
function pick<T extends string>(value: string | undefined, allowed: readonly T[]): T | undefined {
  return allowed.find((a) => a === value);
}

// Desktop columns. With bulk selection there is a checkbox column first.
const COLUMNS_WITH_BOX = "sm:grid-cols-[24px_minmax(0,1fr)_150px_170px_140px]";
const COLUMNS_NO_BOX = "sm:grid-cols-[minmax(0,1fr)_150px_170px_140px]";

function LandlordRow({
  row,
  changePlan,
  selectBox,
  columns,
  canWithdraw,
}: {
  row: Row;
  // The "Propose plan" button, or null when this admin can't change plans.
  changePlan: React.ReactNode;
  // The row's checkbox, or null when this admin can't change plans.
  selectBox: React.ReactNode;
  columns: string;
  canWithdraw: boolean;
}) {
  return (
    // Phone: stacked. Desktop: fixed columns, so the Plan and Action columns line up on every row.
    <li className={`flex flex-col gap-3 rounded-2xl px-3 py-3 hover:bg-c-sf2 sm:grid sm:items-center sm:gap-4 ${columns}`}>
      {selectBox && <div>{selectBox}</div>}
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-c-aci text-xs font-medium text-c-act2">
          {initials(row.name)}
        </div>
        {/* The name is a link to this landlord's detail page (plan, usage, overrides, history). */}
        <Link href={`/landlords/${row.landlordProfileId}`} className="min-w-0 hover:underline">
          <div className="truncate text-sm font-medium">{row.businessName || row.name}</div>
          <div className="truncate text-xs text-c-tx2">
            {row.businessName ? `${row.name} · ` : ""}
            {row.email ?? "No email"}
          </div>
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {row.planName ? <Pill className="bg-c-sf2 text-c-tx">{row.planName}</Pill> : <Pill className="bg-c-sf2 text-c-tx3">No plan</Pill>}
        {row.onOlderTerms && <Pill className="bg-c-pu text-c-put">older terms</Pill>}
      </div>

      {/* A switched-off account is flagged first; then an open proposal; then a rollout; otherwise the plan status. */}
      <div>
        {!row.isActive ? (
          <Pill className="bg-c-bad text-c-badt">Deactivated</Pill>
        ) : row.proposal ? (
          <ProposalStatus changeId={row.proposal.changeId} expiresAt={row.proposal.expiresAt} canWithdraw={canWithdraw} />
        ) : row.rollout ? (
          <Pill className={ROLLOUT_STYLE[row.rollout].className}>{ROLLOUT_STYLE[row.rollout].label}</Pill>
        ) : (
          row.planStatus && <Pill className={statusClass(row.planStatus)}>{row.planStatus}</Pill>
        )}
      </div>

      <div>{changePlan}</div>
    </li>
  );
}

export default async function LandlordsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await requireAdmin();
  const params = await searchParams;

  const search = params.search?.trim().slice(0, 100) || undefined;
  const beforeId = Number(params.before) > 0 ? Number(params.before) : undefined;
  const terms = pick(params.terms, ["older", "newest"] as const);
  const status = pick(params.status, ["told", "queued", "chose_to_stay", "proposed", "none"] as const);
  const page = Number(params.page) >= 1 ? Math.floor(Number(params.page)) : 1;

  const packages = await getPackages(session.backendToken);
  if (packages.status === "expired") redirect("/session-expired");
  // The plan filter must be one of the real plans.
  const planId = packages.status === "ok" ? packages.data.find((p) => String(p.packageId) === params.plan)?.packageId : undefined;

  // With a plan, terms or status filter the list comes from the subscriptions endpoint (only landlords that are on a plan).
  // Without one it is the full landlords list, which also holds landlords with no plan yet.
  const filtered = planId !== undefined || terms !== undefined || status !== undefined;

  const [fullList, filteredList, awaitingResult, rolloutStatuses] = await Promise.all([
    filtered ? null : getLandlords(session.backendToken, { search, beforeId, limit: PAGE_SIZE }),
    filtered ? getSubscriptionList(session.backendToken, { search, planId, terms, status, page }) : null,
    getAwaitingProposals(session.backendToken), // landlords who have not answered a plan proposal yet
    getRolloutStatuses(session.backendToken), // landlords with a planned plan change: told, queued or chose to stay
  ]);

  const listResult = filtered ? filteredList! : fullList!;
  if (listResult.status === "expired" || awaitingResult.status === "expired") redirect("/session-expired");

  // Buttons follow the admin's real permissions. The backend enforces them as well.
  const { can } = await getPermissions(session);
  const canChangePlan = can(PERMISSIONS.subscriptionsChange) && packages.status === "ok";
  const awaiting = awaitingResult.status === "ok" ? awaitingResult.data : [];
  const awaitingByLandlord = new Map(awaiting.map((p) => [p.landlordProfileId, p]));

  // Turn whichever answer arrived into rows.
  let rows: Row[] = [];
  if (filtered && filteredList?.status === "ok") {
    rows = filteredList.data.items.map((item) => ({
      landlordProfileId: item.landlordProfileId,
      name: item.name,
      businessName: item.businessName,
      email: item.email,
      isActive: item.isActive,
      planName: item.packageName,
      planStatus: null,
      onOlderTerms: item.onOlderTerms,
      rollout: (["told", "queued", "chose_to_stay"] as const).find((s) => s === item.change?.status),
      proposal: item.proposal ? { changeId: item.proposal.id, expiresAt: item.proposal.expiresAt } : undefined,
    }));
  } else if (!filtered && fullList?.status === "ok") {
    rows = fullList.data.items.map((item) => {
      const open = awaitingByLandlord.get(item.landlordProfileId);
      return {
        landlordProfileId: item.landlordProfileId,
        name: item.name,
        businessName: item.businessName,
        email: item.email,
        isActive: item.isActive,
        planName: item.planName,
        planStatus: item.planStatus,
        onOlderTerms: false,
        rollout: rolloutStatuses.get(item.landlordProfileId),
        proposal: open ? { changeId: open.changeId, expiresAt: open.expiresAt } : undefined,
      };
    });
  }

  // Builds a link to this page with some filters changed, keeping the others. Changing a filter goes back to the first page.
  function href(changes: Partial<Record<keyof SearchParams, string>>) {
    const next: Record<string, string | undefined> = {
      search,
      plan: planId ? String(planId) : undefined,
      terms,
      status,
      ...changes,
    };
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) if (value) query.set(key, value);
    return `/landlords?${query}`;
  }

  const columns = canChangePlan ? COLUMNS_WITH_BOX : COLUMNS_NO_BOX;
  const people = rows.map((r) => ({ id: r.landlordProfileId, name: r.businessName || r.name }));
  const selectNote = filtered
    ? "Showing landlords that are on a plan. Clear the filters to see everyone, including landlords with no plan yet."
    : null;

  return (
    <div className="flex max-w-5xl flex-col gap-5">
      <div className="animate-up">
        <h1 className="text-2xl font-medium tracking-tight">Landlords</h1>
        <p className="mt-1 text-c-tx2">See each landlord&apos;s plan and propose a different one. They approve it before it changes.</p>
      </div>

      <section className={`${cardClass} animate-up`} style={{ animationDelay: "0.06s" }}>
        {/* A plain GET form: every filter lives in the URL, so no JavaScript is needed. */}
        <form action="/landlords" className="mb-4 flex flex-col gap-3">
          <div className="flex gap-2">
            <label className="relative flex-1">
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-c-tx3" />
              <input name="search" defaultValue={search} placeholder="Search by name, business or email" className={`${inputClass} pl-10`} />
            </label>
            <button type="submit" className={secondaryButtonClass}>
              Search
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select name="plan" defaultValue={planId ? String(planId) : ""} aria-label="Plan" className="h-8 rounded-[10px] border border-c-bd2 bg-c-bg px-2">
              <option value="">Plan: All</option>
              {packages.status === "ok" &&
                packages.data.map((p) => (
                  <option key={p.packageId} value={p.packageId}>
                    {p.name}
                  </option>
                ))}
            </select>
            <select name="terms" defaultValue={terms ?? ""} aria-label="Terms" className="h-8 rounded-[10px] border border-c-bd2 bg-c-bg px-2">
              <option value="">Terms: All</option>
              <option value="older">Older terms</option>
              <option value="newest">Newest terms</option>
            </select>
            <select name="status" defaultValue={status ?? ""} aria-label="Plan change status" className="h-8 rounded-[10px] border border-c-bd2 bg-c-bg px-2">
              <option value="">Plan change: All</option>
              <option value="proposed">Proposed</option>
              <option value="told">Told</option>
              <option value="queued">Queued</option>
              <option value="chose_to_stay">Chose to stay</option>
              <option value="none">None</option>
            </select>
            <button type="submit" className={`${secondaryButtonClass} h-8 px-3 text-xs`}>
              Apply
            </button>
            {filtered && (
              <Link href={search ? `/landlords?search=${encodeURIComponent(search)}` : "/landlords"} className="text-c-act2 hover:underline">
                Clear filters
              </Link>
            )}
          </div>
        </form>
        {selectNote && <p className="mb-3 text-xs text-c-tx3">{selectNote}</p>}

        {listResult.status !== "ok" ? (
          <Notice>
            {listResult.status === "forbidden"
              ? "Your role doesn't have access to landlords."
              : "Couldn't load landlords right now. Refresh to try again."}
          </Notice>
        ) : rows.length === 0 ? (
          <Notice>{search || filtered ? "No landlords match that." : "No landlords yet."}</Notice>
        ) : (
          <BulkSelectionProvider>
            {canChangePlan && packages.status === "ok" && <BulkBar packages={packages.data} />}

            {/* Column titles, desktop only (they use the same widths as the rows). */}
            <div className={`hidden gap-4 px-3 pb-2 text-xs text-c-tx3 sm:grid ${columns}`}>
              {canChangePlan && <SelectAllCheckbox people={people} />}
              <span>Landlord</span>
              <span>Plan</span>
              <span>Status</span>
              <span>Action</span>
            </div>

            <ul className="flex flex-col">
              {rows.map((row) => (
                <LandlordRow
                  key={row.landlordProfileId}
                  row={row}
                  columns={columns}
                  canWithdraw={canChangePlan}
                  selectBox={canChangePlan ? <RowCheckbox id={row.landlordProfileId} name={row.businessName || row.name} /> : null}
                  changePlan={
                    canChangePlan && packages.status === "ok" ? (
                      <ChangePlanButton
                        landlordProfileId={row.landlordProfileId}
                        landlordName={row.businessName || row.name}
                        packages={packages.data}
                      />
                    ) : null
                  }
                />
              ))}
            </ul>

            <div className="mt-4 flex items-center justify-between text-[13px]">
              {filtered && filteredList?.status === "ok" ? (
                <>
                  <span className="text-c-tx2">
                    Page {filteredList.data.page} of {Math.max(1, filteredList.data.totalPages)} · {filteredList.data.totalCount} landlords
                  </span>
                  <span className="flex items-center gap-3">
                    {filteredList.data.page > 1 && (
                      <Link href={href({ page: String(filteredList.data.page - 1) })} className="text-c-act2 hover:underline">
                        Previous
                      </Link>
                    )}
                    {filteredList.data.page < filteredList.data.totalPages && (
                      <Link href={href({ page: String(filteredList.data.page + 1) })} className="text-c-act2 hover:underline">
                        Next
                      </Link>
                    )}
                  </span>
                </>
              ) : (
                <>
                  {beforeId ? (
                    <Link href={search ? `/landlords?search=${encodeURIComponent(search)}` : "/landlords"} className="text-c-act2 hover:underline">
                      Back to newest
                    </Link>
                  ) : (
                    <span />
                  )}
                  {fullList?.status === "ok" && fullList.data.nextBeforeId && (
                    <Link href={href({ before: String(fullList.data.nextBeforeId) })} className="text-c-act2 hover:underline">
                      Older landlords
                    </Link>
                  )}
                </>
              )}
            </div>
          </BulkSelectionProvider>
        )}

        {/* Checks for customers' answers while proposals are waiting, and refreshes the list when one arrives. */}
        <ProposalWatcher awaiting={awaiting} />

        {!can(PERMISSIONS.subscriptionsChange) && <p className="mt-4 text-xs text-c-tx3">Your role can view plans but not change them.</p>}
      </section>
    </div>
  );
}
