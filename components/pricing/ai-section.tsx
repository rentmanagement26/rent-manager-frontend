// The "AI assistant tasks" panel: what the AI does, how much of it each plan allows, and the promise that the landlord approves every
// action. Static content from lib/pricing-content.ts, so it works on the public page and inside the portal.
import { Icon } from "@/components/pricing/icons";
import { AI_TIERS } from "@/lib/pricing-content";
import type { PlanKey } from "@/lib/pricing-content";

const RADIUS = 56;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const NAMES: Record<PlanKey, string> = { basic: "Basic", pro: "Pro", max: "Max" };

// A circle that fills as the monthly allowance grows (1,000 tasks is a full circle). The number sits inside it.
function AllowanceRing({ tasks }: { tasks: number }) {
  const filled = Math.max(0.06, tasks / 1000) * CIRCUMFERENCE;
  return (
    <div className="relative mx-auto my-4 h-[132px] w-[132px]">
      <svg width="132" height="132" viewBox="0 0 132 132" className="block -rotate-90" aria-hidden="true">
        <circle cx="66" cy="66" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="8" />
        <circle cx="66" cy="66" r={RADIUS} fill="none" stroke="#d9601f" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${filled} ${CIRCUMFERENCE}`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <b className="text-[25px] font-extrabold tracking-tight text-white">{tasks.toLocaleString("en-CA")}</b>
        <span className="mt-1.5 text-center text-[10px] font-semibold leading-tight text-[#b9d0c9]">
          tasks
          <br />a month
        </span>
      </div>
    </div>
  );
}

// `highlight` outlines one plan's card (the landlord's own plan, or the popular one).
export function AiSection({ highlight }: { highlight?: PlanKey }) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-heading px-6 pb-7 pt-7 text-white">
      <div className="pointer-events-none absolute -right-[70px] -top-[70px] h-[220px] w-[220px] rounded-full border border-white/10" />
      <div className="pointer-events-none absolute -right-5 -top-5 h-[120px] w-[120px] rounded-full border border-white/10" />

      <div className="relative flex items-center gap-3.5">
        <span className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-2xl bg-accent text-white">
          <Icon name="sparkles" className="h-6 w-6" />
        </span>
        <div>
          <h3 className="font-head text-[22px] font-extrabold text-white">AI assistant tasks</h3>
          <p className="mt-0.5 text-[13.5px] text-[#b9d0c9]">The AI does the prep work: drafts reminders, summaries, replies and triage. Each draft counts as one task.</p>
        </div>
      </div>

      <div className="relative mt-5 flex flex-wrap items-center gap-2 text-[12.5px] font-semibold">
        <span className="flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2">
          <Icon name="wand" />
          AI prepares a draft
        </span>
        <Icon name="arrowRight" className="h-4 w-4 text-[#8fb0a7]" />
        <span className="flex items-center gap-2 rounded-full bg-accent px-3.5 py-2">
          <Icon name="userCheck" />
          You review and approve
        </span>
        <Icon name="arrowRight" className="h-4 w-4 text-[#8fb0a7]" />
        <span className="flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-2">
          <Icon name="history" />
          Done and logged
        </span>
      </div>

      <div className="relative mt-5 grid gap-3 sm:grid-cols-3">
        {AI_TIERS.map((tier) => (
          <div key={tier.plan} className={`flex flex-col rounded-[20px] border px-3.5 pb-4 pt-5 text-center ${highlight === tier.plan ? "border-accent/70 bg-accent/15" : "border-white/10 bg-white/5"}`}>
            <p className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-[#b9d0c9]">{NAMES[tier.plan]}</p>
            <AllowanceRing tasks={tier.tasksPerMonth} />
            <p className="text-[15px] font-extrabold">{tier.mode}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-[#b9d0c9]">{tier.note}</p>
            {/* Pushed to the bottom of the card so the three badges line up whatever the text above them is. */}
            <div className="mt-auto pt-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dff5f2]/15 px-3 py-1.5 text-[11.5px] font-bold text-[#dff5f2]">
                <Icon name="userCheck" className="h-3.5 w-3.5" />
                You approve each one
              </span>
            </div>
          </div>
        ))}
      </div>

      <p className="relative mt-5 flex items-center gap-2.5 text-[12.5px] leading-snug text-[#d3e4df]">
        <Icon name="shield" className="h-5 w-5 flex-none text-[#8fe3cf]" />
        <span>You approve every action. The AI never sends a message, charges a payment or changes a record on its own.</span>
      </p>
    </section>
  );
}
