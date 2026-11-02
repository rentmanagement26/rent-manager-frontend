// A short pricing preview for the landing page: the three plans at a glance and a link to the full pricing page.
import Link from "next/link";
import { PUBLIC_PLANS, PUBLIC_TRIAL_MONTHS } from "@/lib/pricing-public";

const BLURB: Record<string, string> = {
  basic: "1 property, 3 units",
  pro: "5 properties, 20 units, renewal reminders",
  max: "25 properties, 100 units, reports",
};

export function PricingTeaser() {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 pb-14 sm:px-8">
      <div className="mx-auto mb-7 max-w-xl text-center">
        <span className="text-xs font-extrabold uppercase tracking-[0.08em] text-accent">Pricing</span>
        <h2 className="mt-1.5 font-head text-2xl font-extrabold leading-tight tracking-tight text-heading sm:text-[28px]">Start free. Grow when you are ready.</h2>
        <p className="mt-2 text-sm text-muted">Try Pro or Max free for {PUBLIC_TRIAL_MONTHS} month{PUBLIC_TRIAL_MONTHS === 1 ? "" : "s"}. Cancel any time.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {PUBLIC_PLANS.map((plan) => {
          const popular = plan.key === "pro";
          return (
            <div key={plan.key} className={`rounded-[20px] border p-5 ${popular ? "border-heading bg-heading text-white" : "border-subtle bg-white text-heading"}`}>
              <p className="text-[15px] font-bold">{plan.name}</p>
              <p className="mt-2 text-3xl font-extrabold tracking-tight">
                ${plan.monthly}
                <span className={`ml-1 text-xs font-semibold tracking-normal ${popular ? "text-[#a9c2bb]" : "text-muted"}`}>/month</span>
              </p>
              <p className={`mt-1.5 text-[12.5px] ${popular ? "text-[#b9d0c9]" : "text-muted"}`}>{BLURB[plan.key]}</p>
            </div>
          );
        })}
      </div>
      <p className="mt-5 text-center">
        <Link href="/pricing" className="inline-block rounded-[14px] border-[1.5px] border-default bg-white px-5 py-3 text-sm font-bold text-heading hover:border-accent hover:text-accent-dark">
          Compare all plans
        </Link>
      </p>
    </section>
  );
}
