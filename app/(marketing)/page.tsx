import Link from "next/link";
import { HeroShowcase } from "@/components/hero-showcase";
import { FaqSection } from "@/components/faq-section";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col overflow-x-hidden">
      {/* 1. HERO SECTION (Side-by-Side Split) */}
      <section className="relative px-6 pt-12 pb-16 sm:px-8 lg:pt-20 lg:pb-24 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left Column: Copy & Form */}
          <div className="flex flex-col items-start text-left space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent-tint px-3.5 py-1 text-xs font-semibold text-accent-dark border border-accent-tint">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              Built for Canadian Landlords &amp; Tenants
            </span>

            <h1 className="font-head text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-heading leading-[1.15]">
              One app to manage <br />
              <span className="text-accent">all your rentals.</span>
            </h1>

            <p className="text-base sm:text-lg text-muted max-w-lg leading-relaxed">
              One home for your rental business — properties, tenants, leases, and payments — being built around Ontario &amp; Manitoba tenancy law from day one.
            </p>

            {/* Email Form */}
            <form action="/register" method="GET" className="w-full max-w-md space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email address"
                  className="flex-1 rounded-xl border border-default bg-surface px-4 py-3 text-sm text-heading placeholder:text-muted focus:outline-none focus:border-accent shadow-sm"
                  required
                />
                <button
                  type="submit"
                  className="rounded-xl bg-accent px-6 py-3 font-semibold text-white shadow-md shadow-accent/25 hover:bg-accent-dark transition-all whitespace-nowrap"
                >
                  Get Started
                </button>
              </div>
              <div className="text-[11px] font-semibold text-muted tracking-wide">
                FREE TO GET STARTED • NO CREDIT CARD REQUIRED
              </div>
            </form>

            {/* Trust badges */}
            <div className="pt-4 border-t border-default w-full flex flex-wrap items-center gap-5 text-xs text-muted">
              <div className="flex items-center gap-1">
                <span>🍁</span> Ontario &amp; Manitoba Ready
              </div>
              <div className="flex items-center gap-1">
                <span>🔒</span> Privacy-first by design
              </div>
            </div>
          </div>

          {/* Right Column: Hero Dashboard Mockup */}
          <div className="flex justify-center lg:justify-end w-full">
            <HeroShowcase />
          </div>
        </div>
      </section>

      {/* 2. COMPLIANCE & LEGAL TRUST TICKER */}
      <section className="border-y border-default bg-subtle px-6 py-6 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-around gap-6 text-center text-xs sm:text-sm font-semibold text-body">
          <div>🍁 <strong>Ontario RTA:</strong> Standard Lease tools — in progress</div>
          <div>⚖️ <strong>Manitoba RTB:</strong> Deposit-limit guardrails — in progress</div>
          <div>🛡️ <strong>PIPEDA:</strong> Privacy-first data handling</div>
          <div>✉️ <strong>CASL:</strong> Compliant tenant notices</div>
        </div>
      </section>

      {/* 3. 3-COLUMN FEATURE CARDS */}
      <section id="features" className="px-6 py-20 sm:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-accent">Feature Suite</span>
          <h2 className="mt-2 font-head text-3xl font-bold tracking-tight text-heading sm:text-4xl">
            Everything your rental business needs
          </h2>
          <p className="mt-3 text-muted text-sm sm:text-base">
            Replace disconnected spreadsheets, paper leases, and messy email chains.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-7 rounded-2xl border border-default bg-surface space-y-3 shadow-sm hover:shadow-md transition-all">
            <div className="w-11 h-11 rounded-xl bg-accent-tint text-accent-dark flex items-center justify-center text-xl font-bold">
              🏢
            </div>
            <h3 className="font-head text-lg font-bold text-heading">For Landlords</h3>
            <p className="text-sm text-muted leading-relaxed">
              Track every property and unit, monitor occupancy in real time, and manage it all from one dashboard — with Ontario &amp; Manitoba–compliant leases and rent reconciliation on the way.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-7 rounded-2xl border border-default bg-surface space-y-3 shadow-sm hover:shadow-md transition-all">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
              📱
            </div>
            <h3 className="font-head text-lg font-bold text-heading">For Tenants</h3>
            <p className="text-sm text-muted leading-relaxed">
              View your lease and rent history, and submit maintenance requests in a few clicks — with online rent payments and digital lease signing coming soon.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-7 rounded-2xl border border-default bg-surface space-y-3 shadow-sm hover:shadow-md transition-all">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-xl font-bold">
              🛠️
            </div>
            <h3 className="font-head text-lg font-bold text-heading">For Contractors</h3>
            <p className="text-sm text-muted leading-relaxed">
              Get work orders as they come in and coordinate with landlords on scheduling — with entry-notice tracking, photo uploads, and invoicing on the way.
            </p>
          </div>
        </div>
      </section>

      {/* 4. FAQ SECTION */}
      <section id="faq" className="px-6 py-20 sm:px-8 bg-subtle border-t border-default">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-accent">Got Questions?</span>
            <h2 className="mt-2 font-head text-2xl sm:text-3xl font-bold tracking-tight text-heading">
              Frequently Asked Questions
            </h2>
          </div>
          <FaqSection />
        </div>
      </section>

      {/* 5. BOTTOM CONVERSION BANNER */}
      <section className="px-6 py-20 sm:px-8 max-w-5xl mx-auto w-full">
        <div className="rounded-3xl bg-heading p-8 sm:p-14 text-center text-white space-y-6 shadow-xl">
          <h2 className="font-head text-2xl sm:text-4xl font-extrabold text-white">
            Ready to upgrade your rental management?
          </h2>
          <p className="max-w-xl mx-auto text-sm sm:text-base text-white/70">
            Built for Canadian landlords and tenants — designed around Ontario &amp; Manitoba tenancy law from the ground up.
          </p>
          <div className="pt-2">
            <Link
              href="/register"
              className="inline-block rounded-xl bg-accent px-8 py-4 font-bold text-white shadow-lg hover:bg-accent-dark transition-all"
            >
              Get Started with DomusPRO
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}