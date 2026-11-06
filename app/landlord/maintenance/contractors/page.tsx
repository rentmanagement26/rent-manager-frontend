// The landlord's contractor list: the people and companies they send maintenance jobs to, how each one gets work, and their trades.
import Link from "next/link";
import { redirect } from "next/navigation";
import { ContractorRowActions } from "@/components/contractor-row-actions";
import { HowPill, TradeList } from "@/components/contractor-parts";
import { PageHeader } from "@/components/page-header";
import { SessionExpiredError } from "@/lib/api-error";
import { requireBackendToken } from "@/lib/auth-guard";
import { listContractors } from "@/lib/contractor-api";
import type { ContractorList } from "@/lib/contractor-types";
import { CATEGORIES } from "@/lib/maintenance-format";

const STATUSES = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "all", label: "All" },
];

export default async function ContractorsPage({ searchParams }: { searchParams: Promise<{ status?: string; category?: string; q?: string }> }) {
  const filters = await searchParams;
  const status = STATUSES.some((item) => item.value === filters.status) ? filters.status! : "active";
  const session = await requireBackendToken(["Admin", "Landlord"]);

  let list: ContractorList;
  try {
    list = await listContractors(session.backendToken, { status, category: filters.category, q: filters.q });
  } catch (err) {
    if (err instanceof SessionExpiredError) redirect("/session-expired");
    return <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">Couldn&apos;t load your contractors. Refresh to try again.</p>;
  }

  const counts: Record<string, number> = { active: list.activeCount, inactive: list.inactiveCount, all: list.activeCount + list.inactiveCount };
  // A link that keeps the other filters and changes some of them.
  const linkWith = (changes: Record<string, string>) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries({ status, category: filters.category ?? "", q: filters.q ?? "", ...changes })) if (value) query.set(key, value);
    return `/landlord/maintenance/contractors?${query}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contractors"
        description="Your own list. Nobody else sees it."
        action={
          <Link href="/landlord/maintenance/contractors/new" className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark">
            + Add contractor
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {STATUSES.map((item) => (
          <Link
            key={item.value}
            href={linkWith({ status: item.value })}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${item.value === status ? "border-heading bg-heading text-white" : "border-default bg-white text-heading hover:bg-subtle"}`}
          >
            {item.label} {counts[item.value]}
          </Link>
        ))}
        {/* A plain GET form: the trade menu and the search box reload the list with the choice in the address. */}
        <form action="/landlord/maintenance/contractors" className="ml-auto flex flex-wrap gap-2">
          <input type="hidden" name="status" value={status} />
          <select name="category" defaultValue={filters.category ?? ""} aria-label="Trade" className="rounded-lg border border-default bg-white px-2.5 py-2 text-sm text-heading">
            <option value="">All trades</option>
            {CATEGORIES.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <input name="q" defaultValue={filters.q ?? ""} type="search" aria-label="Search" placeholder="Search name or company" className="w-48 rounded-lg border border-default bg-white px-2.5 py-2 text-sm text-heading" />
          <button type="submit" className="rounded-full border border-default bg-white px-4 py-2 text-sm font-semibold text-heading hover:bg-subtle">Search</button>
        </form>
      </div>

      {list.items.length === 0 ? (
        <div className="max-w-2xl rounded-2xl border border-default bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-heading">No contractors here</p>
          <p className="mt-1 text-sm text-muted">Add the plumbers, electricians and other people you hire, then send them jobs or ask them for quotes.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.items.map((contractor) => (
            <li key={contractor.id} className={`flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-default bg-white p-4 shadow-sm ${contractor.isActive ? "" : "opacity-70"}`}>
              <div className="min-w-[180px] flex-1">
                <p className="font-semibold text-heading">
                  {contractor.displayName} {!contractor.isActive && <span className="ml-1 rounded-full bg-subtle px-2 py-0.5 text-[11px] font-semibold text-body">Inactive</span>}
                </p>
                <p className="text-xs text-muted">{contractor.companyName ? contractor.name : contractor.invitation ? `Invitation ${contractor.invitation.toLowerCase()}` : ""}</p>
              </div>
              <div className="min-w-[160px] flex-1 text-sm text-body"><TradeList trades={contractor.trades} /></div>
              <HowPill howTheyWork={contractor.howTheyWork} />
              <div className="min-w-[170px] text-sm text-body">
                {contractor.phone}
                <span className="block text-xs text-muted">{contractor.email ?? "no email"}</span>
              </div>
              <span className="w-20 text-xs text-muted">{contractor.jobCount} job{contractor.jobCount === 1 ? "" : "s"}{contractor.openJobCount > 0 && ` (${contractor.openJobCount} open)`}</span>
              <ContractorRowActions contractor={contractor} />
            </li>
          ))}
        </ul>
      )}

      <div className="max-w-3xl rounded-2xl border border-default bg-white p-5 text-sm text-body shadow-sm">
        <p className="mb-2 font-semibold text-heading">How the three kinds work</p>
        <p><HowPill howTheyWork="InTheApp" /> They sign in to DomusPRO and see jobs and quotes from every landlord who invited them.</p>
        <p className="mt-2"><HowPill howTheyWork="EmailLink" /> No account. Each job or quote arrives as an email with a secure link. You can invite them to DomusPRO later.</p>
        <p className="mt-2"><HowPill howTheyWork="PhoneOnly" /> No email. You phone them and enter their answers, quotes and updates yourself.</p>
        <p className="mt-3 text-xs text-muted">A contractor who has had jobs cannot be deleted, only made inactive. Their history stays.</p>
      </div>
    </div>
  );
}
