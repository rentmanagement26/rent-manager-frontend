// Billing: the landlord's current plan with usage against each limit, what is happening with it (trial, renewal, a booked change,
// a cancellation), and the plans to subscribe to, switch to or cancel (see components/billing-plans.tsx).
import { redirect } from "next/navigation";
import { BillingBanner } from "@/components/billing-banner";
import { BillingPlans } from "@/components/billing-plans";
import { CheckoutWatcher } from "@/components/checkout-watcher";
import { PageHeader } from "@/components/page-header";
import { SessionExpiredError } from "@/lib/api-error";
import { requireBackendToken } from "@/lib/auth-guard";
import { getAvailablePlans, getMyBilling, getMySubscription } from "@/lib/billing-api";
import { dayText, pricePer } from "@/lib/billing-format";
import type { AvailablePlan, MyBilling, MySubscription } from "@/lib/types";

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  const { checkout } = await searchParams;
  const session = await requireBackendToken(["Admin", "Landlord"]);

  let subscription: MySubscription | null = null;
  let plans: AvailablePlan[] = [];
  let billing: MyBilling | null = null;
  let failed = false;
  try {
    [subscription, plans, billing] = await Promise.all([
      getMySubscription(session.backendToken),
      getAvailablePlans(session.backendToken),
      // The Stripe details are extra: a failure here must not blank the page.
      getMyBilling(session.backendToken).catch((err) => {
        if (err instanceof SessionExpiredError) throw err;
        return null;
      }),
    ]);
  } catch (err) {
    if (err instanceof SessionExpiredError) redirect("/session-expired");
    failed = true;
  }

  // What they pay per billing period: the yearly price when billed yearly (once the backend sends it), else the monthly one.
  const currentPlan = plans.find((plan) => plan.isCurrent);
  const interval = billing?.interval ?? "month";
  const currentPrice = interval === "year" && currentPlan?.yearlyPrice != null ? currentPlan.yearlyPrice : (subscription?.monthlyPrice ?? null);
  const pendingName = billing?.pendingPackageId ? (plans.find((plan) => plan.packageId === billing.pendingPackageId)?.name ?? null) : null;

  return (
    <div className="space-y-5">
      <PageHeader title="Billing" description="See your plan and change it." />

      {checkout === "cancelled" && (
        <div className="max-w-5xl rounded-2xl border border-default bg-subtle p-4 text-sm text-body">You didn&apos;t complete the payment. Your plan hasn&apos;t changed.</div>
      )}

      {failed || !subscription ? (
        <div className="max-w-xl rounded-2xl border border-default bg-white p-6 text-sm text-muted shadow-sm">
          We couldn&apos;t load your plan right now. Refresh the page to try again.
        </div>
      ) : (
        <>
          {/* Stripe sends the landlord back with ?checkout=done; wait for the webhook to change the plan. */}
          <CheckoutWatcher waiting={checkout === "done" && !billing?.hasStripeSubscription} />

          {billing && <BillingBanner billing={billing} currentName={subscription.packageName ?? "your plan"} pendingName={pendingName} currentPrice={currentPrice} />}

          <div className="max-w-5xl rounded-2xl border border-default bg-white p-6 shadow-sm">
            {subscription.hasPlan ? (
              <>
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-lg font-semibold text-heading">Your plan: {subscription.packageName}</h2>
                  {currentPrice != null && <span className="text-sm font-semibold text-heading">{pricePer(currentPrice, interval)}</span>}
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
                <p className="mt-1 text-sm text-muted">You get the default plan the first time you add a property or unit. You can also choose one below.</p>
              </>
            )}
          </div>

          <BillingPlans plans={plans} billing={billing} />
        </>
      )}
    </div>
  );
}
