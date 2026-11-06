"use client";

// One job as the contractor sees it, in the app and on the email link: the problem, how to get in, the landlord's instructions, and the answers
// the contractor may give (accept or decline, a visit, waiting for parts, a note, done) plus photos and video of the work. Buttons follow
// the backend's `actions` flags. The calls come in already tied to the job or the link.
import { useState } from "react";
import { AccessCard, Card, LandlordCard, ProblemCard, TimelineCard, WhereCard } from "@/components/contractor-request-parts";
import { JobUpdateDialog } from "@/components/job-update-dialog";
import { useRunner } from "@/components/maintenance-request-actions";
import { WorkFiles, type WorkFileCalls } from "@/components/work-files";
import type { MyJob } from "@/lib/contractor-portal-types";
import type { JobUpdateInput } from "@/lib/contractor-types";
import type { ActionResult } from "@/lib/document-actions";
import { formatCalendarDate } from "@/lib/format-time";
import { formatCents, taxWords } from "@/lib/maintenance-format";

const primaryButton = "rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50";
const ghostButton = "rounded-full border border-default bg-white px-4 py-2 text-sm font-semibold text-heading hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-50";

const STATUS_PILL: Record<string, string> = {
  Offered: "bg-amber-100 text-amber-900",
  Accepted: "bg-accent-tint text-accent-dark",
  Declined: "bg-red-100 text-red-800",
  Done: "bg-green-100 text-green-800",
  Cancelled: "bg-subtle text-body",
};

// The line under the title: the visit, or the parts the contractor is waiting for.
function progressLine(job: MyJob): string | null {
  if (job.waitingForParts) return `Waiting for parts${job.partsExpectedBy ? `, expected by ${formatCalendarDate(job.partsExpectedBy)}` : ""}`;
  if (job.visitDate) return `Visit ${formatCalendarDate(job.visitDate)}${job.visitWindow ? `, ${job.visitWindow.toLowerCase()}` : ""}`;
  return null;
}

export function ContractorJobView({ job, onUpdate, files }: { job: MyJob; onUpdate: (update: JobUpdateInput) => Promise<ActionResult<unknown>>; files: WorkFileCalls }) {
  const [dialog, setDialog] = useState<JobUpdateInput["type"] | null>(null);
  const accept = useRunner();
  const actions = job.actions;
  const progress = progressLine(job);

  const updateButtons: { allowed: boolean; type: JobUpdateInput["type"]; label: string }[] = [
    { allowed: actions.canSetVisit, type: "visit", label: "Set the visit" },
    { allowed: actions.canWaitForParts, type: "waiting_for_parts", label: "Waiting for parts" },
    { allowed: actions.canPartsArrived, type: "parts_arrived", label: "Parts arrived" },
    { allowed: actions.canAddNote, type: "note", label: "Add a note" },
  ];

  return (
    <div className="max-w-6xl space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-head text-2xl font-bold text-heading">{job.number} · {job.title}</h1>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_PILL[job.status]}`}>{job.status}</span>
        {job.urgency === "Emergency" && <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800">Emergency</span>}
        {progress && <span className="rounded-lg border border-default bg-white px-3 py-1 text-xs font-semibold text-heading">{progress}</span>}
      </div>
      <p className="text-sm text-muted">From {job.landlordName}{job.entryName ? ` · on their list as ${job.entryName}` : ""}</p>
      {job.agreedAmountCents !== null && <p className="text-sm font-semibold text-heading">Agreed: {formatCents(job.agreedAmountCents)} ({taxWords(job.agreedTaxMode)})</p>}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <ProblemCard description={job.description} media={job.media} />
          <AccessCard access={job.access} />

          {(job.isOpen || job.files.length > 0) && (
            <Card title="Photos of the work">
              <WorkFiles files={job.files} kind="job" canAdd={actions.canAddFiles} calls={files} />
            </Card>
          )}

          {!job.isOpen && (job.doneNote || job.declineReason || job.cancelReason) && (
            <Card title={job.status === "Done" ? "Your note" : "What happened"}>
              <p className="text-sm text-body">{job.doneNote ?? job.declineReason ?? job.cancelReason}</p>
            </Card>
          )}
          <TimelineCard entries={job.timeline} />
        </div>

        <div className="space-y-4">
          <WhereCard address={job.address} placeLabel={job.placeLabel} tenantLabel={job.tenantLabel} tenantContact={job.tenantContact} />
          <LandlordCard text={job.instructions} contact={job.landlordContact} />

          {!job.isOpen && (
            <p className="rounded-2xl bg-brand-green-tint px-4 py-3 text-xs text-brand-green-dark">
              Once a job is finished, declined or taken back, the address, the photos, the access details and the tenant contact are no longer shown. Your own notes and the timeline stay.
            </p>
          )}

          {job.isOpen && (
            <Card title="Your answer">
              <div className="flex flex-wrap gap-2">
                {actions.canAccept && (
                  <button type="button" disabled={accept.busy} onClick={() => accept.run(() => onUpdate({ type: "accepted" }))} className={primaryButton}>
                    {accept.busy ? "Accepting…" : "Accept the job"}
                  </button>
                )}
                {actions.canDecline && <button type="button" onClick={() => setDialog("declined")} className={ghostButton}>Can&apos;t do this job</button>}
              </div>
              {updateButtons.some((button) => button.allowed) && (
                <>
                  <p className="mb-1.5 mt-3 text-xs font-semibold text-muted">Add an update</p>
                  <div className="flex flex-wrap gap-2">
                    {updateButtons.filter((button) => button.allowed).map((button) => (
                      <button key={button.type} type="button" onClick={() => setDialog(button.type)} className={ghostButton}>{button.label}</button>
                    ))}
                  </div>
                </>
              )}
              {actions.canMarkDone && <button type="button" onClick={() => setDialog("done")} className={`${primaryButton} mt-3`}>Mark done</button>}
              {accept.error && <p role="alert" className="mt-2 text-sm font-medium text-red-700">{accept.error}</p>}
            </Card>
          )}
        </div>
      </div>

      {dialog && <JobUpdateDialog type={dialog} subtitle={`${job.number} · ${job.title}`} onSave={onUpdate} onClose={() => setDialog(null)} />}
    </div>
  );
}
