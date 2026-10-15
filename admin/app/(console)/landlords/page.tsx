import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChangePlanButton } from "@/components/console/change-plan";
import { Notice, Pill, cardClass, inputClass, secondaryButtonClass } from "@/components/console/ui";
import { requireAdmin } from "@/lib/auth-guard";
import { initials } from "@/lib/format";
import { getLandlords, getPackages } from "@/lib/subscription-api";
import type { LandlordListItem } from "@/lib/types";

export const metadata: Metadata = { title: "Landlords" };

const PAGE_SIZE = 25;

interface SearchParams {
  search?: string;
  before?: string;
}

// Plan status from the backend ("Active", ...). Anything other than Active is flagged in amber.
function statusClass(status: string) {
  return status === "Active" ? "bg-c-ok text-c-okt" : "bg-c-wr text-c-wrt";
}

function LandlordRow({
  landlord,
  changePlan,
}: {
  landlord: LandlordListItem;
  // The "Change plan" button, or null when this admin can't change plans.
  changePlan: React.ReactNode;
}) {
  return (
    // Phone: stacked. Desktop: fixed columns, so the Plan and Action columns line up on every row.
    <li className="flex flex-col gap-3 rounded-2xl px-3 py-3 hover:bg-c-sf2 sm:grid sm:grid-cols-[minmax(0,1fr)_110px_100px_140px] sm:items-center sm:gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-c-aci text-xs font-medium text-c-act2">
          {initials(landlord.name)}
        </div>
        {/* The name is a link to this landlord's detail page (plan, usage, overrides, history). */}
        <Link href={`/landlords/${landlord.landlordProfileId}`} className="min-w-0 hover:underline">
          <div className="truncate text-sm font-medium">{landlord.businessName || landlord.name}</div>
          <div className="truncate text-xs text-c-tx2">
            {landlord.businessName ? `${landlord.name} · ` : ""}
            {landlord.email ?? "No email"}
          </div>
        </Link>
      </div>

      <div>{landlord.planName ? <Pill className="bg-c-sf2 text-c-tx">{landlord.planName}</Pill> : <Pill className="bg-c-sf2 text-c-tx3">No plan</Pill>}</div>

      {/* A switched-off account is flagged first; otherwise the plan status (Active, ...) is shown. */}
      <div>
        {!landlord.isActive ? (
          <Pill className="bg-c-bad text-c-badt">Deactivated</Pill>
        ) : (
          landlord.planStatus && <Pill className={statusClass(landlord.planStatus)}>{landlord.planStatus}</Pill>
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

  // The list and the plan catalog (the popup needs it) load side by side.
  const [landlords, packages] = await Promise.all([
    getLandlords(session.backendToken, { search, beforeId, limit: PAGE_SIZE }),
    getPackages(session.backendToken),
  ]);

  if (landlords.status === "expired" || packages.status === "expired") {
    redirect("/session-expired");
  }

  // Billing and SuperAdmin can change plans; Support can only look. The backend enforces this as well.
  const canChangePlan = session.role !== "Support" && packages.status === "ok";
  const canOverrideUsage = session.role === "SuperAdmin";

  // Builds the "Older landlords" link, keeping the search text.
  function pageHref(nextBeforeId: number) {
    const query = new URLSearchParams();
    if (search) query.set("search", search);
    query.set("before", String(nextBeforeId));
    return `/landlords?${query}`;
  }

  return (
    <div className="flex max-w-5xl flex-col gap-5">
      <div className="animate-up">
        <h1 className="text-2xl font-medium tracking-tight">Landlords</h1>
        <p className="mt-1 text-c-tx2">See each landlord&apos;s plan and move them to another one.</p>
      </div>

      <section className={`${cardClass} animate-up`} style={{ animationDelay: "0.06s" }}>
        {/* A plain GET form: the search text lives in the URL, so no JavaScript is needed. */}
        <form action="/landlords" className="mb-4 flex gap-2">
          <label className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-c-tx3" />
            <input name="search" defaultValue={search} placeholder="Search by name, business or email" className={`${inputClass} pl-10`} />
          </label>
          <button type="submit" className={secondaryButtonClass}>
            Search
          </button>
        </form>

        {landlords.status !== "ok" ? (
          <Notice>
            {landlords.status === "forbidden"
              ? "Your role doesn't have access to landlords."
              : "Couldn't load landlords right now. Refresh to try again."}
          </Notice>
        ) : landlords.data.items.length === 0 ? (
          <Notice>{search ? "No landlords match that search." : "No landlords yet."}</Notice>
        ) : (
          <>
            {/* Column titles, desktop only (they use the same widths as the rows). */}
            <div className="hidden grid-cols-[minmax(0,1fr)_110px_100px_140px] gap-4 px-3 pb-2 text-xs text-c-tx3 sm:grid">
              <span>Landlord</span>
              <span>Plan</span>
              <span>Status</span>
              <span>Action</span>
            </div>

            <ul className="flex flex-col">
              {landlords.data.items.map((landlord) => (
                <LandlordRow
                  key={landlord.landlordProfileId}
                  landlord={landlord}
                  changePlan={
                    canChangePlan && packages.status === "ok" ? (
                      <ChangePlanButton
                        landlordProfileId={landlord.landlordProfileId}
                        landlordName={landlord.businessName || landlord.name}
                        packages={packages.data}
                        canOverrideUsage={canOverrideUsage}
                      />
                    ) : null
                  }
                />
              ))}
            </ul>

            <div className="mt-4 flex items-center justify-between text-[13px]">
              {beforeId ? (
                <Link href={search ? `/landlords?search=${encodeURIComponent(search)}` : "/landlords"} className="text-c-act2 hover:underline">
                  Back to newest
                </Link>
              ) : (
                <span />
              )}
              {landlords.data.nextBeforeId && (
                <Link href={pageHref(landlords.data.nextBeforeId)} className="text-c-act2 hover:underline">
                  Older landlords
                </Link>
              )}
            </div>
          </>
        )}

        {session.role === "Support" && <p className="mt-4 text-xs text-c-tx3">Your role can view plans but not change them.</p>}
      </section>
    </div>
  );
}
