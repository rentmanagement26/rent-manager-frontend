// Dashboard banner shown while support has suggested a plan change the landlord has not answered.
// "Review proposal" opens the proposal page, where the landlord approves or declines. Renders nothing otherwise,
// and nothing if the proposals can't be loaded (the dashboard must never break because of this banner).
import Link from "next/link";
import { getMyPendingChanges } from "@/lib/plan-proposal-api";
import type { PendingPlanChange } from "@/lib/types";

export async function PlanProposalBanner({ token }: { token: string }) {
  let proposals: PendingPlanChange[] = [];
  try {
    proposals = (await getMyPendingChanges(token)).filter((c) => c.kind === "proposal");
  } catch {
    return null;
  }
  if (proposals.length === 0) return null;

  // One proposal goes straight to it; several go to the list.
  const first = proposals[0];
  const href = proposals.length === 1 ? `/landlord/plan-proposals/${first.id}` : "/landlord/plan-proposals";

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-accent/40 bg-accent-tint px-6 py-4">
      <div>
        <h2 className="text-sm font-semibold text-heading">Support suggested a plan change</h2>
        <p className="mt-0.5 text-sm text-body">
          {proposals.length === 1
            ? `Move from ${first.current.name} to ${first.target.name}. Nothing changes unless you approve.`
            : `${proposals.length} proposals are waiting for your answer. Nothing changes unless you approve.`}
        </p>
      </div>
      <Link
        href={href}
        className="whitespace-nowrap rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark"
      >
        Review proposal
      </Link>
    </div>
  );
}
