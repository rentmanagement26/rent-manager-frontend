// Small pieces shared by the contractor screens: the "how they work" pill and a contractor's trades with a star for the preferred ones.
import { HOW_THEY_WORK } from "@/lib/maintenance-format";
import type { ContractorTrade } from "@/lib/contractor-types";

// "In the app", "Email link" or "Phone only".
export function HowPill({ howTheyWork }: { howTheyWork: string }) {
  const pill = HOW_THEY_WORK[howTheyWork] ?? HOW_THEY_WORK.PhoneOnly;
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${pill.className}`}>{pill.label}</span>;
}

// "Plumbing ★, Heating": the star marks the contractor the landlord prefers for that trade.
export function TradeList({ trades }: { trades: ContractorTrade[] }) {
  return (
    <span>
      {trades.map((trade, index) => (
        <span key={trade.category}>
          {index > 0 && ", "}
          {trade.category}
          {trade.isPreferred && <span className="text-accent" title="Preferred for this trade"> ★</span>}
        </span>
      ))}
    </span>
  );
}
