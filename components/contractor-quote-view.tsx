"use client";

// One quote request as the contractor sees it, in the app and on the email link: the problem, what the landlord asks, and the form to send
// the quote (or a revised one until the landlord decides), attach a written quote, or say they will not quote. A closed quote is a summary of the
// contractor's own quote. Only the landlord sees a quote: never the tenant or another contractor.
import Link from "next/link";
import { useState } from "react";
import { AccessCard, Card, LandlordCard, ProblemCard, WhereCard } from "@/components/contractor-request-parts";
import { ReasonAction, useRunner } from "@/components/maintenance-request-actions";
import { QuoteFields, useQuoteForm } from "@/components/quote-fields";
import { WorkFiles, type WorkFileCalls } from "@/components/work-files";
import type { MyQuote, QuoteInput } from "@/lib/contractor-portal-types";
import type { ActionResult } from "@/lib/document-actions";
import { formatCalendarDate } from "@/lib/format-time";
import { formatCents, taxWords } from "@/lib/maintenance-format";

const primaryButton = "rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50";

const STATUS_PILL: Record<string, string> = {
  Requested: "bg-amber-100 text-amber-900",
  Submitted: "bg-brand-green-tint text-brand-green-dark",
  Accepted: "bg-green-100 text-green-800",
  Declined: "bg-red-100 text-red-800",
  NotSelected: "bg-subtle text-body",
  Cancelled: "bg-subtle text-body",
};

const STATUS_WORDS: Record<string, string> = {
  Requested: "Needs your quote",
  Submitted: "Quote sent",
  Accepted: "Accepted",
  Declined: "You declined",
  NotSelected: "Not selected",
  Cancelled: "Cancelled",
};

// The form to send (or revise) the quote. Money is typed in dollars and sent in whole cents.
function SendQuoteCard({ quote, onSubmit }: { quote: MyQuote; onSubmit: (input: QuoteInput) => Promise<ActionResult<unknown>> }) {
  const form = useQuoteForm({ amountCents: quote.amountCents, taxMode: quote.taxMode, note: quote.quoteNote, validUntil: quote.validUntil });
  const [localError, setLocalError] = useState("");
  const { busy, error, run } = useRunner();
  const revising = quote.status === "Submitted";

  async function send() {
    const read = form.read();
    if ("error" in read) return setLocalError(read.error);
    setLocalError("");
    await run(() => onSubmit(read.input));
  }

  return (
    <Card title={revising ? "Change your quote" : "Your quote"}>
      <QuoteFields form={form} />
      {(localError || error) && <p role="alert" className="mt-3 text-sm font-medium text-red-700">{localError || error}</p>}
      <button type="button" disabled={busy} onClick={send} className={`${primaryButton} mt-4`}>{busy ? "Sending…" : revising ? "Send the new quote" : "Send the quote"}</button>
      <p className="mt-2 text-xs text-muted">Only the landlord sees your quote and what you attach. Other contractors and the tenant never do. You can change it until the landlord decides.</p>
    </Card>
  );
}

export function ContractorQuoteView({
  quote,
  onSubmit,
  onDecline,
  files,
  jobHref,
}: {
  quote: MyQuote;
  onSubmit: (input: QuoteInput) => Promise<ActionResult<unknown>>;
  onDecline: (reason: string) => Promise<ActionResult<unknown>>;
  files: WorkFileCalls;
  // Where the job this quote became lives (only for a contractor with an account).
  jobHref?: string;
}) {
  const actions = quote.actions;
  return (
    <div className="max-w-6xl space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-head text-2xl font-bold text-heading">Quote request · {quote.number}</h1>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_PILL[quote.status]}`}>{STATUS_WORDS[quote.status]}</span>
        {quote.urgency === "Emergency" && <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800">Emergency</span>}
      </div>
      <p className="text-sm text-muted">{quote.title} · from {quote.landlordName}{quote.entryName ? ` · on their list as ${quote.entryName}` : ""}</p>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <ProblemCard description={quote.description} media={quote.media} />
          <AccessCard access={quote.access} />
          {quote.requestNote && <Card title="What the landlord asks"><p className="whitespace-pre-wrap text-sm text-heading">{quote.requestNote}</p></Card>}
          {actions.canSubmit && <SendQuoteCard quote={quote} onSubmit={onSubmit} />}
        </div>

        <div className="space-y-4">
          <WhereCard address={quote.address} placeLabel={quote.placeLabel} tenantLabel={quote.tenantLabel} />
          <LandlordCard text={null} contact={quote.landlordContact} />

          {quote.amountCents !== null && (
            <Card title="Your quote">
              <p className="font-head text-2xl font-bold text-heading">{formatCents(quote.amountCents)} <span className="text-sm font-normal text-muted">{taxWords(quote.taxMode)}</span></p>
              {quote.validUntil && <p className="mt-1 text-xs text-muted">Valid until {formatCalendarDate(quote.validUntil)}{quote.isExpired ? " (expired: send a new quote to extend it)" : ""}</p>}
              {quote.quoteNote && <p className="mt-2 text-sm text-body">&ldquo;{quote.quoteNote}&rdquo;</p>}
            </Card>
          )}
          {quote.declineReason && <Card title="Your reason"><p className="text-sm text-body">{quote.declineReason}</p></Card>}

          {(quote.isOpen || quote.files.length > 0) && (
            <Card title="Written quote">
              <WorkFiles files={quote.files} kind="quote" canAdd={actions.canAddFiles} calls={files} />
            </Card>
          )}

          {quote.status === "Accepted" && jobHref && (
            <Link href={jobHref} className={`${primaryButton} inline-block text-center`}>Open the job</Link>
          )}
          {actions.canDecline && (
            <ReasonAction
              optional
              label={quote.status === "Submitted" ? "Withdraw my quote" : "Can't quote this"}
              prompt={quote.status === "Submitted" ? "Why are you withdrawing it? Only the landlord sees this." : "Why can't you quote it? Only the landlord sees this."}
              submitLabel="Send"
              onSubmit={onDecline}
            />
          )}
          {!quote.isOpen && quote.status !== "Accepted" && (
            <p className="rounded-2xl bg-brand-green-tint px-4 py-3 text-xs text-brand-green-dark">
              A closed quote is a summary: your amount and note, and what happened. The address, photos and access details are no longer shown.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
