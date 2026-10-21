"use client";

// The landlord's view of a notice that their plan is being updated: what changes and when, with "Keep my plan" (only when the
// change just lowers properties or units) and "Move now" (not offered for a price rise). Nothing is sent until they press one.
import Link from "next/link";
import { useState } from "react";
import { PlanChangeSummary } from "@/components/plan-change-summary";
import { formatCalendarDate } from "@/lib/format-time";
import { answerNoticeAction } from "@/lib/plan-proposal-actions";
import { goToSessionExpired } from "@/lib/session-expired-client";
import type { PendingPlanChange } from "@/lib/types";

export function PlanNoticeCard({ change }: { change: PendingPlanChange }) {
  const [working, setWorking] = useState<"keep" | "move" | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState<"keep" | "move" | null>(null);

  async function respond(answer: "keep" | "move") {
    setWorking(answer);
    setError("");
    const result = await answerNoticeAction(change.id, answer);
    setWorking(null);

    if ("error" in result) {
      if (result.expired) goToSessionExpired();
      else setError(result.error);
      return;
    }
    setDone(answer);
  }

  if (done) {
    return (
      <div className="max-w-xl rounded-2xl border border-default bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-heading">{done === "move" ? `You're now on the updated ${change.target.name}` : "You're keeping your plan"}</h2>
        <p className="mt-1 text-sm text-muted">
          {done === "move" ? "Your plan changed right away." : `You stay on ${change.current.name} as it is today.`}
        </p>
        <Link href="/landlord" className="mt-4 inline-block text-sm font-semibold text-accent hover:text-accent-dark">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-5 rounded-2xl border border-default bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-heading">Your {change.current.name} plan is being updated</h2>
        <p className="mt-1 text-sm text-muted">
          {change.effectiveDate
            ? `Starting ${formatCalendarDate(change.effectiveDate)}. We're telling you now so you can plan.`
            : change.mayStay
              ? "You can stay on your current plan, or move to the updated one."
              : "We're telling you now so you can plan."}
        </p>
      </div>

      {change.message && <p className="rounded-xl bg-subtle px-4 py-3 text-sm text-body">{change.message}</p>}

      <PlanChangeSummary changes={change.changes} />

      {error && <p className="text-sm text-red-700">{error}</p>}

      {(change.canMoveNow || change.mayStay) && (
        <div className="flex flex-wrap gap-3">
          {change.canMoveNow && (
            <button
              type="button"
              onClick={() => respond("move")}
              disabled={working !== null}
              className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
            >
              {working === "move" ? "Moving…" : "Move now"}
            </button>
          )}
          {change.mayStay && (
            <button
              type="button"
              onClick={() => respond("keep")}
              disabled={working !== null}
              className="rounded-xl border border-default px-5 py-2.5 text-sm font-semibold text-body hover:bg-subtle disabled:opacity-60"
            >
              {working === "keep" ? "Saving…" : "Keep my plan"}
            </button>
          )}
        </div>
      )}
      {!change.canMoveNow && !change.mayStay && (
        <p className="text-xs text-muted">Nothing is needed from you. The update applies on the date above.</p>
      )}
    </div>
  );
}
