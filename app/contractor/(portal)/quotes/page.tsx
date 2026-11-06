// The contractor's quote requests: asked and sent quotes, then closed ones. A contractor sees only their own quotes, never who else was asked.
import Link from "next/link";
import { redirect } from "next/navigation";
import { TenantPageHeading } from "@/components/tenant-page-heading";
import { SessionExpiredError } from "@/lib/api-error";
import { requireBackendToken } from "@/lib/auth-guard";
import { listQuotes } from "@/lib/contractor-portal-api";
import type { MyQuoteList } from "@/lib/contractor-portal-types";
import { formatCalendarDate } from "@/lib/format-time";
import { formatCents, taxWords } from "@/lib/maintenance-format";

const TABS = [
  { value: "open", label: "Open", count: (list: MyQuoteList) => list.needsQuoteCount + list.sentCount },
  { value: "closed", label: "Closed", count: (list: MyQuoteList) => list.closedCount },
];

const STATUS_WORDS: Record<string, { label: string; className: string }> = {
  Requested: { label: "Needs your quote", className: "bg-amber-100 text-amber-900" },
  Submitted: { label: "Quote sent", className: "bg-brand-green-tint text-brand-green-dark" },
  Accepted: { label: "Accepted", className: "bg-green-100 text-green-800" },
  Declined: { label: "You declined", className: "bg-red-100 text-red-800" },
  NotSelected: { label: "Not selected", className: "bg-subtle text-body" },
  Cancelled: { label: "Cancelled", className: "bg-subtle text-body" },
};

export default async function ContractorQuotesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const active = TABS.find((tab) => tab.value === status) ?? TABS[0];
  const session = await requireBackendToken(["Contractor"]);

  let list: MyQuoteList;
  try {
    list = await listQuotes(session.backendToken, active.value);
  } catch (err) {
    if (err instanceof SessionExpiredError) redirect("/session-expired");
    return <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">Couldn&apos;t load your quote requests. Refresh to try again.</p>;
  }

  return (
    <div>
      <TenantPageHeading title="Quote requests" description="Landlords asking you to quote a job. You only see your own quotes." />

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab.value}
            href={`/contractor/quotes?status=${tab.value}`}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${tab.value === active.value ? "border-heading bg-heading text-white" : "border-default bg-white text-heading hover:bg-subtle"}`}
          >
            {tab.label} {tab.count(list)}
          </Link>
        ))}
      </div>

      {list.items.length === 0 ? (
        <div className="max-w-2xl rounded-2xl border border-default bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-heading">{active.value === "open" ? "No open quote requests" : "No closed quote requests"}</p>
          <p className="mt-1 text-sm text-muted">When a landlord asks you for a quote it shows up here and you are told.</p>
        </div>
      ) : (
        <ul className="max-w-4xl space-y-3">
          {list.items.map((quote) => {
            const pill = STATUS_WORDS[quote.status];
            return (
              <li key={quote.id}>
                <Link href={`/contractor/quotes/${quote.id}`} className={`flex items-center gap-4 rounded-2xl border bg-white p-4 shadow-sm hover:border-accent ${quote.needsQuote ? "border-orange-200" : "border-default"}`}>
                  <span className="w-20 shrink-0 text-sm font-semibold text-heading">{quote.number}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-heading">{quote.title}</p>
                    <p className="truncate text-xs text-muted">
                      {quote.placeLabel} · {quote.landlordName} · asked {formatCalendarDate(quote.requestedAt)}
                      {quote.amountCents !== null && ` · ${formatCents(quote.amountCents)} ${taxWords(quote.taxMode)}`}
                      {quote.validUntil && ` · valid until ${formatCalendarDate(quote.validUntil)}`}
                    </p>
                  </div>
                  {quote.urgency === "Emergency" && <span className="shrink-0 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800">Emergency</span>}
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${pill.className}`}>{pill.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
