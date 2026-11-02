// Billing: the landlord's current plan with usage against each limit, trial/renewal from Stripe, and a way to change plan
// (a free plan previews first; a paid plan goes to Stripe checkout).
import { redirect } from "next/navigation";
import { BillingPlans } from "@/components/billing-plans";
import { CheckoutWatcher } from "@/components/checkout-watcher";
import { PageHeader } from "@/components/page-header";
import { SessionExpiredError } from "@/lib/api-error";
import { requireBackendToken } from "@/lib/auth-guard";
import { getAvailablePlans, getMyBilling, getMySubscription } from "@/lib/billing-api";
import type { AvailablePlan, MyBilling, MySubscription } from "@/lib/types";

const money = (value: number) => `$${value.toFixed(2)}/mo`;
const day = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });

// One line about the Stripe subscription: trial end, a failed payment, or the next renewal.
function billingNote(billing: MyBilling, price: number): string | null {
  if (billing.status === "trialing" && billing.trialEndsAt) return `Free trial until ${day(billing.trialEndsAt)}. Then ${money(price)}.`;
  if (billing.status === "past_due") return "Your last payment didn't go through. Update your card in Stripe.";
  return billing.currentPeriodEnd ? `Renews ${day(billing.currentPeriodEnd)}.` : null;
}

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

  return (
    <div className="space-y-5">
      <PageHeader title="Billing" description="See your plan and change it." />

      {checkout === "cancelled" && (
        <div className="max-w-xl rounded-2xl border border-default bg-subtle p-4 text-sm text-body">You didn&apos;t complete the payment. Your plan hasn&apos;t changed.</div>
      )}

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
                {billing?.hasStripeSubscription && billingNote(billing, subscription.monthlyPrice ?? 0) && (
                  <p className="mt-2 text-sm text-body">{billingNote(billing, subscription.monthlyPrice ?? 0)}</p>
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

          {/* Stripe sends the landlord back with ?checkout=done; wait for the webhook to change the plan. */}
          <CheckoutWatcher waiting={checkout === "done" && !billing?.hasStripeSubscription} />

          <BillingPlans
            plans={plans}
            currentPrice={subscription.hasPlan ? subscription.monthlyPrice : null}
            trialDays={billing?.trialEligible ? billing.trialDays : null}
            override={billing?.priceOverride ?? null}
          />
        </>
      )}
    </div>
  );
}
