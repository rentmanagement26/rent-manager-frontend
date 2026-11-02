"use client";

// The public pricing page body: heading, Monthly/Yearly switch, the three plan cards, the AI panel and the collapsed comparison.
// Every plan button goes to registration with the chosen plan and billing period in the address (/register?plan=pro&interval=year).
import Link from "next/link";
import { useState } from "react";
import { AiSection } from "@/components/pricing/ai-section";
import { IntervalToggle } from "@/components/pricing/interval-toggle";
import { PlanCard } from "@/components/pricing/plan-card";
import { PlanComparison } from "@/components/pricing/plan-comparison";
import { PUBLIC_PLANS, PUBLIC_TRIAL_MONTHS } from "@/lib/pricing-public";
import { PLAN_COPY } from "@/lib/pricing-content";
import { yearlyPerMonth, yearlySaving } from "@/lib/pricing-math";
import { money } from "@/lib/billing-format";
import type { BillingInterval } from "@/lib/types";

const trialText = `${PUBLIC_TRIAL_MONTHS} month${PUBLIC_TRIAL_MONTHS === 1 ? "" : "s"}`;
const maxSaving = Math.max(...PUBLIC_PLANS.map((plan) => (plan.yearly ? yearlySaving(plan.monthly, plan.yearly) : 0)));

export function PricingView() {
  const [interval, setInterval] = useState<BillingInterval>("month");

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-5 py-12 sm:px-8 lg:py-16">
      <header className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent-tint px-3 py-1 text-xs font-bold text-accent-dark">
          <span className="h-[7px] w-[7px] rounded-full bg-accent" />
          Simple pricing for Canadian landlords
        </span>
        <h1 className="mt-3 font-head text-3xl font-extrabold leading-tight tracking-tight text-heading sm:text-4xl">
          Plans that grow with <span className="text-accent">your portfolio.</span>
        </h1>
        <p className="mt-2 text-[15px] text-muted">Try Pro or Max free for {trialText}. Cancel any time.</p>
        <div className="mt-5">
          <IntervalToggle value={interval} onChange={setInterval} maxSaving={maxSaving} />
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {PUBLIC_PLANS.map((plan) => {
          const copy = PLAN_COPY[plan.key];
          const paid = plan.monthly > 0;
          const yearly = interval === "year" && plan.yearly !== null;
          const saving = plan.yearly ? yearlySaving(plan.monthly, plan.yearly) : 0;
          return (
            <PlanCard
              key={plan.key}
              name={plan.name}
              tagline={copy.tagline}
              highlights={copy.highlights}
              popular={copy.popular}
              price={!paid ? "$0" : yearly ? money(yearlyPerMonth(plan.yearly ?? 0)) : `$${plan.monthly}`}
              billingNote={!paid ? "No card needed" : yearly ? `Billed yearly at $${plan.yearly}` : "Billed monthly"}
              trialLabel={paid ? `${trialText} free` : "Free forever"}
              savingLabel={paid && saving > 0 ? (yearly ? `Save $${saving} a year` : `Save $${saving} with yearly`) : null}
              onSwitchToYearly={paid && !yearly && saving > 0 ? () => setInterval("year") : undefined}
            >
              <Link
                href={`/register?plan=${plan.key}&interval=${yearly ? "year" : "month"}`}
                className={`block w-full rounded-[14px] border-[1.5px] px-4 py-3 text-center text-[13.5px] font-bold ${
                  copy.popular ? "border-accent bg-accent text-white shadow-[0_8px_20px_-8px_rgba(217,96,31,0.75)] hover:bg-accent-dark" : "border-default bg-white text-heading hover:border-accent hover:text-accent-dark"
                }`}
              >
                {paid ? `Start ${PUBLIC_TRIAL_MONTHS}-month free trial` : "Start free"}
              </Link>
            </PlanCard>
          );
        })}
      </div>

      <AiSection highlight="pro" />
      <PlanComparison />

      <p className="text-center text-[12.5px] text-muted">
        Prices in CAD. Paid plans ask for a card and renew after the free month. Already have an account?{" "}
        <Link href="/login" className="font-bold text-accent hover:text-accent-dark">
          Sign in
        </Link>
      </p>
    </div>
  );
}
