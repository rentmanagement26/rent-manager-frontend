// Where the bell notification for a plan proposal lands. One open proposal goes straight to its page;
// otherwise this lists them (or says there is nothing to answer).
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { SessionExpiredError } from "@/lib/api-error";
import { requireBackendToken } from "@/lib/auth-guard";
import { getMyPendingChanges } from "@/lib/plan-proposal-api";
import type { PendingPlanChange } from "@/lib/types";

export default async function PlanProposalsPage() {
  const session = await requireBackendToken(["Landlord"]);

  let changes: PendingPlanChange[] | null = null;
  try {
    changes = await getMyPendingChanges(session.backendToken);
  } catch (err) {
    if (!(err instanceof SessionExpiredError)) throw err;
  }
  if (!changes) redirect("/session-expired");

  if (changes.length === 1) redirect(`/landlord/plan-proposals/${changes[0].id}`);

  return (
    <div className="space-y-5">
      <PageHeader title="Plan changes" description="Changes to your plan waiting for you." />
      <div className="max-w-xl divide-y divide-default overflow-hidden rounded-2xl border border-default bg-white shadow-sm">
        {changes.length === 0 ? (
          <p className="p-6 text-sm text-muted">No plan changes are waiting for you.</p>
        ) : (
          changes.map((proposal) => (
            <Link key={proposal.id} href={`/landlord/plan-proposals/${proposal.id}`} className="block px-5 py-4 hover:bg-subtle">
              <p className="text-sm font-semibold text-heading">
                {proposal.kind === "notice"
                  ? `Your ${proposal.current.name} plan is being updated`
                  : `Move from ${proposal.current.name} to ${proposal.target.name}`}
              </p>
              <p className="mt-0.5 text-sm text-muted">{proposal.kind === "notice" ? "Review the update." : "Review and approve or decline."}</p>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
