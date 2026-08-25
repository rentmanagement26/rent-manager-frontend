"use client";

import { useState } from "react";

const faqs = [
  {
    q: "Is DomusPRO built around Ontario and Manitoba tenancy law?",
    a: "Yes — DomusPRO is being built specifically for Canadian tenancy regulations. We're designing our lease and deposit tools around the Ontario Standard Lease (OSL) requirements and Manitoba RTB rules, including the 0.5-month deposit cap, as those features roll out.",
  },
  {
    q: "How does DomusPRO protect tenant privacy under PIPEDA?",
    a: "We follow PIPEDA's data-minimization principle from the ground up — for example, we never ask for a Social Insurance Number (SIN) during registration or tenant screening. As lease and record storage comes online, it'll be encrypted in transit and at rest.",
  },
  {
    q: "How will rent payments and tracking work?",
    a: "Online rent payments with automatic reconciliation (Interac e-Transfer and pre-authorized debit) are on our roadmap — landlords will get instant payment notifications and tenants will get automatic rent receipts.",
  },
  {
    q: "Will contractors be able to update work orders without accessing private tenant data?",
    a: "That's the plan for the Contractor Portal — it'll show only the specific work order, property address, and entry-notice confirmation, without exposing personal lease or financial information.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {faqs.map((faq, idx) => (
        <div
          key={idx}
          className="rounded-2xl border border-default bg-surface transition-all overflow-hidden"
        >
          <button
            onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
            className="flex w-full items-center justify-between p-5 text-left font-head font-bold text-heading text-base sm:text-lg hover:bg-subtle/50"
          >
            <span>{faq.q}</span>
            <span className="ml-4 text-accent font-mono text-xl">
              {openIndex === idx ? "−" : "+"}
            </span>
          </button>
          {openIndex === idx && (
            <div className="p-5 pt-0 text-sm sm:text-base leading-relaxed text-muted border-t border-subtle">
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}