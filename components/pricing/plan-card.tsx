// One plan card, used on the public pricing page and the Billing page so both look the same. The popular plan is a dark card.
// It only draws; the caller passes the price text, the pills and the button (what the button does differs between the two pages).
import type { ReactNode } from "react";
import { Icon } from "@/components/pricing/icons";

interface Props {
  name: string;
  tagline: string;
  highlights: string[];
  popular?: boolean;
  // The big number, for example "$20" or "$18.33", and the line under it ("Billed monthly", "Billed yearly at $220").
  price: string;
  billingNote: string;
  // Pill texts. `savingLabel` is a button when `onSwitchToYearly` is given (monthly view: "Save $20 with yearly"), plain text otherwise.
  trialLabel?: string | null;
  savingLabel?: string | null;
  onSwitchToYearly?: () => void;
  // A short line for a custom price, shown above the button.
  extraNote?: string | null;
  // Marks the landlord's own plan.
  current?: boolean;
  children: ReactNode;
}

export function PlanCard({ name, tagline, highlights, popular, price, billingNote, trialLabel, savingLabel, onSwitchToYearly, extraNote, current, children }: Props) {
  const dark = !!popular;
  const pill = dark ? "bg-white/15 text-white" : "bg-brand-green-tint text-brand-green-dark";
  const trialPill = dark ? "bg-accent/25 text-orange-100" : "bg-accent-tint text-accent-dark";

  return (
    <div
      className={`flex flex-col rounded-[22px] border p-5 ${
        dark ? "border-heading bg-heading text-white shadow-[0_18px_40px_-16px_rgba(22,48,43,0.55)]" : "border-subtle bg-white text-heading shadow-sm"
      } ${current ? "ring-2 ring-accent" : ""}`}
    >
      <div className="flex items-center justify-between text-base font-bold">
        <span>{name}</span>
        {popular && <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-white">Most popular</span>}
        {!popular && current && <span className="rounded-full bg-accent-tint px-2.5 py-1 text-[11px] font-bold text-accent-dark">Your plan</span>}
      </div>
      <p className={`mt-0.5 text-[13px] ${dark ? "text-[#a9c2bb]" : "text-muted"}`}>{tagline}</p>

      <p className="mt-4 flex flex-wrap items-baseline gap-1 text-[40px] font-extrabold leading-none tracking-tight">
        {price}
        <span className={`text-[13px] font-semibold tracking-normal ${dark ? "text-[#a9c2bb]" : "text-muted"}`}>per month</span>
      </p>
      <p className={`mt-2 min-h-[18px] text-[12.5px] font-semibold ${dark ? "text-[#dff5f2]" : "text-body"}`}>{billingNote}</p>

      <div className="mt-2.5 flex min-h-[26px] flex-wrap items-center gap-1.5">
        {trialLabel && <span className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold ${trialPill}`}>{trialLabel}</span>}
        {savingLabel &&
          (onSwitchToYearly ? (
            <button
              type="button"
              onClick={onSwitchToYearly}
              className={`rounded-full border-[1.5px] bg-transparent px-2.5 py-[3px] text-[11.5px] font-bold ${
                dark ? "border-white/40 text-[#dff5f2] hover:border-white" : "border-[#cfe9e3] text-brand-green-dark hover:border-brand-green"
              }`}
            >
              {savingLabel}
            </button>
          ) : (
            <span className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold ${pill}`}>{savingLabel}</span>
          ))}
      </div>

      <ul className={`mt-4 flex flex-1 flex-col gap-2.5 border-t pt-4 text-[13px] ${dark ? "border-white/15" : "border-[#eef0f4]"}`}>
        {highlights.map((line) => (
          <li key={line} className="flex items-start gap-2.5 leading-snug">
            <span className={`mt-px flex h-[19px] w-[19px] flex-none items-center justify-center rounded-full ${dark ? "bg-white/20 text-[#8fe3cf]" : "bg-brand-green-tint text-brand-green"}`}>
              <Icon name="check" className="h-3 w-3" />
            </span>
            <span>{line}</span>
          </li>
        ))}
      </ul>

      {extraNote && <p className={`mt-4 text-xs font-semibold ${dark ? "text-orange-200" : "text-accent"}`}>{extraNote}</p>}
      <div className="mt-5">{children}</div>
    </div>
  );
}
