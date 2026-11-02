// Settings: the plan and billing details (with Manage subscription for a paid plan) and the security settings.
import Link from "next/link";
import { redirect } from "next/navigation";
import { BillingBanner } from "@/components/billing-banner";
import { PageHeader } from "@/components/page-header";
import { PlanSummaryCard } from "@/components/plan-summary-card";
import { SecuritySection } from "@/components/security/security-section";
import { ManageSubscription } from "@/components/settings/manage-subscription";
import { SessionExpiredError } from "@/lib/api-error";
import { requireBackendToken } from "@/lib/auth-guard";
import { getAvailablePlans, getMyBilling, getMySubscription } from "@/lib/billing-api";
import { planSummary } from "@/lib/plan-summary";
import type { AvailablePlan, MyBilling, MySubscription } from "@/lib/types";

export default async function SettingsPage() {
  const session = await requireBackendToken(["Admin", "Landlord"]);

  let subscription: MySubscription | null = null;
  let plans: AvailablePlan[] = [];
  let billing: MyBilling | null = null;
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
  }

  const summary = subscription ? planSummary(subscription, plans, billing) : null;
  const paying = billing?.hasStripeSubscription ?? false;

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Configure your account and preferences." />

      {/* The badge in the top bar links here. */}
      <section id="subscription" className="scroll-mt-6 space-y-4">
        <h2 className="text-lg font-semibold text-heading">Plan and billing</h2>

        {subscription && summary ? (
          <>
            {billing && <BillingBanner billing={billing} currentName={subscription.packageName ?? "your plan"} pendingName={summary.pendingName} currentPrice={summary.currentPrice} />}
            {paying && billing ? (
              // One "Manage subscription" button under the plan card holds Change plan, Update card and Cancel plan or refund.
              <ManageSubscription currentName={subscription.packageName ?? "your plan"} refundWindowDays={billing.refundWindowDays} cancelAtPeriodEnd={billing.cancelAtPeriodEnd}>
                <PlanSummaryCard subscription={subscription} billing={billing} summary={summary} />
              </ManageSubscription>
            ) : (
              <>
                <PlanSummaryCard subscription={subscription} billing={billing} summary={summary} />
                <Link href="/landlord/billing" className="inline-block rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark">
                  See plans
                </Link>
              </>
            )}
          </>
        ) : (
          <div className="max-w-xl rounded-2xl border border-default bg-white p-6 text-sm text-muted shadow-sm">We couldn&apos;t load your plan right now. Refresh the page to try again.</div>
        )}
      </section>

      <SecuritySection />
    </div>
  );
}
