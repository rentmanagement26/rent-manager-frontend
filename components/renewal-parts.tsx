// Small pieces shared by the renewal screens: the status pill and the plain words for a decision.
import type { RenewalRow } from "@/lib/tenancy-types";

const DECISION_WORDS: Record<string, string> = {
  Pending: "No decision yet",
  Offered: "Offered a renewal",
  NotRenewing: "Not renewing",
  MonthToMonth: "Continuing month to month",
};

export function decisionWord(decision: string): string {
  return DECISION_WORDS[decision] ?? decision;
}

// Upcoming (grey), Due (amber), Overdue (red); a decided lease shows what was decided, in green.
export function RenewalPill({ state, decision }: { state: RenewalRow["state"] | null; decision: string }) {
  if (state === "Decided") {
    return <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">{decisionWord(decision)}</span>;
  }
  const style =
    state === "Overdue" ? "bg-red-50 text-red-700" : state === "Due" ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-600";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>{state === "Due" ? "Due now" : (state ?? "Upcoming")}</span>;
}
