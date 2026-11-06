"use client";

// What a tenant can do on a request page: write a comment, withdraw a request that is still New, or say a Done request is not fixed.
// Each control shows only when the backend's permission flag for it is true.
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ActionResult } from "@/lib/document-actions";
import { addCommentAction, cancelRequestAction, reopenRequestAction } from "@/lib/maintenance-actions";
import type { RequestPermissions } from "@/lib/maintenance-types";
import { goToSessionExpired } from "@/lib/session-expired-client";

const primaryButton = "rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50";
const ghostButton = "rounded-full border border-default bg-white px-4 py-2 text-sm font-semibold text-heading hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-50";
const textareaClass = "w-full rounded-lg border border-default px-3 py-2.5 text-sm text-heading placeholder:text-muted focus:border-accent focus:outline-none";

// Runs one action and refreshes the page behind it; `run` answers true when it worked. Shared with the landlord screens.
export function useRunner() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run(action: () => Promise<ActionResult<unknown>>): Promise<boolean> {
    setBusy(true);
    setError("");
    const result = await action();
    setBusy(false);
    if ("ok" in result) {
      router.refresh();
      return true;
    }
    if (result.expired) goToSessionExpired();
    else setError(result.error);
    return false;
  }
  return { busy, error, run };
}

// A comment box: seen by the tenant, their co-tenants and the landlord.
export function CommentBox({ requestId }: { requestId: number }) {
  const [text, setText] = useState("");
  const { busy, error, run } = useRunner();

  async function send() {
    if (!text.trim()) return;
    if (await run(() => addCommentAction(requestId, text))) setText("");
  }

  return (
    <div className="mt-4">
      <textarea
        aria-label="Add a comment"
        rows={2}
        maxLength={2000}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Add a comment…"
        className={textareaClass}
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-xs text-muted">Your comment is seen by you, your co-tenants and your landlord.</p>
        <button type="button" disabled={busy || !text.trim()} onClick={send} className={primaryButton}>
          {busy ? "Sending…" : "Send"}
        </button>
      </div>
      {error && <p role="alert" className="mt-2 text-sm font-medium text-red-700">{error}</p>}
    </div>
  );
}

// A button that opens a short form asking for a reason (300 characters by default), then runs the action. Shared with the landlord screens.
export function ReasonAction({
  label,
  prompt,
  submitLabel,
  onSubmit,
  maxLength = 300,
}: {
  label: string;
  prompt: string;
  submitLabel: string;
  onSubmit: (reason: string) => Promise<ActionResult<unknown>>;
  maxLength?: number;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const { busy, error, run } = useRunner();

  if (!open) return <button type="button" onClick={() => setOpen(true)} className={ghostButton}>{label}</button>;

  return (
    <div className="w-full rounded-2xl border border-default bg-white p-4 shadow-sm">
      <label htmlFor="reason" className="mb-1.5 block text-sm font-semibold text-heading">{prompt}</label>
      <textarea id="reason" rows={3} maxLength={maxLength} value={reason} onChange={(event) => setReason(event.target.value)} className={textareaClass} />
      {error && <p role="alert" className="mt-2 text-sm font-medium text-red-700">{error}</p>}
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" disabled={busy} onClick={() => setOpen(false)} className={ghostButton}>Cancel</button>
        <button type="button" disabled={busy || !reason.trim()} onClick={() => run(() => onSubmit(reason))} className={primaryButton}>
          {busy ? "Sending…" : submitLabel}
        </button>
      </div>
    </div>
  );
}

// Withdraw (while New, only for the tenant who reported it) and "Still not fixed?" (a Done request, for 30 days).
export function RequestButtons({ requestId, permissions }: { requestId: number; permissions: RequestPermissions }) {
  if (!permissions.canCancel && !permissions.canReopen) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {permissions.canCancel && (
        <ReasonAction label="Withdraw request" prompt="Why are you withdrawing it?" submitLabel="Withdraw request" onSubmit={(reason) => cancelRequestAction(requestId, reason)} />
      )}
      {permissions.canReopen && (
        <ReasonAction label="Still not fixed?" prompt="What is still wrong?" submitLabel="Reopen request" onSubmit={(reason) => reopenRequestAction(requestId, reason)} />
      )}
    </div>
  );
}
