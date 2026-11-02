// What a landlord would pay for a plan today: the plan price, any custom price an admin gave them, and the free trial if they
// are still eligible. Used for the one-line offer under each paid plan on the Billing page.
import type { MyPriceOverride } from "@/lib/types";

const money = (value: number) => `$${value.toFixed(2)}/mo`;

// The monthly price after a custom price: a fixed amount replaces the plan price; a percent off reduces it.
export function priceAfterOverride(planPrice: number, override: MyPriceOverride | null): number {
  if (!override) return planPrice;
  if (override.kind === "fixed_amount") return override.monthlyAmount ?? planPrice;
  return Math.round(planPrice * (1 - (override.percentOff ?? 0) / 100) * 100) / 100;
}

// One sentence such as "30 days free, then $10.00/mo for 6 months, then $20.00/mo", or null when nothing differs from the plain price.
export function offerText(planPrice: number, trialDays: number | null, override: MyPriceOverride | null): string | null {
  const price = priceAfterOverride(planPrice, override);
  const parts: string[] = [];
  if (trialDays) parts.push(`${trialDays} days free, then ${money(price)}`);
  else if (override) parts.push(money(price));
  if (!parts.length) return null;

  // A limited custom price goes back to the plan price afterwards.
  if (override?.months) parts[0] += ` for ${override.months} month${override.months === 1 ? "" : "s"}, then ${money(planPrice)}`;
  return parts[0];
}
