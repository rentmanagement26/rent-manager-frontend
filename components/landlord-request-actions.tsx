"use client";

// What the landlord can do on a maintenance request page: change the urgency, write a comment (choosing who may read it), and finish,
// cancel or reopen the request. Each control shows only when the backend's permission flag for it is true.
import { useState } from "react";
import { ChoiceChips } from "@/components/choice-chips";
import { ReasonAction, useRunner } from "@/components/maintenance-request-actions";
import {
  addLandlordCommentAction,
  cancelLandlordRequestAction,
  completeRequestAction,
  reopenLandlordRequestAction,
  setUrgencyAction,
} from "@/lib/landlord-maintenance-actions";
import type { LandlordPermissions, Urgency, Visibility } from "@/lib/landlord-maintenance-types";
import { URGENCIES } from "@/lib/maintenance-format";

const primaryButton = "rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50";
const textareaClass = "w-full rounded-lg border border-default px-3 py-2.5 text-sm text-heading placeholder:text-muted focus:border-accent focus:outline-none";

// Who can read a comment, with what each choice means. The backend tells the tenants only about "Everyone".
const VISIBILITIES: { value: Visibility; label: string }[] = [
  { value: "Everyone", label: "Everyone" },
  { value: "Work", label: "Contractor and me" },
  { value: "Private", label: "Only me" },
];

// The urgency of the request: a small menu while the landlord may change it, plain text otherwise. The tenants are told about a change.
export function UrgencyPicker({ requestId, urgency, canChange }: { requestId: number; urgency: Urgency; canChange: boolean }) {
  const { busy, error, run } = useRunner();
  if (!canChange) return <span>{urgency}</span>;

  return (
    <span>
      <select
        aria-label="Urgency"
        value={urgency}
        disabled={busy}
        onChange={(event) => run(() => setUrgencyAction(requestId, event.target.value))}
        className="rounded-lg border border-default bg-white px-2 py-1 text-sm font-semibold text-heading focus:border-accent focus:outline-none"
      >
        {URGENCIES.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      {error && <span role="alert" className="mt-1 block text-xs font-medium text-red-700">{error}</span>}
    </span>
  );
}

// A comment box with the "who can see it" choice. Everyone: tenants and landlord (and the contractor on the job). Work: landlord and contractor.
// Private: only the landlord.
export function LandlordCommentBox({ requestId }: { requestId: number }) {
  const [text, setText] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("Everyone");
  const { busy, error, run } = useRunner();

  async function send() {
    if (!text.trim()) return;
    if (await run(() => addLandlordCommentAction(requestId, text, visibility))) setText("");
  }

  return (
    <div className="mt-4">
      <textarea
        aria-label="Write a comment"
        rows={2}
        maxLength={2000}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Write a comment…"
        className={textareaClass}
      />
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
          Who can see it:
          <ChoiceChips label="Who can see the comment" options={VISIBILITIES} selected={[visibility]} onToggle={(value) => setVisibility(value as Visibility)} />
        </div>
        <button type="button" disabled={busy || !text.trim()} onClick={send} className={primaryButton}>
          {busy ? "Sending…" : "Send"}
        </button>
      </div>
      {visibility === "Everyone" && <p className="mt-1 text-xs text-muted">Your tenants are told about this comment.</p>}
      {error && <p role="alert" className="mt-2 text-sm font-medium text-red-700">{error}</p>}
    </div>
  );
}

// Mark done and Cancel while the request is open, Reopen for 30 days after it is Done. Each needs a note the tenants read (up to 500 characters).
export function LandlordRequestButtons({ requestId, permissions }: { requestId: number; permissions: LandlordPermissions }) {
  return (
    <div className="flex flex-wrap items-start gap-2">
      {permissions.canComplete && (
        <ReasonAction
          label="Mark as done"
          prompt="What was done? Your tenants read this."
          submitLabel="Mark as done"
          maxLength={500}
          onSubmit={(note) => completeRequestAction(requestId, note)}
        />
      )}
      {permissions.canCancel && (
        <ReasonAction
          label="Cancel request"
          prompt="Why are you cancelling it? Your tenants read this."
          submitLabel="Cancel request"
          maxLength={500}
          onSubmit={(reason) => cancelLandlordRequestAction(requestId, reason)}
        />
      )}
      {permissions.canReopen && (
        <ReasonAction
          label="Reopen request"
          prompt="Why are you reopening it?"
          submitLabel="Reopen request"
          maxLength={500}
          onSubmit={(reason) => reopenLandlordRequestAction(requestId, reason)}
        />
      )}
    </div>
  );
}
