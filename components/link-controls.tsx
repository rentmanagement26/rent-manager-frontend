"use client";

// For an email-link contractor: whether their secure link works, and buttons to send a new one (the old one stops working) or cancel it.
// A new link can be sent at most every 5 minutes, which the backend enforces and explains.
import { useRunner } from "@/components/maintenance-request-actions";
import type { ActionResult } from "@/lib/document-actions";
import { formatCalendarDate } from "@/lib/format-time";

const smallButton = "rounded-full border border-default bg-white px-3 py-1.5 text-xs font-semibold text-heading hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-50";

export function LinkControls({
  state,
  expiresAt,
  canSend,
  onSend,
  onCancel,
}: {
  state: "Sent" | "Expired" | null;
  expiresAt: string | null;
  canSend: boolean;
  onSend: () => Promise<ActionResult<unknown>>;
  onCancel: () => Promise<ActionResult<unknown>>;
}) {
  const { busy, error, run } = useRunner();
  if (!state && !canSend) return null;

  return (
    <div className="mt-2">
      {state === "Sent" && expiresAt && <p className="rounded-lg bg-green-50 px-3 py-1.5 text-xs text-green-800">The link works until {formatCalendarDate(expiresAt)}.</p>}
      {state === "Expired" && <p className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-900">The link has expired: the contractor can no longer answer. Send a new one.</p>}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {canSend && <button type="button" disabled={busy} onClick={() => run(onSend)} className={smallButton}>{state === "Sent" ? "Send the link again" : "Send a new link"}</button>}
        {state === "Sent" && <button type="button" disabled={busy} onClick={() => run(onCancel)} className={smallButton}>Cancel the link</button>}
      </div>
      {error && <p role="alert" className="mt-1 text-xs font-medium text-red-700">{error}</p>}
    </div>
  );
}
