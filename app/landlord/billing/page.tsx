// Billing: the landlord's current plan with usage against each limit, and a way to change plan (preview first, then confirm).
import { redirect } from "next/navigation";
import { BillingPlans } from "@/components/billing-plans";
import { PageHeader } from "@/components/page-header";
import { SessionExpiredError } from "@/lib/api-error";
import { requireBackendToken } from "@/lib/auth-guard";
import { getAvailablePlans, getMySubscription } from "@/lib/billing-api";
import type { AvailablePlan, MySubscription } from "@/lib/types";

const money = (value: number) => `$${value.toFixed(2)}/mo`;

export default async function BillingPage() {
  const session = await requireBackendToken(["Admin", "Landlord"]);

  let subscription: MySubscription | null = null;
  let plans: AvailablePlan[] = [];
  let failed = false;
  try {
    [subscription, plans] = await Promise.all([getMySubscription(session.backendToken), getAvailablePlans(session.backendToken)]);
  } catch (err) {
    if (err instanceof SessionExpiredError) redirect("/session-expired");
    failed = true;
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Billing" description="See your plan and change it." />

      {failed || !subscription ? (
        <div className="max-w-xl rounded-2xl border border-default bg-white p-6 text-sm text-muted shadow-sm">
          We couldn&apos;t load your plan right now. Refresh the page to try again.
        </div>
      ) : (
        <>
          <div className="max-w-xl rounded-2xl border border-default bg-white p-6 shadow-sm">
            {subscription.hasPlan ? (
              <>
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-lg font-semibold text-heading">Your plan: {subscription.packageName}</h2>
                  <span className="text-sm font-semibold text-heading">{money(subscription.monthlyPrice ?? 0)}</span>
                </div>
                <div className="mt-4 space-y-3">
                  {subscription.limits.map((limit) => (
                    <div key={limit.key}>
                      <p className="text-sm text-body">
                        {limit.displayName}: {limit.used} of {limit.limit}
                      </p>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-subtle">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${limit.limit > 0 ? Math.min(100, (limit.used / limit.limit) * 100) : 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-heading">You don&apos;t have a plan yet</h2>
                <p className="mt-1 text-sm text-muted">You get the default plan the first time you add a property or unit. You can also choose one below.</p>
              </>
            )}
          </div>

          <BillingPlans plans={plans} currentPrice={subscription.hasPlan ? subscription.monthlyPrice : null} />
        </>
      )}
    </div>
  );
}
