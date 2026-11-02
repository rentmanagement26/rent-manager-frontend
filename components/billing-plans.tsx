"use client";

// The "Change plan" section of the Billing page: a monthly/yearly toggle and one card per plan (the same cards as the public pricing page),
// then a "Manage subscription" box (update card, cancel, refund), the AI panel and the collapsed feature comparison. What a card's button
// does depends on the landlord: no paid plan yet -> Stripe checkout (with the free trial if they are eligible); already paying -> the
// Switch popup (cost preview first); a free plan while paying -> the Cancel popup. After a change a receipt card appears at the top.
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BillingCancelDialog } from "@/components/billing-cancel-dialog";
import { BillingReceipt } from "@/components/billing-receipt";
import { BillingSwitchDialog } from "@/components/billing-switch-dialog";
import { AiSection } from "@/components/pricing/ai-section";
import { IntervalToggle } from "@/components/pricing/interval-toggle";
import { PlanCard } from "@/components/pricing/plan-card";
import { PlanComparison } from "@/components/pricing/plan-comparison";
import { cardPageAction, checkoutAction } from "@/lib/billing-actions";
import { money } from "@/lib/billing-format";
import type { Receipt } from "@/lib/billing-receipt";
import { offerText, trialLength } from "@/lib/billing-offer";
import { limitText } from "@/lib/format-time";
import { copyFor } from "@/lib/pricing-content";
import { yearlyPerMonth, yearlySaving } from "@/lib/pricing-math";
import { goToSessionExpired } from "@/lib/session-expired-client";
import type { AvailablePlan, BillingInterval, MyBilling } from "@/lib/types";

interface Props {
  plans: AvailablePlan[];
  billing: MyBilling | null;
}

const buttonBase = "block w-full rounded-[14px] border-[1.5px] px-4 py-3 text-center text-[13.5px] font-bold disabled:cursor-not-allowed disabled:opacity-60";
const primaryButton = `${buttonBase} border-accent bg-accent text-white shadow-[0_8px_20px_-8px_rgba(217,96,31,0.75)] hover:bg-accent-dark`;
const outlineButton = `${buttonBase} border-default bg-white text-heading hover:border-accent hover:text-accent-dark`;

export function BillingPlans({ plans, billing }: Props) {
  const router = useRouter();
  const paying = billing?.hasStripeSubscription ?? false;
  // The trial months a first checkout would give; null when the landlord already used their trial.
  const trialMonths = billing?.trialEligible ? billing.trialMonths : null;
  const override = billing?.priceOverride ?? null;

  const [interval, setInterval] = useState<BillingInterval>(billing?.interval ?? "month");
  const [switchTo, setSwitchTo] = useState<AvailablePlan | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [busyId, setBusyId] = useState<number | "card" | null>(null);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  const current = plans.find((plan) => plan.isCurrent);
  const currentCopy = current ? copyFor(current.name) : null;
  // Yearly is only offered once the backend says which plans have a yearly price.
  const yearlyAvailable = plans.some((plan) => plan.monthlyPrice > 0 && plan.yearlyPrice != null);
  const maxSaving = Math.max(0, ...plans.map((plan) => (plan.yearlyPrice != null ? (plan.yearlySavings ?? yearlySaving(plan.monthlyPrice, plan.yearlyPrice)) : 0)));

  // The price a card charges for the chosen billing period; null when the plan is not sold that way.
  function priceFor(plan: AvailablePlan): number | null {
    if (plan.monthlyPrice === 0) return 0;
    return interval === "year" ? (plan.yearlyPrice ?? null) : plan.monthlyPrice;
  }

  // Paid plan for a landlord with no paid plan: the backend checks usage, then we leave for Stripe.
  async function pay(plan: AvailablePlan) {
    setError("");
    setReceipt(null);
    setBusyId(plan.packageId);
    const result = await checkoutAction(plan.packageId, interval);
    if ("error" in result) {
      setBusyId(null);
      if (result.expired) return goToSessionExpired();
      setError(result.error);
      return;
    }
    window.location.assign(result.url);
  }

  async function openCardPage() {
    setError("");
    setReceipt(null);
    setBusyId("card");
    const result = await cardPageAction();
    if ("error" in result) {
      setBusyId(null);
      if (result.expired) return goToSessionExpired();
      setError(result.error);
      return;
    }
    window.location.assign(result.url);
  }

  // After a switch or a cancellation: close the popup, show the receipt and reload the page behind it.
  function done(next: Receipt) {
    setSwitchTo(null);
    setCancelling(false);
    setError("");
    setReceipt(next);
    router.refresh();
  }

  // The button of one card, following the rules in the file comment.
  function cardButton(plan: AvailablePlan, price: number | null, popular: boolean) {
    const paid = plan.monthlyPrice > 0;

    // A paying landlord whose period is not recorded yet is billed monthly.
    if (plan.isCurrent && paying && (billing?.interval ?? "month") !== interval && price !== null) {
      return (
        <button type="button" className={outlineButton} onClick={() => setSwitchTo(plan)}>
          Switch to {interval === "year" ? "yearly" : "monthly"} billing
        </button>
      );
    }
    if (plan.isCurrent) return <p className="py-3 text-center text-[13px] font-bold text-muted">Your current plan</p>;
    if (!paid) return paying ? <button type="button" className={outlineButton} onClick={() => setCancelling(true)}>Cancel plan</button> : null;
    if (price === null) return <p className="py-3 text-center text-[13px] text-muted">Not sold yearly</p>;
    if (paying) {
      return (
        <button type="button" className={popular ? primaryButton : outlineButton} onClick={() => setSwitchTo(plan)}>
          Switch to {plan.name}
        </button>
      );
    }
    return (
      <button type="button" className={popular ? primaryButton : outlineButton} disabled={busyId !== null} onClick={() => pay(plan)}>
        {busyId === plan.packageId ? "Opening Stripe…" : trialMonths ? `Start ${trialMonths}-month free trial` : "Subscribe"}
      </button>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      {receipt && (
        <BillingReceipt
          receipt={receipt}
          onDismiss={() => setReceipt(null)}
          onActionDone={() => {
            setReceipt(null);
            router.refresh();
          }}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-heading">Change plan</h2>
        {yearlyAvailable && <IntervalToggle value={interval} onChange={setInterval} maxSaving={maxSaving || null} />}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const copy = copyFor(plan.name);
          const price = priceFor(plan);
          const paid = plan.monthlyPrice > 0;
          const yearly = interval === "year" && plan.yearlyPrice != null;
          const saving = plan.yearlyPrice != null ? (plan.yearlySavings ?? yearlySaving(plan.monthlyPrice, plan.yearlyPrice)) : 0;
          const popular = !!copy?.popular;
          const custom = !plan.isCurrent && paid && price ? offerText(price, null, override, interval) : null;
          return (
            <PlanCard
              key={plan.packageId}
              name={plan.name}
              tagline={copy?.tagline ?? ""}
              highlights={copy?.highlights ?? plan.limits.map((limit) => limitText(limit.value, limit.displayName))}
              popular={popular}
              current={plan.isCurrent}
              price={!paid ? "$0" : yearly ? money(yearlyPerMonth(plan.yearlyPrice ?? 0)) : money(plan.monthlyPrice)}
              billingNote={!paid ? "Free plan" : yearly ? `Billed yearly at ${money(plan.yearlyPrice ?? 0)}` : interval === "year" ? "Monthly billing only" : "Billed monthly"}
              trialLabel={!plan.isCurrent && paid && trialMonths ? `${trialLength(trialMonths)} free` : null}
              savingLabel={paid && saving > 0 ? (yearly ? `Save ${money(saving)} a year` : `Save ${money(saving)} with yearly`) : null}
              onSwitchToYearly={paid && !yearly && saving > 0 ? () => setInterval("year") : undefined}
              extraNote={custom ? `Your custom price: ${custom}` : null}
            >
              {cardButton(plan, price, popular)}
            </PlanCard>
          );
        })}
      </div>

      {paying && (
        <section className="rounded-2xl border border-default bg-white p-5">
          <h3 className="text-base font-semibold text-heading">Manage subscription</h3>
          <p className="mt-1 text-sm text-muted">
            Update your card, see your invoices, or cancel. Cancel within {billing?.refundWindowDays ?? 7} days of a payment and you can have that payment refunded in full.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={openCardPage} disabled={busyId !== null} className="rounded-xl border border-default px-4 py-2 text-sm font-semibold text-heading hover:border-accent hover:text-accent-dark disabled:opacity-60">
              {busyId === "card" ? "Opening…" : "Update card"}
            </button>
            {!billing?.cancelAtPeriodEnd && (
              <button type="button" onClick={() => setCancelling(true)} className="rounded-xl border border-default px-4 py-2 text-sm font-semibold text-red-700 hover:border-red-300 hover:bg-red-50">
                Cancel plan or refund
              </button>
            )}
          </div>
        </section>
      )}

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>}

      <AiSection highlight={currentCopy?.key} />
      <PlanComparison />

      {switchTo && <BillingSwitchDialog plan={switchTo} interval={interval} currentName={current?.name ?? "your plan"} refundWindowDays={billing?.refundWindowDays ?? 7} onClose={() => setSwitchTo(null)} onDone={done} />}
      {cancelling && <BillingCancelDialog currentName={current?.name ?? "your plan"} onClose={() => setCancelling(false)} onDone={done} />}
    </div>
  );
}
