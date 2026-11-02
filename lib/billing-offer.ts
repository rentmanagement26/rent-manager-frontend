// What a landlord would pay for a plan today: the plan price, any custom price an admin gave them, and the free trial if they
// are still eligible. Used for the one-line offer under each paid plan on the Billing page.
import { pricePer } from "@/lib/billing-format";
import type { BillingInterval, MyPriceOverride } from "@/lib/types";

// The price after a custom price: a fixed monthly amount replaces the monthly price (times 12 for a yearly plan); a percent off reduces it.
export function priceAfterOverride(planPrice: number, override: MyPriceOverride | null, interval: BillingInterval = "month"): number {
  if (!override) return planPrice;
  if (override.kind === "fixed_amount") return override.monthlyAmount == null ? planPrice : override.monthlyAmount * (interval === "year" ? 12 : 1);
  return Math.round(planPrice * (1 - (override.percentOff ?? 0) / 100) * 100) / 100;
}

// One sentence such as "30 days free, then $10.00/mo for 6 months, then $20.00/mo", or null when nothing differs from the plain price.
export function offerText(planPrice: number, trialDays: number | null, override: MyPriceOverride | null, interval: BillingInterval = "month"): string | null {
  const price = priceAfterOverride(planPrice, override, interval);
  let text: string;
  if (trialDays) text = `${trialDays} days free, then ${pricePer(price, interval)}`;
  else if (override) text = pricePer(price, interval);
  else return null;

  // A limited custom price goes back to the plan price afterwards.
  if (override?.months) text += ` for ${override.months} month${override.months === 1 ? "" : "s"}, then ${pricePer(planPrice, interval)}`;
  return text;
}
