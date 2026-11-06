"use client";

// The two popups on a quote: accept it (it becomes the job) and enter a quote for a contractor who is not in the app (from a phone call or
// an emailed PDF). The accept popup sends the amount it is showing; if the contractor revised the quote meanwhile the backend refuses
// ("changed") and the page reloads with the new amount.
import { useState } from "react";
import { BillingDialog, ghostButton, primaryButton } from "@/components/billing-dialog";
import { HowPill } from "@/components/contractor-parts";
import { useRunner } from "@/components/maintenance-request-actions";
import { QuoteFields, useQuoteForm } from "@/components/quote-fields";
import { acceptQuoteAction, submitQuoteAction } from "@/lib/contractor-actions";
import type { Quote } from "@/lib/contractor-types";
import { formatCents, taxWords } from "@/lib/maintenance-format";

const inputClass = "w-full rounded-lg border border-default px-3 py-2.5 text-sm text-heading placeholder:text-muted focus:border-accent focus:outline-none";

// The quote being accepted or revised: who, how much, and the taxes.
function QuoteSummary({ quote }: { quote: Quote }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border-[1.5px] border-accent p-3">
      <div>
        <p className="text-sm font-semibold text-heading">{quote.contractor.displayName} <HowPill howTheyWork={quote.contractor.howTheyWork} /></p>
        {quote.quoteNote && <p className="mt-0.5 text-xs text-muted">&ldquo;{quote.quoteNote}&rdquo;</p>}
      </div>
      {quote.amountCents !== null && (
        <p className="text-right">
          <span className="block font-head text-lg font-bold text-heading">{formatCents(quote.amountCents)}</span>
          <span className="block text-xs text-muted">{taxWords(quote.taxMode)}</span>
        </p>
      )}
    </div>
  );
}

export function AcceptQuoteDialog({ requestId, quote, onClose }: { requestId: number; quote: Quote; onClose: () => void }) {
  const [instructions, setInstructions] = useState("");
  const [share, setShare] = useState(false);
  const { busy, error, run } = useRunner();

  async function accept() {
    if (quote.amountCents === null || !quote.taxMode) return;
    if (await run(() => acceptQuoteAction(requestId, quote.id, quote.amountCents!, quote.taxMode!.toLowerCase(), instructions, share))) onClose();
  }

  return (
    <BillingDialog title="Accept this quote" subtitle={quote.contractor.displayName}>
      <QuoteSummary quote={quote} />

      <label htmlFor="accept-instructions" className="mb-1.5 mt-4 block text-sm font-semibold text-heading">
        Instructions for the job <span className="font-normal text-muted">(optional, up to 1,000 characters)</span>
      </label>
      <textarea id="accept-instructions" rows={3} maxLength={1000} value={instructions} onChange={(event) => setInstructions(event.target.value)} className={inputClass} />

      <label className="mt-3 flex cursor-pointer gap-2 text-sm">
        <input type="checkbox" checked={share} onChange={(event) => setShare(event.target.checked)} className="mt-1" />
        <span className="font-semibold text-heading">Share the tenant&apos;s name and phone with the contractor</span>
      </label>

      <p className="mt-3 rounded-lg bg-brand-green-tint px-3 py-2 text-xs text-brand-green-dark">
        {quote.contractor.displayName} gets the job, already accepted
        {quote.amountCents !== null && <>, at {formatCents(quote.amountCents)} ({taxWords(quote.taxMode)})</>}. The other contractors are told they were not selected, with no reason.
        The amount is only ever shown to you and {quote.contractor.displayName}.
      </p>

      {error && <p role="alert" className="mt-3 text-sm font-medium text-red-700">{error}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} disabled={busy} className={ghostButton}>Cancel</button>
        <button type="button" onClick={accept} disabled={busy} className={primaryButton}>{busy ? "Accepting…" : "Accept the quote"}</button>
      </div>
    </BillingDialog>
  );
}

// Enter (or revise) a quote for a contractor who is not in the app. Money is typed in dollars and sent in whole cents.
export function EnterQuoteDialog({ requestId, quote, onClose }: { requestId: number; quote: Quote; onClose: () => void }) {
  const form = useQuoteForm({ amountCents: quote.amountCents, taxMode: quote.taxMode, note: quote.quoteNote, validUntil: quote.validUntil });
  const [localError, setLocalError] = useState("");
  const { busy, error, run } = useRunner();

  async function save() {
    const read = form.read();
    if ("error" in read) return setLocalError(read.error);
    setLocalError("");
    const { amountCents, taxMode, note, validUntil } = read.input;
    if (await run(() => submitQuoteAction(requestId, quote.id, amountCents, taxMode.toLowerCase(), note ?? "", validUntil ?? ""))) onClose();
  }

  return (
    <BillingDialog title={`Enter ${quote.contractor.displayName}'s quote`} subtitle="From a phone call or a PDF they emailed. Only you and they see it.">
      <QuoteFields form={form} />

      {(localError || error) && <p role="alert" className="mt-3 text-sm font-medium text-red-700">{localError || error}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} disabled={busy} className={ghostButton}>Cancel</button>
        <button type="button" onClick={save} disabled={busy} className={primaryButton}>{busy ? "Saving…" : "Save the quote"}</button>
      </div>
    </BillingDialog>
  );
}
