// The "Your plan" card: the plan name and price, the renewal date, and usage against each limit. Shown on the Billing page and under Settings.
import { dayText, pricePer } from "@/lib/billing-format";
import type { PlanSummary } from "@/lib/plan-summary";
import type { MyBilling, MySubscription } from "@/lib/types";

export function PlanSummaryCard({ subscription, billing, summary }: { subscription: MySubscription; billing: MyBilling | null; summary: PlanSummary }) {
  return (
    <div className="max-w-5xl rounded-2xl border border-default bg-white p-6 shadow-sm">
      {subscription.hasPlan ? (
        <>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold text-heading">Your plan: {subscription.packageName}</h2>
            {summary.currentPrice != null && <span className="text-sm font-semibold text-heading">{pricePer(summary.currentPrice, summary.interval)}</span>}
          </div>
          {billing?.hasStripeSubscription && billing.status !== "trialing" && !billing.cancelAtPeriodEnd && billing.currentPeriodEnd && (
            <p className="mt-2 text-sm text-body">Renews {dayText(billing.currentPeriodEnd)}.</p>
          )}
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
          <p className="mt-1 text-sm text-muted">You get the default plan the first time you add a property or unit. You can also choose one on the Billing page.</p>
        </>
      )}
    </div>
  );
}
