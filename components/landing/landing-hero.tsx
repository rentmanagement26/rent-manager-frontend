// The top of the new landing page: the headline, two buttons, and three softly floating cards that show what the product does.
import Link from "next/link";
import { Icon } from "@/components/pricing/icons";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden px-6 pb-14 pt-14 sm:px-8 lg:pt-20">
      {/* Two soft colour circles behind the content. */}
      <div className="pointer-events-none absolute -right-24 -top-28 h-[360px] w-[360px] rounded-full bg-accent-tint" />
      <div className="pointer-events-none absolute -bottom-16 -left-20 h-[220px] w-[220px] rounded-full bg-brand-green-tint" />

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-accent-tint px-3 py-1 text-xs font-bold text-accent-dark">
            <span className="landing-pulse h-[7px] w-[7px] rounded-full bg-accent" />
            Built for Canadian landlords and tenants
          </span>
          <h1 className="mt-4 font-head text-4xl font-extrabold leading-[1.08] tracking-tight text-heading sm:text-5xl lg:text-[56px]">
            Your rentals, <span className="text-accent">running themselves.</span>
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-body">
            Leases, signatures, renewals and reminders in one calm place. The AI prepares the paperwork. You approve every step.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/register" className="rounded-[14px] bg-accent px-5 py-3 text-sm font-bold text-white shadow-[0_10px_24px_-10px_rgba(217,96,31,0.8)] hover:bg-accent-dark">
              Start free
            </Link>
            <Link href="/pricing" className="rounded-[14px] border-[1.5px] border-default bg-white px-5 py-3 text-sm font-bold text-heading hover:border-accent hover:text-accent-dark">
              See pricing
            </Link>
          </div>
          <p className="mt-3 text-[11.5px] font-bold tracking-wide text-muted">FREE TO START &bull; NO CARD NEEDED</p>
        </div>

        <div className="relative mx-auto h-[330px] w-full max-w-md">
          <div className="landing-float absolute left-[4%] top-0 w-[78%] rounded-[18px] border border-subtle bg-white p-4 shadow-[0_18px_40px_-18px_rgba(22,48,43,0.35)]">
            <div className="flex items-center gap-2.5">
              <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[11px] bg-brand-green-tint text-brand-green"><Icon name="pen" className="h-[18px] w-[18px]" /></span>
              <div>
                <p className="text-[13.5px] font-bold text-heading">Lease signed online</p>
                <p className="text-[11.5px] text-muted">Maple Street Duplex &middot; both parties</p>
              </div>
            </div>
          </div>

          <div className="landing-float absolute right-0 top-[96px] w-[72%] rounded-[18px] border border-heading bg-heading p-4 shadow-[0_18px_40px_-18px_rgba(22,48,43,0.5)] [animation-delay:-2s]">
            <div className="flex items-center gap-2.5">
              <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[11px] bg-accent text-white"><Icon name="sparkles" className="h-[18px] w-[18px]" /></span>
              <div>
                <p className="text-[13.5px] font-bold text-white">AI draft ready</p>
                <p className="text-[11.5px] text-[#a9c2bb]">Rent reminder for 3 tenants</p>
              </div>
            </div>
            <span className="mt-2 inline-block rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-white">Review and approve</span>
          </div>

          <div className="landing-float absolute left-0 top-[208px] w-[80%] rounded-[18px] border border-subtle bg-white p-4 shadow-[0_18px_40px_-18px_rgba(22,48,43,0.35)] [animation-delay:-4s]">
            <div className="flex items-center gap-2.5">
              <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[11px] bg-accent-tint text-accent"><Icon name="calendar" className="h-[18px] w-[18px]" /></span>
              <div>
                <p className="text-[13.5px] font-bold text-heading">Renewal in 60 days</p>
                <p className="text-[11.5px] text-muted">Notice date set, reminder booked</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
