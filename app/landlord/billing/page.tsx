// Billing: the landlord's current plan with usage against each limit, what is happening with it (trial, renewal, a booked change,
// a cancellation), and the plans to subscribe to or switch to (see components/billing-plans.tsx). Cancelling and the card are under Settings.
import { redirect } from "next/navigation";
import { BillingBanner } from "@/components/billing-banner";
import { BillingPlans } from "@/components/billing-plans";
import { CheckoutWatcher } from "@/components/checkout-watcher";
import { PageHeader } from "@/components/page-header";
import { PlanSummaryCard } from "@/components/plan-summary-card";
import { SessionExpiredError } from "@/lib/api-error";
import { requireBackendToken } from "@/lib/auth-guard";
import { getAvailablePlans, getMyBilling, getMySubscription } from "@/lib/billing-api";
import { planSummary } from "@/lib/plan-summary";
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

  const summary = subscription ? planSummary(subscription, plans, billing) : null;

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

          {billing && summary && <BillingBanner billing={billing} currentName={subscription.packageName ?? "your plan"} pendingName={summary.pendingName} currentPrice={summary.currentPrice} />}

          {summary && <PlanSummaryCard subscription={subscription} billing={billing} summary={summary} />}

          <BillingPlans plans={plans} billing={billing} />
        </>
      )}
    </div>
  );
}
