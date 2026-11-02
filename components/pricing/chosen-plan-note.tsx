// The box on the register page that shows which plan the visitor picked on the pricing page (/register?plan=pro&interval=year).
// It is information only: the plan itself is started from the Billing page after they register, confirm their email and sign in.
import Link from "next/link";
import { money } from "@/lib/billing-format";
import { PUBLIC_PLANS, PUBLIC_TRIAL_MONTHS } from "@/lib/pricing-public";

export function ChosenPlanNote({ plan, interval }: { plan?: string; interval?: string }) {
  const chosen = PUBLIC_PLANS.find((candidate) => candidate.key === plan);
  if (!chosen) return null;

  const yearly = interval === "year" && chosen.yearly !== null;
  const trial = `${PUBLIC_TRIAL_MONTHS} month${PUBLIC_TRIAL_MONTHS === 1 ? "" : "s"}`;
  const price = yearly ? `${money(chosen.yearly ?? 0)}/year` : `${money(chosen.monthly)}/month`;

  return (
    <div className="mb-5 rounded-2xl bg-accent-tint px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-accent-dark">Your plan: {chosen.name}</p>
          <p className="text-xs text-accent-dark">{chosen.monthly > 0 ? `${trial} free, then ${price}` : "Free, no card needed"}</p>
        </div>
        <Link href="/pricing" className="text-xs font-semibold text-accent-dark underline">
          Change
        </Link>
      </div>
      <p className="mt-2 text-xs text-body">
        {chosen.monthly > 0
          ? "Next: confirm your email and sign in, then open Billing to start your free trial. You are not charged today."
          : "Next: confirm your email and sign in. You can upgrade any time from Billing."}
      </p>
    </div>
  );
}
