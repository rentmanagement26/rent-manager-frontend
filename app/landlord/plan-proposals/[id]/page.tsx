// The page the "approve" link in the plan-proposal email opens: shows the proposal and lets the landlord approve or decline it.
// The landlord must be signed in (the layout sends everyone else to sign in), so only they can answer.
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { PlanNoticeCard } from "@/components/plan-notice-card";
import { PlanProposalCard } from "@/components/plan-proposal-card";
import { SessionExpiredError } from "@/lib/api-error";
import { requireBackendToken } from "@/lib/auth-guard";
import { getMyPendingChanges } from "@/lib/plan-proposal-api";
import type { PendingPlanChange } from "@/lib/types";

export default async function PlanProposalPage({ params }: { params: Promise<{ id: string }> }) {
  const changeId = Number((await params).id);
  if (!Number.isInteger(changeId) || changeId <= 0) notFound();

  const session = await requireBackendToken(["Landlord"]);

  let changes: PendingPlanChange[] | null = null;
  try {
    changes = await getMyPendingChanges(session.backendToken);
  } catch (err) {
    if (!(err instanceof SessionExpiredError)) throw err;
  }
  if (!changes) redirect("/session-expired");

  const change = changes.find((c) => c.id === changeId);

  return (
    <div className="space-y-5">
      <PageHeader title={change?.kind === "notice" ? "Plan update" : "Plan proposal"} description="Review the change to your plan." />
      {change ? (
        change.kind === "notice" ? <PlanNoticeCard change={change} /> : <PlanProposalCard change={change} />
      ) : (
        <div className="max-w-xl rounded-2xl border border-default bg-white p-6 text-sm text-muted shadow-sm">
          This change is no longer open. It may have been answered, withdrawn, expired or replaced.
          <Link href="/landlord" className="mt-3 block font-semibold text-accent hover:text-accent-dark">
            Back to dashboard
          </Link>
        </div>
      )}
    </div>
  );
}
