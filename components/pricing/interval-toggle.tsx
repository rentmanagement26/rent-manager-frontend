"use client";

// The Monthly / Yearly switch above the plan cards. `maxSaving` (the biggest yearly saving, in dollars) shows as a small badge.
import type { BillingInterval } from "@/lib/types";

interface Props {
  value: BillingInterval;
  onChange: (value: BillingInterval) => void;
  maxSaving: number | null;
}

export function IntervalToggle({ value, onChange, maxSaving }: Props) {
  const option = (key: BillingInterval, label: string) => (
    <button
      key={key}
      type="button"
      aria-pressed={value === key}
      onClick={() => onChange(key)}
      className={`flex items-center gap-2 rounded-full px-[18px] py-[7px] text-[13px] font-semibold ${value === key ? "bg-heading text-white" : "text-body hover:text-heading"}`}
    >
      {label}
      {key === "year" && maxSaving ? <span className="rounded-full bg-brand-green-tint px-2 py-0.5 text-[11px] font-bold text-brand-green-dark">Save up to ${Math.round(maxSaving)}</span> : null}
    </button>
  );

  return (
    <div className="inline-flex rounded-full border border-subtle bg-white p-1" role="group" aria-label="Billing period">
      {option("month", "Monthly")}
      {option("year", "Yearly")}
    </div>
  );
}
