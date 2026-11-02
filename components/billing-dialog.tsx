"use client";

// Shared pieces of the Billing popups (switch plan, cancel plan): the dark backdrop and white card, the button styles, and the
// selectable option row. Matches the renewal popup so every popup in the landlord portal looks the same.
import type { ReactNode } from "react";

export const primaryButton = "rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50";
export const ghostButton = "rounded-full border border-default bg-white px-4 py-2 text-sm font-semibold text-heading hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-50";

// The popup frame. The page behind it is not clickable; the buttons inside close it.
export function BillingDialog({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="font-head text-lg font-bold text-heading">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

// One selectable choice (a radio-style card) with a title, an optional "Recommended" tag and a short note.
export function ChoiceRow({ selected, onSelect, title, note, tag }: { selected: boolean; onSelect: () => void; title: string; note: string; tag?: string }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex w-full gap-3 rounded-xl border-[1.5px] p-3 text-left ${selected ? "border-accent bg-accent-tint" : "border-default bg-white hover:border-accent"}`}
    >
      <span className={`mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 ${selected ? "border-accent bg-accent" : "border-slate-300"}`} />
      <span>
        <span className="block text-sm font-semibold text-heading">
          {title} {tag && <span className="ml-1 rounded-full bg-accent-tint px-2 py-0.5 text-[11px] font-semibold text-accent">{tag}</span>}
        </span>
        <span className="block text-xs text-muted">{note}</span>
      </span>
    </button>
  );
}

// A label and an amount on one line, for the cost breakdown. `strong` makes the line stand out (what is charged today).
export function AmountRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 py-1.5 text-sm ${strong ? "border-t border-default pt-2.5 font-semibold text-heading" : "text-body"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
