// The public pricing page (/pricing): the plans, what each includes, and a button to start. No sign-in needed.
import type { Metadata } from "next";
import { PricingView } from "@/components/pricing/pricing-view";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple plans for Canadian landlords. Start free, or try Pro or Max free for one month.",
};

export default function PricingPage() {
  return (
    <main className="flex-1">
      <PricingView />
    </main>
  );
}
