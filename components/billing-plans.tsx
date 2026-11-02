"use client";

// The "Change plan" section of the Billing page: a monthly/yearly toggle and one card per plan. What a card's button does depends on
// the landlord: no paid plan yet -> Stripe checkout (with the free trial if they are eligible); already paying -> the Switch popup
// (cost preview first); a free plan while paying -> the Cancel popup. Also holds the Update card and Cancel plan links.
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BillingCancelDialog } from "@/components/billing-cancel-dialog";
import { BillingSwitchDialog } from "@/components/billing-switch-dialog";
import { cardPageAction, checkoutAction } from "@/lib/billing-actions";
import { money } from "@/lib/billing-format";
import { offerText, trialLength } from "@/lib/billing-offer";
import { limitText } from "@/lib/format-time";
import { goToSessionExpired } from "@/lib/session-expired-client";
import type { AvailablePlan, BillingInterval, MyBilling } from "@/lib/types";

interface Props {
  plans: AvailablePlan[];
  billing: MyBilling | null;
}

const primaryButton = "w-full rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60";
const outlineButton = "w-full rounded-xl border border-default px-4 py-2 text-sm font-semibold text-body hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-60";

export function BillingPlans({ plans, billing }: Props) {
  const router = useRouter();
  const paying = billing?.hasStripeSubscription ?? false;
  // The trial months a first checkout would give; null when the landlord already used their trial.
  const trialMonths = billing?.trialEligible ? billing.trialMonths : null;

  const [interval, setInterval] = useState<BillingInterval>(billing?.interval ?? "month");
  const [switchTo, setSwitchTo] = useState<AvailablePlan | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [busyId, setBusyId] = useState<number | "card" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const current = plans.find((plan) => plan.isCurrent);
  // Yearly is only offered once the backend says which plans have a yearly price.
  const yearlyAvailable = plans.some((plan) => plan.monthlyPrice > 0 && plan.yearlyPrice != null);

  // The price a card shows for the chosen billing period; null when the plan is not sold that way.
  function priceFor(plan: AvailablePlan): number | null {
    if (plan.monthlyPrice === 0) return 0;
    return interval === "year" ? (plan.yearlyPrice ?? null) : plan.monthlyPrice;
  }

  // Paid plan for a landlord with no paid plan: the backend checks usage, then we leave for Stripe.
  async function pay(plan: AvailablePlan) {
    setError("");
    setNotice("");
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
    setNotice("");
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

  // After a switch or a cancellation: close the popup, show what happened and reload the page behind it.
  function done(message: string) {
    setSwitchTo(null);
    setCancelling(false);
    setError("");
    setNotice(message);
    router.refresh();
  }

  // The button of one card, following the rules in the file comment.
  function cardButton(plan: AvailablePlan, price: number | null) {
    const isCurrent = plan.isCurrent;
    const paid = plan.monthlyPrice > 0;

    // A paying landlord whose period is not recorded yet is billed monthly.
    if (isCurrent && paying && (billing?.interval ?? "month") !== interval && price !== null) {
      return (
        <button type="button" className={outlineButton} onClick={() => setSwitchTo(plan)}>
          Switch to {interval === "year" ? "yearly" : "monthly"} billing
        </button>
      );
    }
    if (isCurrent) return <p className="text-center text-xs font-semibold text-muted">Current plan</p>;
    if (!paid) return paying ? <button type="button" className={outlineButton} onClick={() => setCancelling(true)}>Cancel plan</button> : null;
    if (price === null) return <p className="text-center text-xs text-muted">Not sold yearly</p>;
    if (paying) return <button type="button" className={outlineButton} onClick={() => setSwitchTo(plan)}>Switch to {plan.name}</button>;
    return (
      <button type="button" className={primaryButton} disabled={busyId !== null} onClick={() => pay(plan)}>
        {busyId === plan.packageId ? "Opening Stripe…" : trialMonths ? `Start ${trialLength(trialMonths)} free trial` : "Subscribe"}
      </button>
    );
  }

  return (
    <div className="max-w-4xl rounded-2xl border border-default bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-heading">Change plan</h2>

        {yearlyAvailable && (
          <div className="inline-flex rounded-full border border-default p-0.5 text-xs font-semibold" role="group" aria-label="Billing period">
            {(["month", "year"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={interval === option}
                onClick={() => setInterval(option)}
                className={`rounded-full px-3 py-1.5 ${interval === option ? "bg-accent-tint text-accent" : "text-muted hover:text-heading"}`}
              >
                {option === "month" ? "Monthly" : "Yearly"}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {plans.map((plan) => {
          const price = priceFor(plan);
          const offer = !plan.isCurrent && price ? offerText(price, trialMonths, billing?.priceOverride ?? null, interval) : null;
          return (
            <div key={plan.packageId} className={`flex flex-col rounded-2xl border p-4 ${plan.isCurrent ? "border-accent ring-1 ring-accent" : "border-default"}`}>
              <p className="text-sm font-semibold text-heading">{plan.name}</p>
              <p className="mt-1 text-2xl font-semibold text-heading">
                {price === null ? "—" : price === 0 ? "$0" : money(price)}
                {price ? <span className="text-xs font-normal text-muted">{interval === "year" ? "/year" : "/month"}</span> : null}
              </p>
              <p className="mt-1 text-xs text-muted">{plan.limits.map((l) => limitText(l.value, l.displayName)).join(" · ")}</p>
              {interval === "year" && plan.yearlySavings ? <p className="mt-1 text-xs font-semibold text-green-700">Save {money(plan.yearlySavings)} a year</p> : null}
              <p className="mb-3 mt-1 min-h-4 text-xs font-semibold text-accent">{offer}</p>
              <div className="mt-auto">{cardButton(plan, price)}</div>
            </div>
          );
        })}
      </div>

      {paying && (
        <div className="mt-4 flex flex-wrap gap-4 border-t border-default pt-3 text-sm">
          <button type="button" onClick={openCardPage} disabled={busyId !== null} className="font-semibold text-accent hover:text-accent-dark disabled:opacity-60">
            {busyId === "card" ? "Opening…" : "Update card"}
          </button>
          {!billing?.cancelAtPeriodEnd && (
            <button type="button" onClick={() => setCancelling(true)} className="font-semibold text-accent hover:text-accent-dark">
              Cancel plan
            </button>
          )}
        </div>
      )}

      {notice && <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700">{notice}</p>}
      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>}

      {switchTo && <BillingSwitchDialog plan={switchTo} interval={interval} currentName={current?.name ?? "your plan"} onClose={() => setSwitchTo(null)} onDone={done} />}
      {cancelling && <BillingCancelDialog currentName={current?.name ?? "your plan"} onClose={() => setCancelling(false)} onDone={done} />}
    </div>
  );
}
