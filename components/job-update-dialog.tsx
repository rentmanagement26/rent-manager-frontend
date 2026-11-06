"use client";

// The popup for one job update: accepted, can't do it, a visit, waiting for parts, parts arrived, a note, or done. The contractor uses it for
// their own job; the landlord uses it to enter an update for a contractor who is not in the app (the timeline then says so). Also the small
// popup to change a job's instructions.
import { useState } from "react";
import { BillingDialog, ghostButton, primaryButton } from "@/components/billing-dialog";
import { ChoiceChips } from "@/components/choice-chips";
import { useRunner } from "@/components/maintenance-request-actions";
import { changeInstructionsAction } from "@/lib/contractor-actions";
import type { ContractorJob, JobUpdateInput } from "@/lib/contractor-types";
import type { ActionResult } from "@/lib/document-actions";

type UpdateType = JobUpdateInput["type"];

const inputClass = "w-full rounded-lg border border-default px-3 py-2.5 text-sm text-heading placeholder:text-muted focus:border-accent focus:outline-none";
const labelClass = "mb-1.5 mt-3 block text-sm font-semibold text-heading";

// What each update is called, and the note that explains it. `note` and `reason` limits are the backend's.
const TITLES: Record<UpdateType, { title: string; help: string }> = {
  accepted: { title: "Accept the job", help: "The landlord is told that the job is accepted." },
  declined: { title: "Can't do the job", help: "The request goes back to New and the landlord can assign someone else." },
  visit: { title: "Set the visit", help: "The tenants are told the day and time." },
  waiting_for_parts: { title: "Waiting for parts", help: "The tenants see the date parts are expected, not the note." },
  parts_arrived: { title: "Parts arrived", help: "Tells the landlord that the parts are here." },
  note: { title: "Add a note", help: "Only the landlord and the contractor see it, unless you tick the box." },
  done: { title: "Mark the job done", help: "The request becomes Done. The tenants read the note and can reopen the request for 30 days." },
};

export function JobUpdateDialog({
  type,
  subtitle,
  onSave,
  onClose,
}: {
  type: UpdateType;
  subtitle?: string;
  // Sends the update (a landlord's or a contractor's server action, already tied to the job) and answers its result.
  onSave: (update: JobUpdateInput) => Promise<ActionResult<unknown>>;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [date, setDate] = useState("");
  const [window, setWindow] = useState("morning");
  const [visible, setVisible] = useState(false);
  const [localError, setLocalError] = useState("");
  const { busy, error, run } = useRunner();
  const { title, help } = TITLES[type];

  async function save() {
    if ((type === "visit" || type === "waiting_for_parts") && !date) return setLocalError(type === "visit" ? "Choose the visit day." : "Choose the day the parts are expected.");
    if (type === "note" && !text.trim()) return setLocalError("Write the note.");
    setLocalError("");

    const update: JobUpdateInput = { type };
    if (type === "declined") update.reason = text.trim() || null;
    if (type === "visit") Object.assign(update, { visitDate: date, visitWindow: window });
    if (type === "waiting_for_parts") Object.assign(update, { expectedBy: date, note: text.trim() || null });
    if (type === "note") Object.assign(update, { note: text.trim(), visibleToTenant: visible });
    if (type === "done") update.note = text.trim() || null;
    if (await run(() => onSave(update))) onClose();
  }

  const hasText = type === "declined" || type === "waiting_for_parts" || type === "note" || type === "done";

  return (
    <BillingDialog title={title} subtitle={subtitle}>
      <p className="text-sm text-body">{help}</p>

      {type === "visit" && (
        <>
          <label htmlFor="visit-day" className={labelClass}>Visit day</label>
          <input id="visit-day" type="date" value={date} onChange={(event) => setDate(event.target.value)} className={`${inputClass} max-w-[200px]`} />
          <span className={labelClass}>Time of day</span>
          <ChoiceChips label="Time of day" options={[{ value: "morning", label: "Morning" }, { value: "afternoon", label: "Afternoon" }, { value: "evening", label: "Evening" }]} selected={[window]} onToggle={setWindow} />
        </>
      )}
      {type === "waiting_for_parts" && (
        <>
          <label htmlFor="parts-day" className={labelClass}>Parts expected by</label>
          <input id="parts-day" type="date" value={date} onChange={(event) => setDate(event.target.value)} className={`${inputClass} max-w-[200px]`} />
        </>
      )}
      {hasText && (
        <>
          <label htmlFor="update-text" className={labelClass}>
            {type === "declined" ? "Reason" : "Note"} {type !== "note" && <span className="font-normal text-muted">(optional)</span>}
          </label>
          <textarea id="update-text" rows={3} maxLength={type === "note" ? 1000 : type === "done" ? 500 : 300} value={text} onChange={(event) => setText(event.target.value)} className={inputClass} />
        </>
      )}
      {type === "note" && (
        <label className="mt-3 flex cursor-pointer gap-2 text-sm">
          <input type="checkbox" checked={visible} onChange={(event) => setVisible(event.target.checked)} className="mt-1" />
          <span className="font-semibold text-heading">The tenants can read this note</span>
        </label>
      )}

      {(localError || error) && <p role="alert" className="mt-3 text-sm font-medium text-red-700">{localError || error}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} disabled={busy} className={ghostButton}>Cancel</button>
        <button type="button" onClick={save} disabled={busy} className={primaryButton}>{busy ? "Saving…" : "Save"}</button>
      </div>
    </BillingDialog>
  );
}

// Change what the contractor is told to do, and whether they see the tenant's name and phone. The contractor is told about the change.
export function InstructionsDialog({ requestId, job, onClose }: { requestId: number; job: ContractorJob; onClose: () => void }) {
  const [instructions, setInstructions] = useState(job.instructions ?? "");
  const [share, setShare] = useState(job.shareTenantContact);
  const { busy, error, run } = useRunner();

  async function save() {
    if (await run(() => changeInstructionsAction(requestId, instructions, share))) onClose();
  }

  return (
    <BillingDialog title="Change the instructions" subtitle={job.contractor.displayName}>
      <textarea aria-label="Instructions" rows={4} maxLength={1000} value={instructions} onChange={(event) => setInstructions(event.target.value)} className={inputClass} />
      <label className="mt-3 flex cursor-pointer gap-2 text-sm">
        <input type="checkbox" checked={share} onChange={(event) => setShare(event.target.checked)} className="mt-1" />
        <span className="font-semibold text-heading">Share the tenant&apos;s name and phone with the contractor</span>
      </label>
      {error && <p role="alert" className="mt-3 text-sm font-medium text-red-700">{error}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} disabled={busy} className={ghostButton}>Cancel</button>
        <button type="button" onClick={save} disabled={busy} className={primaryButton}>{busy ? "Saving…" : "Save"}</button>
      </div>
    </BillingDialog>
  );
}
