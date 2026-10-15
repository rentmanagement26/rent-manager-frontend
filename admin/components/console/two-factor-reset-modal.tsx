"use client";

import { useState } from "react";
import { Modal } from "@/components/console/modal";
import {
  ErrorBox,
  goToSessionExpired,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/console/ui";
import { TWO_FACTOR_RESET_REASONS } from "@/lib/types";
import type { ActionFailure, TemporaryPassword } from "@/lib/types";

// What the page's server action answers: success (maybe with a new temporary password) or a failure.
type ResetResult = { ok: true; password?: TemporaryPassword } | ActionFailure;

// The popup for resetting someone's two-factor (authenticator) setup. Used for landlords and for staff.
//
// The backend asks for three things before it will do this:
//   1. a reason from a fixed list, 2. a written note (kept in the audit log),
//   3. a fresh 6-digit code from the ADMIN's own authenticator app, to prove it really is them.
export function TwoFactorResetModal({
  who,
  explanation,
  onSubmit,
  onClose,
  onDone,
}: {
  who: string; // the person being reset, for the heading
  explanation: string; // what will happen to them
  onSubmit: (reasonCode: string, note: string, code: string) => Promise<ResetResult>;
  onClose: () => void;
  onDone: (result: { ok: true; password?: TemporaryPassword }) => void;
}) {
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = !!reason && note.trim().length > 0 && code.replace(/\s/g, "").length >= 6 && !submitting;

  async function submit() {
    setSubmitting(true);
    setError("");
    const result = await onSubmit(reason, note, code);
    setSubmitting(false);

    if ("error" in result) {
      if (result.expired) return goToSessionExpired();
      setError(result.error);
      return;
    }
    onDone(result);
  }

  return (
    <Modal title="Reset two-factor" subtitle={who} busy={submitting} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-[13px] text-c-tx2">{explanation}</p>

        <div className="flex flex-col gap-2">
          <label htmlFor="reset-reason" className="text-xs text-c-tx2">
            Reason
          </label>
          <select id="reset-reason" value={reason} onChange={(e) => setReason(e.target.value)} className={inputClass}>
            <option value="">Select a reason</option>
            {TWO_FACTOR_RESET_REASONS.map((r) => (
              <option key={r.code} value={r.code}>
                {r.label}
              </option>
            ))}
          </select>
          <textarea
            aria-label="Note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Short note for the audit log"
            className={`${inputClass} h-auto py-2.5`}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="reset-code" className="text-xs text-c-tx2">
            Your authenticator code
          </label>
          <input
            id="reset-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={7}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="6-digit code"
            className={inputClass}
          />
        </div>

        <ErrorBox message={error} />

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={submitting} className={secondaryButtonClass}>
            Cancel
          </button>
          <button type="button" onClick={submit} disabled={!canSubmit} className={primaryButtonClass}>
            {submitting ? "Resetting…" : "Reset two-factor"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
