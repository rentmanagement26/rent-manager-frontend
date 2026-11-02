// A PREVIEW of the new landing page, not linked from anywhere and hidden from search engines. The live home page (/) is still the
// old one. To make this the home page, move this page's content into app/(marketing)/page.tsx and delete this folder.
import type { Metadata } from "next";
import { ClosingBanner } from "@/components/landing/closing-banner";
import { FeatureGrid } from "@/components/landing/feature-grid";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LandingHero } from "@/components/landing/landing-hero";
import { PricingTeaser } from "@/components/landing/pricing-teaser";
import { TrustStrip } from "@/components/landing/trust-strip";
import { FaqSection } from "@/components/faq-section";

export const metadata: Metadata = {
  title: "Landing preview",
  robots: { index: false, follow: false },
};

export default function LandingPreviewPage() {
  return (
    <main className="flex flex-1 flex-col overflow-x-hidden">
      <LandingHero />
      <TrustStrip />
      <HowItWorks />
      <FeatureGrid />
      <PricingTeaser />

      <section id="faq" className="border-t border-default bg-subtle px-6 py-16 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <span className="text-xs font-extrabold uppercase tracking-[0.08em] text-accent">Got questions?</span>
            <h2 className="mt-1.5 font-head text-2xl font-extrabold tracking-tight text-heading sm:text-3xl">Frequently asked questions</h2>
          </div>
          <FaqSection />
        </div>
      </section>

      <ClosingBanner />
    </main>
  );
}
