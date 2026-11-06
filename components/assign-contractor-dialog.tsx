"use client";

// The "Assign a contractor" popup: give the request to one contractor as a job. A contractor in the app or with an email link is offered the
// job and answers it themselves; a phone-only contractor starts with the job accepted because the landlord enters their answers.
// If the request already has a job, the backend takes it back first.
import { useState } from "react";
import { BillingDialog, ghostButton, primaryButton } from "@/components/billing-dialog";
import { ContractorPicker } from "@/components/contractor-picker";
import { useRunner } from "@/components/maintenance-request-actions";
import { assignJobAction } from "@/lib/contractor-actions";
import type { ContractorListItem } from "@/lib/contractor-types";

const textareaClass = "w-full rounded-lg border border-default px-3 py-2.5 text-sm text-heading placeholder:text-muted focus:border-accent focus:outline-none";

export function AssignContractorDialog({ requestId, category, subtitle, hasJob, onClose }: { requestId: number; category: string; subtitle: string; hasJob: boolean; onClose: () => void }) {
  const [chosen, setChosen] = useState<ContractorListItem | null>(null);
  const [instructions, setInstructions] = useState("");
  const [share, setShare] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const { busy, error, run } = useRunner();

  // A phone-only contractor cannot answer, so the job starts as accepted.
  const mustBeAgreed = chosen?.howTheyWork === "PhoneOnly";

  async function offer() {
    if (!chosen) return;
    if (await run(() => assignJobAction(requestId, chosen.id, instructions, share, agreed || mustBeAgreed))) onClose();
  }

  return (
    <BillingDialog title="Assign a contractor" subtitle={subtitle}>
      <ContractorPicker category={category} selected={chosen ? [chosen.id] : []} multiple={false} onToggle={setChosen} />

      <label htmlFor="instructions" className="mb-1.5 mt-4 block text-sm font-semibold text-heading">
        Instructions <span className="font-normal text-muted">(optional, up to 1,000 characters)</span>
      </label>
      <textarea id="instructions" rows={3} maxLength={1000} value={instructions} onChange={(event) => setInstructions(event.target.value)} className={textareaClass} />

      <label className="mt-3 flex cursor-pointer gap-2 text-sm">
        <input type="checkbox" checked={share} onChange={(event) => setShare(event.target.checked)} className="mt-1" />
        <span>
          <span className="font-semibold text-heading">Share the tenant&apos;s name and phone with the contractor</span>
          <span className="block text-xs text-muted">Off: the contractor sees &quot;Tenant of the unit&quot; and the access details only.</span>
        </span>
      </label>
      <label className="mt-2 flex cursor-pointer gap-2 text-sm">
        <input type="checkbox" checked={agreed || mustBeAgreed} disabled={mustBeAgreed} onChange={(event) => setAgreed(event.target.checked)} className="mt-1" />
        <span>
          <span className="font-semibold text-heading">Already agreed with the contractor</span>
          <span className="block text-xs text-muted">The job starts as accepted. Always on for Phone only: you enter their updates.</span>
        </span>
      </label>

      {chosen && (
        <p className="mt-3 rounded-lg bg-brand-green-tint px-3 py-2 text-xs text-brand-green-dark">
          {chosen.howTheyWork === "InTheApp" && `${chosen.displayName} is told in the app and answers there.`}
          {chosen.howTheyWork === "EmailLink" && `${chosen.displayName} gets an email with a secure link and answers there. No account needed.`}
          {chosen.howTheyWork === "PhoneOnly" && `${chosen.displayName} is not told. Phone them, then enter their updates from this page.`}
          {hasJob && " This request already has a job: it is taken back first."}
        </p>
      )}

      {error && <p role="alert" className="mt-3 text-sm font-medium text-red-700">{error}</p>}
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} disabled={busy} className={ghostButton}>Cancel</button>
        <button type="button" onClick={offer} disabled={busy || !chosen} className={primaryButton}>{busy ? "Sending…" : mustBeAgreed || agreed ? "Assign the job" : "Offer the job"}</button>
      </div>
    </BillingDialog>
  );
}
