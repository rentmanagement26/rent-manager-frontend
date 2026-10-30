"use client";

// The landlord's buttons on a lease document: send, remind, extend, withdraw, and accept or reject a tenant's paper scan.
// Each button calls a server action, shows the backend's message if it refuses, then refreshes the page.
import { useRouter } from "next/navigation";
import { goToSessionExpired } from "@/lib/session-expired-client";
import { useState } from "react";
import {
  acceptCopyAction,
  extendDocumentAction,
  rejectCopyAction,
  remindSignersAction,
  sendDocumentAction,
  withdrawDocumentAction,
  type ActionResult,
} from "@/lib/document-actions";
import type { LeaseDocument } from "@/lib/document-types";

const primaryButton = "rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50";
const ghostButton = "rounded-full border border-default bg-white px-4 py-2 text-sm font-semibold text-heading hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-50";
const selectClass = "rounded-lg border border-default px-2.5 py-2 text-sm text-heading focus:border-accent focus:outline-none";

export function DocumentControls({ doc }: { doc: LeaseDocument }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [days, setDays] = useState("30");
  const [rejecting, setRejecting] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);

  const landlordSigned = doc.signers.some((s) => s.role === "Landlord" && s.status === "Signed");
  const readyToSend = doc.status === "AwaitingLandlord" && landlordSigned;
  const sent = doc.status === "AwaitingTenants" || doc.status === "Expired";
  const canWithdraw = doc.status !== "Completed" && doc.status !== "Withdrawn";
  const pendingCopies = doc.copies.filter((c) => c.status === "Pending" || c.status === "Uploaded");

  // Runs one action: shows its error, or its success message, and refreshes the page data.
  async function run<T>(action: () => Promise<ActionResult<T>>, success: string) {
    setBusy(true);
    setError("");
    setNotice("");
    const answer = await action();
    setBusy(false);
    if ("error" in answer) return answer.expired ? (goToSessionExpired()) : setError(answer.error);
    setNotice(success);
    setRejecting(null);
    setReason("");
    setConfirmWithdraw(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {notice && <p className="rounded-lg bg-green-50 px-3 py-2.5 text-sm font-medium text-green-700">{notice}</p>}
      {error && <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700">{error}</p>}

      {readyToSend && (
        <section className="rounded-2xl border border-default bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-heading">Send to your tenants</h2>
          <p className="mt-1 text-sm text-muted">You have signed. Tenants get an email and can read and sign. The lease details as they are now are saved with the document.</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label htmlFor="valid" className="text-sm text-heading">Valid for</label>
            <select id="valid" value={days} onChange={(event) => setDays(event.target.value)} className={selectClass}>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
              <option value="none">No deadline</option>
            </select>
            <button type="button" disabled={busy} onClick={() => run(() => sendDocumentAction(doc.id, days === "none" ? null : Number(days)), "Lease sent to your tenants.")} className={primaryButton}>
              {busy ? "Sending…" : "Send to tenants"}
            </button>
          </div>
        </section>
      )}

      {pendingCopies.length > 0 && (
        <section className="rounded-2xl border border-default bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-heading">Signed copies to check</h2>
          <ul className="mt-3 divide-y divide-default text-sm">
            {pendingCopies.map((copy) => (
              <li key={copy.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span>
                    <span className="font-medium text-heading">{copy.uploadedByName}</span>
                    <span className="ml-2 text-xs text-muted">{copy.fileName} · {copy.pageCount} pages{copy.coversSigners.length > 0 ? ` · also covers ${copy.coversSigners.join(", ")}` : ""}</span>
                  </span>
                  <span className="flex flex-wrap gap-2">
                    <a href={`/api/documents/${doc.id}/file?kind=TenantSignedCopy&copyId=${copy.id}`} target="_blank" rel="noreferrer" className={ghostButton}>Open scan</a>
                    <button type="button" disabled={busy} onClick={() => run(() => acceptCopyAction(doc.id, copy.id), "Signed copy accepted.")} className={primaryButton}>Accept</button>
                    <button type="button" disabled={busy} onClick={() => setRejecting(copy.id)} className={ghostButton}>Reject</button>
                  </span>
                </div>
                {rejecting === copy.id && (
                  <div className="mt-3 space-y-2">
                    <label htmlFor={`reason-${copy.id}`} className="text-xs font-semibold text-heading">Why? The tenant sees this and can scan it again (3 to 500 characters)</label>
                    <textarea id={`reason-${copy.id}`} value={reason} onChange={(event) => setReason(event.target.value)} rows={2} maxLength={500} className="w-full rounded-lg border border-default px-3 py-2 text-sm focus:border-accent focus:outline-none" />
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => setRejecting(null)} className={ghostButton}>Cancel</button>
                      <button type="button" disabled={busy || reason.trim().length < 3} onClick={() => run(() => rejectCopyAction(doc.id, copy.id, reason), "Signed copy rejected.")} className={primaryButton}>Reject copy</button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {(sent || canWithdraw) && (
        <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-default bg-white p-5 shadow-sm">
          {sent && doc.status === "AwaitingTenants" && (
            <button type="button" disabled={busy} onClick={() => run(() => remindSignersAction(doc.id), "Reminder sent to tenants who have not signed.")} className={ghostButton}>Remind tenants</button>
          )}
          {sent && (
            <span className="flex items-center gap-2">
              <select aria-label="Extend by" value={days} onChange={(event) => setDays(event.target.value)} className={selectClass}>
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
                <option value="60">60 days</option>
              </select>
              <button type="button" disabled={busy} onClick={() => run(() => extendDocumentAction(doc.id, Number(days === "none" ? 30 : days)), "Deadline extended.")} className={ghostButton}>Give more time</button>
            </span>
          )}
          {canWithdraw && !confirmWithdraw && (
            <button type="button" onClick={() => setConfirmWithdraw(true)} className="ml-auto text-sm font-semibold text-red-700 hover:text-red-800">Withdraw lease</button>
          )}
          {canWithdraw && confirmWithdraw && (
            <span className="ml-auto flex items-center gap-2 text-sm">
              Withdraw this lease? Tenants it was sent to are told.
              <button type="button" disabled={busy} onClick={() => run(() => withdrawDocumentAction(doc.id), "Lease withdrawn.")} className={primaryButton}>Yes, withdraw</button>
              <button type="button" onClick={() => setConfirmWithdraw(false)} className={ghostButton}>Keep it</button>
            </span>
          )}
        </section>
      )}
    </div>
  );
}
