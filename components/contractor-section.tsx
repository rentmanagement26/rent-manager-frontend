"use client";

// The contractor part of the landlord's request page: the contractor job (with the updates the landlord can enter for a contractor who is not
// in the app), the buttons to assign a contractor or ask for quotes, and the quotes with Accept, Enter their quote and the link controls.
// Every button follows the backend's flags, and each change reloads the page behind it.
import Link from "next/link";
import { useState } from "react";
import { AssignContractorDialog } from "@/components/assign-contractor-dialog";
import { HowPill } from "@/components/contractor-parts";
import { InstructionsDialog, JobUpdateDialog } from "@/components/job-update-dialog";
import { LinkControls } from "@/components/link-controls";
import { LocalMoment } from "@/components/local-moment";
import { ReasonAction, useRunner } from "@/components/maintenance-request-actions";
import { AcceptQuoteDialog, EnterQuoteDialog } from "@/components/quote-dialogs";
import { RequestQuotesDialog } from "@/components/request-quotes-dialog";
import { cancelQuoteAction, declineQuoteAction, setJobLinkAction, setQuoteLinkAction, takeBackJobAction } from "@/lib/contractor-actions";
import type { ContractorJob, JobUpdateInput, Quote } from "@/lib/contractor-types";
import { formatCalendarDate } from "@/lib/format-time";
import type { LandlordPermissions } from "@/lib/landlord-maintenance-types";
import { formatCents, taxWords } from "@/lib/maintenance-format";

const cardClass = "rounded-2xl border border-default bg-white p-5 shadow-sm";
const smallButton = "rounded-full border border-default bg-white px-3.5 py-1.5 text-sm font-semibold text-heading hover:bg-subtle";
const bigButton = "rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark";

const JOB_PILL: Record<string, string> = {
  Offered: "bg-amber-100 text-amber-900",
  Accepted: "bg-accent-tint text-accent-dark",
  Declined: "bg-red-100 text-red-800",
  Done: "bg-green-100 text-green-800",
  Cancelled: "bg-subtle text-body",
};

// Which popup is open: assigning, asking for quotes, accepting or entering one quote, entering a job update, or changing the instructions.
type Dialog =
  | { kind: "assign" }
  | { kind: "quotes" }
  | { kind: "accept"; quote: Quote }
  | { kind: "enter"; quote: Quote }
  | { kind: "update"; type: JobUpdateInput["type"] }
  | { kind: "instructions" };

// What the job is doing now, in a sentence.
function jobLine(job: ContractorJob): string {
  if (job.status === "Declined") return `Can't do this job.${job.declineReason ? ` Reason (only you see it): ${job.declineReason}.` : ""} The request is back to New.`;
  if (job.status === "Cancelled") return `Taken back${job.cancelReason ? `: ${job.cancelReason}` : ""}.`;
  if (job.status === "Done") return `Done${job.doneAt ? ` ${formatCalendarDate(job.doneAt)}` : ""}.${job.doneNote ? ` Note: ${job.doneNote}` : ""}`;
  if (job.waitingForParts) return `Waiting for parts${job.partsExpectedBy ? `, expected by ${formatCalendarDate(job.partsExpectedBy)}` : ""}.${job.partsNote ? ` Their note (only you and they see it): ${job.partsNote}` : ""}`;
  if (job.visitDate) return `Visit ${formatCalendarDate(job.visitDate)}${job.visitWindow ? `, ${job.visitWindow.toLowerCase()}` : ""}.`;
  if (job.status === "Offered") return "Offered. Waiting for an answer.";
  return "Accepted.";
}

function JobCard({ requestId, job, open }: { requestId: number; job: ContractorJob; open: (dialog: Dialog) => void }) {
  const entering = job.onBehalf;
  const updateButtons: { allowed: boolean; type: JobUpdateInput["type"]; label: string }[] = [
    { allowed: entering.canAccept, type: "accepted", label: "They accepted" },
    { allowed: entering.canSetVisit, type: "visit", label: "Set the visit" },
    { allowed: entering.canWaitForParts, type: "waiting_for_parts", label: "Waiting for parts" },
    { allowed: entering.canPartsArrived, type: "parts_arrived", label: "Parts arrived" },
    { allowed: entering.canAddNote, type: "note", label: "Add a note" },
  ];

  return (
    <section className={cardClass}>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-head text-lg font-bold text-heading">Contractor job</h2>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${JOB_PILL[job.status]}`}>{job.status}</span>
      </div>
      <p className="mt-2 text-sm font-semibold text-heading">{job.contractor.displayName} <HowPill howTheyWork={job.contractor.howTheyWork} /></p>
      <p className="mt-1 text-sm text-body">{jobLine(job)}</p>
      {job.agreedAmountCents !== null && <p className="mt-1 text-sm font-semibold text-heading">Agreed: {formatCents(job.agreedAmountCents)} ({taxWords(job.agreedTaxMode)})</p>}
      {job.instructions && <p className="mt-2 text-xs text-muted">Instructions: {job.instructions}{job.shareTenantContact ? " · tenant name and phone shared" : ""}</p>}
      <p className="mt-1 text-xs text-muted">Offered <LocalMoment iso={job.offeredAt} /></p>

      {job.isOpen && job.contractor.howTheyWork === "EmailLink" && (
        <LinkControls state={job.linkState} expiresAt={job.linkExpiresAt} canSend={job.canSendLink} onSend={() => setJobLinkAction(requestId, true)} onCancel={() => setJobLinkAction(requestId, false)} />
      )}

      {job.isOpen && (updateButtons.some((button) => button.allowed) || entering.canMarkDone || entering.canDecline) && (
        <div className="mt-3">
          <p className="mb-1.5 text-xs font-semibold text-muted">Enter an update for them</p>
          <div className="flex flex-wrap gap-1.5">
            {updateButtons.filter((button) => button.allowed).map((button) => (
              <button key={button.type} type="button" onClick={() => open({ kind: "update", type: button.type })} className={smallButton}>{button.label}</button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-start gap-2">
        {entering.canMarkDone && <button type="button" onClick={() => open({ kind: "update", type: "done" })} className={bigButton}>Mark job done</button>}
        {entering.canDecline && <button type="button" onClick={() => open({ kind: "update", type: "declined" })} className={smallButton}>They can&apos;t do it</button>}
        {job.canChangeInstructions && <button type="button" onClick={() => open({ kind: "instructions" })} className={smallButton}>Change instructions</button>}
        {job.canTakeBack && (
          <ReasonAction optional label="Take the job back" prompt="Why are you taking it back? Only you and the contractor see this." submitLabel="Take the job back" onSubmit={(reason) => takeBackJobAction(requestId, reason)} />
        )}
      </div>
    </section>
  );
}

// Withdraws a quote request that is still open (the contractor is told).
function CancelQuoteButton({ requestId, quoteId }: { requestId: number; quoteId: number }) {
  const { busy, error, run } = useRunner();
  return (
    <span>
      <button type="button" disabled={busy} onClick={() => run(() => cancelQuoteAction(requestId, quoteId))} className={smallButton}>Cancel request</button>
      {error && <span role="alert" className="mt-1 block text-xs font-medium text-red-700">{error}</span>}
    </span>
  );
}

function QuoteRow({ requestId, quote, open }: { requestId: number; quote: Quote; open: (dialog: Dialog) => void }) {
  const files = quote.files ?? [];
  return (
    <li className={`rounded-xl border p-3 ${quote.actions.canAccept ? "border-accent bg-accent-tint/40" : "border-default"} ${quote.isOpen ? "" : "opacity-75"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-heading">
            {quote.contractor.displayName} <HowPill howTheyWork={quote.contractor.howTheyWork} />
            {quote.status !== "Requested" && quote.status !== "Submitted" && <span className="ml-1.5 rounded-full bg-subtle px-2 py-0.5 text-[11px] font-semibold text-body">{quote.status === "NotSelected" ? "Not selected" : quote.status}</span>}
          </p>
          <p className="text-xs text-muted">
            {quote.status === "Requested" && `Requested ${formatCalendarDate(quote.requestedAt)} · no answer yet`}
            {quote.status === "Submitted" && `Submitted${quote.enteredByLandlord ? " (entered by you)" : ""}${quote.validUntil ? `, valid until ${formatCalendarDate(quote.validUntil)}` : ""}${quote.isExpired ? " (expired)" : ""}`}
            {quote.status === "Declined" && `Won't quote${quote.declineReason ? `. Reason (only you see it): ${quote.declineReason}` : ""}`}
          </p>
          {quote.quoteNote && <p className="mt-1 text-xs text-body">&ldquo;{quote.quoteNote}&rdquo;</p>}
          {files.length > 0 && (
            <p className="mt-1 flex flex-wrap gap-1.5">
              {files.map((file) => (
                <a key={file.id} href={file.url} target="_blank" rel="noreferrer" className="rounded-md border border-default bg-white px-2 py-0.5 text-xs text-heading hover:border-accent">
                  {file.fileName}
                </a>
              ))}
            </p>
          )}
        </div>
        {quote.amountCents !== null && (
          <p className="text-right">
            <span className="block font-head text-lg font-bold text-heading">{formatCents(quote.amountCents)}</span>
            <span className="block text-xs text-muted">{taxWords(quote.taxMode)}</span>
          </p>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-start gap-1.5">
        {quote.actions.canAccept && <button type="button" onClick={() => open({ kind: "accept", quote })} className={bigButton}>Accept</button>}
        {quote.actions.canEnterQuote && <button type="button" onClick={() => open({ kind: "enter", quote })} className={quote.status === "Submitted" ? smallButton : bigButton}>{quote.status === "Submitted" ? "Change their quote" : "Enter their quote"}</button>}
        {quote.actions.canEnterDecline && (
          <ReasonAction optional label="They declined" prompt="Why won't they quote? Only you see this." submitLabel="Save" onSubmit={(reason) => declineQuoteAction(requestId, quote.id, reason)} />
        )}
        {quote.actions.canCancel && (
          <CancelQuoteButton requestId={requestId} quoteId={quote.id} />
        )}
      </div>
      {quote.isOpen && quote.contractor.howTheyWork === "EmailLink" && (
        <LinkControls state={quote.linkState} expiresAt={quote.linkExpiresAt} canSend={quote.canSendLink} onSend={() => setQuoteLinkAction(requestId, quote.id, true)} onCancel={() => setQuoteLinkAction(requestId, quote.id, false)} />
      )}
    </li>
  );
}

export function ContractorSection({
  requestId,
  category,
  subtitle,
  job,
  quotes,
  quotesOpen,
  quotesReceived,
  permissions,
}: {
  requestId: number;
  category: string;
  subtitle: string;
  job: ContractorJob | null;
  quotes: Quote[];
  quotesOpen: number;
  quotesReceived: number;
  permissions: LandlordPermissions;
}) {
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const close = () => setDialog(null);
  const hasOpenJob = !!job?.isOpen;

  return (
    <div className="space-y-4">
      {job && <JobCard requestId={requestId} job={job} open={setDialog} />}

      {!hasOpenJob && (permissions.canAssignJob || permissions.canRequestQuotes) && (
        <section className={cardClass}>
          <h2 className="font-head text-lg font-bold text-heading">Contractor</h2>
          <p className="mb-3 mt-1 text-sm text-muted">No contractor has this job yet. Assign one directly, or ask contractors for quotes.</p>
          <div className="flex flex-wrap gap-2">
            {permissions.canAssignJob && <button type="button" onClick={() => setDialog({ kind: "assign" })} className={bigButton}>Assign contractor</button>}
            {permissions.canRequestQuotes && <button type="button" onClick={() => setDialog({ kind: "quotes" })} className={smallButton}>Request quotes</button>}
            <Link href="/landlord/maintenance/contractors" className="self-center text-sm font-semibold text-accent hover:underline">Your contractors</Link>
          </div>
        </section>
      )}

      {quotes.length > 0 && (
        <section className={cardClass}>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-head text-lg font-bold text-heading">Quotes</h2>
            <span className="rounded-full bg-subtle px-2.5 py-0.5 text-[11px] font-semibold text-body">Private: tenants and other contractors never see amounts</span>
          </div>
          {quotesOpen > 0 && <p className="mt-1 text-sm text-muted">Waiting for quotes ({quotesReceived} of {quotesOpen} received)</p>}
          <ul className="mt-3 space-y-2">
            {quotes.map((quote) => (
              <QuoteRow key={quote.id} requestId={requestId} quote={quote} open={setDialog} />
            ))}
          </ul>
          {permissions.canRequestQuotes && <button type="button" onClick={() => setDialog({ kind: "quotes" })} className={`${smallButton} mt-3`}>Ask more contractors</button>}
          <p className="mt-3 text-xs text-muted">Accepting a quote makes it the job, already accepted, and tells the others they were not selected. Assigning a contractor directly cancels the quote requests that are still open.</p>
        </section>
      )}

      {dialog?.kind === "assign" && <AssignContractorDialog requestId={requestId} category={category} subtitle={subtitle} hasJob={hasOpenJob} onClose={close} />}
      {dialog?.kind === "quotes" && <RequestQuotesDialog requestId={requestId} category={category} subtitle={subtitle} onClose={close} />}
      {dialog?.kind === "accept" && <AcceptQuoteDialog requestId={requestId} quote={dialog.quote} onClose={close} />}
      {dialog?.kind === "enter" && <EnterQuoteDialog requestId={requestId} quote={dialog.quote} onClose={close} />}
      {dialog?.kind === "update" && job && <JobUpdateDialog requestId={requestId} type={dialog.type} contractorName={job.contractor.displayName} onClose={close} />}
      {dialog?.kind === "instructions" && job && <InstructionsDialog requestId={requestId} job={job} onClose={close} />}
    </div>
  );
}
