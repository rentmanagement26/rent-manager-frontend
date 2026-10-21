"use client";

// The landlord's view of one plan proposal from support: what would change, and Approve / Decline buttons.
// Nothing changes until they press Approve.
import Link from "next/link";
import { useState } from "react";
import { PlanChangeSummary } from "@/components/plan-change-summary";
import { answerProposalAction } from "@/lib/plan-proposal-actions";
import { goToSessionExpired } from "@/lib/session-expired-client";
import type { PendingPlanChange } from "@/lib/types";

export function PlanProposalCard({ change }: { change: PendingPlanChange }) {
  const [working, setWorking] = useState<"accept" | "decline" | null>(null);
  const [error, setError] = useState("");
  // Set once the landlord has answered, to show the result instead of the buttons.
  const [answer, setAnswer] = useState<"accepted" | "declined" | null>(null);

  async function respond(accept: boolean) {
    setWorking(accept ? "accept" : "decline");
    setError("");
    const result = await answerProposalAction(change.id, accept);
    setWorking(null);

    if ("error" in result) {
      if (result.expired) goToSessionExpired();
      else setError(result.error);
      return;
    }
    setAnswer(accept ? "accepted" : "declined");
  }

  if (answer) {
    return (
      <div className="max-w-xl rounded-2xl border border-default bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-heading">
          {answer === "accepted" ? `You're now on ${change.target.name}` : "Proposal declined"}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {answer === "accepted" ? "Your plan changed right away." : `Nothing changed. You stay on ${change.current.name}.`}
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
        <h2 className="text-lg font-semibold text-heading">
          Move from {change.current.name} to {change.target.name}?
        </h2>
        <p className="mt-1 text-sm text-muted">Support suggested this change. Your plan stays as it is unless you approve.</p>
      </div>

      {change.message && <p className="rounded-xl bg-subtle px-4 py-3 text-sm text-body">{change.message}</p>}

      <PlanChangeSummary changes={change.changes} />

      {error && <p className="text-sm text-red-700">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => respond(true)}
          disabled={working !== null}
          className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60"
        >
          {working === "accept" ? "Approving…" : `Approve ${change.target.name}`}
        </button>
        <button
          type="button"
          onClick={() => respond(false)}
          disabled={working !== null}
          className="rounded-xl border border-default px-5 py-2.5 text-sm font-semibold text-body hover:bg-subtle disabled:opacity-60"
        >
          {working === "decline" ? "Declining…" : "Decline"}
        </button>
      </div>
    </div>
  );
}
