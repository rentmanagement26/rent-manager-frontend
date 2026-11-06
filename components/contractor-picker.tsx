"use client";

// A list of the landlord's active contractors to choose from, for the Assign and Request quotes popups. It starts with the contractors who do
// the request's trade (the preferred one first), and can show the others. One can be chosen (assign) or several (quotes).
import { useEffect, useState } from "react";
import { HowPill } from "@/components/contractor-parts";
import { suggestContractorsAction } from "@/lib/contractor-actions";
import type { ContractorListItem } from "@/lib/contractor-types";

export function ContractorPicker({
  category,
  selected,
  onToggle,
  multiple,
  onLoaded,
}: {
  category: string;
  selected: number[];
  onToggle: (contractor: ContractorListItem) => void;
  multiple: boolean;
  // Tells the popup about the list it is showing (for example to know the chosen contractor's kind).
  onLoaded?: (contractors: ContractorListItem[]) => void;
}) {
  const [showOthers, setShowOthers] = useState(false);
  const [contractors, setContractors] = useState<ContractorListItem[] | null>(null);
  const [error, setError] = useState("");

  // Loads the contractors of this trade, or every active one when "other trades" is switched on.
  useEffect(() => {
    let stale = false;
    suggestContractorsAction(showOthers ? "" : category).then((result) => {
      if (stale) return;
      if ("ok" in result) {
        setContractors(result.data.items);
        onLoaded?.(result.data.items);
      } else setError(result.error);
    });
    return () => {
      stale = true;
    };
    // onLoaded is a new function on every render of the popup; the list only depends on the trade and the toggle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, showOthers]);

  if (error) return <p role="alert" className="text-sm font-medium text-red-700">{error}</p>;
  if (!contractors) return <p className="text-sm text-muted">Loading your contractors…</p>;

  return (
    <div>
      {contractors.length === 0 && (
        <p className="rounded-lg bg-bg px-3 py-2 text-sm text-body">
          {showOthers ? "You have no active contractors yet. Add one from the Contractors page." : `You have no active ${category.toLowerCase()} contractors.`}
        </p>
      )}
      <div className="space-y-2">
        {contractors.map((contractor) => {
          const on = selected.includes(contractor.id);
          const preferred = contractor.trades.some((trade) => trade.isPreferred && trade.category === category);
          return (
            <button
              key={contractor.id}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(contractor)}
              className={`flex w-full items-center gap-3 rounded-xl border-[1.5px] p-3 text-left ${on ? "border-accent bg-accent-tint" : "border-default bg-white hover:border-accent"}`}
            >
              <span className={`h-3.5 w-3.5 shrink-0 border-2 ${multiple ? "rounded" : "rounded-full"} ${on ? "border-accent bg-accent" : "border-slate-300"}`} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-heading">
                  {contractor.displayName} {preferred && <span className="text-xs font-semibold text-accent">★ Preferred</span>}
                </span>
                <span className="block truncate text-xs text-muted">{contractor.trades.map((trade) => trade.category).join(", ")} · {contractor.phone}</span>
              </span>
              <HowPill howTheyWork={contractor.howTheyWork} />
            </button>
          );
        })}
      </div>
      {!showOthers && (
        <button type="button" onClick={() => setShowOthers(true)} className="mt-2 text-sm font-semibold text-accent hover:underline">
          Show contractors of other trades
        </button>
      )}
    </div>
  );
}
