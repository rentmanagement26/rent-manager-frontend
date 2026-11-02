// Small figures shared by the Billing page and the Settings page: how the landlord is billed, what they pay per period, and the name of a
// plan booked for the end of the period.
import type { AvailablePlan, BillingInterval, MyBilling, MySubscription } from "@/lib/types";

export interface PlanSummary {
  interval: BillingInterval;
  // The price per billing period (the yearly price when billed yearly and the backend sends it), or null when unknown.
  currentPrice: number | null;
  pendingName: string | null;
}

export function planSummary(subscription: MySubscription, plans: AvailablePlan[], billing: MyBilling | null): PlanSummary {
  const currentPlan = plans.find((plan) => plan.isCurrent);
  const interval = billing?.interval ?? "month";
  const currentPrice = interval === "year" && currentPlan?.yearlyPrice != null ? currentPlan.yearlyPrice : subscription.monthlyPrice;
  const pendingName = billing?.pendingPackageId ? (plans.find((plan) => plan.packageId === billing.pendingPackageId)?.name ?? null) : null;
  return { interval, currentPrice, pendingName };
}
