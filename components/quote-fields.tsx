"use client";

// The fields of a quote — total amount, taxes included or extra, a note, and a valid-until day — and the state behind them. Used where the
// landlord enters a quote for a contractor and where a contractor sends their own. Money is typed in dollars and sent in whole cents.
import { useState } from "react";
import { ChoiceChips } from "@/components/choice-chips";
import type { QuoteInput } from "@/lib/contractor-portal-types";
import { dollarsToCents } from "@/lib/maintenance-format";

const inputClass = "w-full rounded-lg border border-default px-3 py-2.5 text-sm text-heading placeholder:text-muted focus:border-accent focus:outline-none";
const labelClass = "mb-1.5 mt-3 block text-sm font-semibold text-heading";

// What a quote already says (when revising one), as the backend stores it.
export interface QuoteDraft {
  amountCents: number | null;
  taxMode: string | null;
  note: string | null;
  validUntil: string | null;
}

// The state of the quote fields, and a check that turns them into what the backend wants (or says what is missing).
export function useQuoteForm(draft?: QuoteDraft) {
  const [amount, setAmount] = useState(draft?.amountCents != null ? (draft.amountCents / 100).toFixed(2) : "");
  const [tax, setTax] = useState(draft?.taxMode ?? "Extra");
  const [note, setNote] = useState(draft?.note ?? "");
  const [validUntil, setValidUntil] = useState(draft?.validUntil ?? "");

  // The quote to send, or the problem to show. Nothing is sent when the amount is not a valid number of dollars.
  function read(): { input: QuoteInput } | { error: string } {
    const cents = dollarsToCents(amount);
    if (cents === null) return { error: "Enter the amount, for example 480.00." };
    return { input: { amountCents: cents, taxMode: tax, note: note.trim() || null, validUntil: validUntil || null } };
  }

  return { amount, setAmount, tax, setTax, note, setNote, validUntil, setValidUntil, read };
}

export function QuoteFields({ form }: { form: ReturnType<typeof useQuoteForm> }) {
  return (
    <>
      <label htmlFor="quote-amount" className="mb-1.5 block text-sm font-semibold text-heading">Total amount (CAD) *</label>
      <input id="quote-amount" inputMode="decimal" value={form.amount} onChange={(event) => form.setAmount(event.target.value)} placeholder="480.00" className={`${inputClass} max-w-[180px]`} />

      <div className="mt-3">
        <ChoiceChips
          label="Taxes"
          options={[{ value: "Included", label: "Taxes included" }, { value: "Extra", label: "Taxes extra" }]}
          selected={[form.tax]}
          onToggle={form.setTax}
        />
      </div>

      <label htmlFor="quote-note-text" className={labelClass}>Note <span className="font-normal text-muted">(optional)</span></label>
      <textarea id="quote-note-text" rows={2} maxLength={1000} value={form.note} onChange={(event) => form.setNote(event.target.value)} className={inputClass} />

      <label htmlFor="quote-valid" className={labelClass}>Valid until <span className="font-normal text-muted">(optional)</span></label>
      <input id="quote-valid" type="date" value={form.validUntil} onChange={(event) => form.setValidUntil(event.target.value)} className={`${inputClass} max-w-[200px]`} />
    </>
  );
}
