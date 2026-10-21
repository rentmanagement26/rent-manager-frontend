// The list of what a plan change would do (price, limits, features gained or lost), shared by the signed-in proposal page
// and the emailed-link confirm page so both always read the same.
import type { PendingPlanChange } from "@/lib/types";

const money = (value: number) => `$${value.toFixed(2)}/mo`;
const amount = (value: number | null) => (value === null ? "Unlimited" : String(value));

export function PlanChangeSummary({ changes }: { changes: PendingPlanChange["changes"] }) {
  const { price, limits, featuresAdded, featuresRemoved } = changes;

  return (
    <ul className="space-y-2 text-sm text-body">
      {price && (
        <li>
          Price: {money(price.from)} → <span className="font-semibold">{money(price.to)}</span>
        </li>
      )}
      {limits.map((limit) => (
        <li key={limit.key}>
          {limit.displayName}: {amount(limit.from)} → <span className="font-semibold">{amount(limit.to)}</span>
        </li>
      ))}
      {featuresAdded.map((feature) => (
        <li key={feature.key}>You gain: {feature.displayName}</li>
      ))}
      {featuresRemoved.map((feature) => (
        <li key={feature.key}>You lose: {feature.displayName}</li>
      ))}
    </ul>
  );
}
