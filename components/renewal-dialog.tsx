"use client";

// The renewal popup: record what the landlord plans at the end of the fixed term, snooze the reminders for this lease, or change its notice period.
// It only records a plan. Nothing is sent to the tenant, and the app does not check the plan against provincial law.
import { useRouter } from "next/navigation";
import { useState } from "react";
import { decideRenewalAction, setNoticeDaysAction, snoozeRenewalAction, type RenewalResult } from "@/lib/renewal-actions";
import { goToSessionExpired } from "@/lib/session-expired-client";

const OPTIONS = [
  { value: "offered", title: "Offer a renewal", note: "You will offer a new term. Nothing is sent to the tenant." },
  { value: "month_to_month", title: "Continue month to month", note: "The lease becomes month to month from the end date, and the end date is removed." },
  { value: "not_renewing", title: "Not renewing", note: "You plan to end the tenancy. This only records your plan." },
  { value: "pending", title: "No decision yet", note: "Clear a decision you made earlier." },
] as const;

// "Offered", "NotRenewing", "MonthToMonth", "Pending" -> the matching option value.
function currentValue(decision: string): string {
  const wire = decision.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
  return OPTIONS.some((option) => option.value === wire) ? wire : "pending";
}

const primaryButton = "rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50";
const ghostButton = "rounded-full border border-default bg-white px-4 py-2 text-sm font-semibold text-heading hover:bg-subtle disabled:cursor-not-allowed disabled:opacity-50";
const selectClass = "rounded-lg border border-default bg-white px-2.5 py-2 text-sm text-heading focus:border-accent focus:outline-none";

export function RenewalDialogButton({
  tenancyId,
  heading,
  endDate,
  decision,
  noticeDays,
  snoozed,
  label = "Decide",
  primary = true,
}: {
  tenancyId: number;
  // For example "Riverside Townhome, Basement unit".
  heading: string;
  endDate: string | null;
  decision: string;
  noticeDays: number | null;
  snoozed: boolean;
  label?: string;
  primary?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState(currentValue(decision));
  const [notice, setNotice] = useState(noticeDays?.toString() ?? "");
  const [snoozeDays, setSnoozeDays] = useState("7");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Runs one action: shows its error or a short confirmation, and refreshes the page behind the popup.
  async function run(action: () => Promise<RenewalResult>, success: string, closeAfter = false) {
    setBusy(true);
    setError("");
    setMessage("");
    const answer = await action();
    setBusy(false);
    if ("error" in answer) return answer.expired ? goToSessionExpired() : setError(answer.error);
    setMessage(success);
    router.refresh();
    if (closeAfter) setOpen(false);
  }

  const noticeNumber = Number(notice);
  const noticeValid = notice === "" || (Number.isInteger(noticeNumber) && noticeNumber >= 14 && noticeNumber <= 365);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={primary ? primaryButton : ghostButton}>
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label="Renewal">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="font-head text-lg font-bold text-heading">What will you do when this term ends?</h2>
            <p className="mt-0.5 text-xs text-muted">{heading}{endDate ? ` · ends ${endDate}` : ""}</p>

            <div className="mt-4 space-y-2">
              {OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setChoice(option.value)}
                  aria-pressed={choice === option.value}
                  className={`flex w-full gap-3 rounded-xl border-[1.5px] p-3 text-left ${choice === option.value ? "border-accent bg-accent-tint" : "border-default bg-white hover:border-accent"}`}
                >
                  <span className={`mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 ${choice === option.value ? "border-accent bg-accent" : "border-slate-300"}`} />
                  <span>
                    <span className="block text-sm font-semibold text-heading">{option.title}</span>
                    <span className="block text-xs text-muted">{option.note}</span>
                  </span>
                </button>
              ))}
            </div>

            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              This only records your plan. It does not send a notice to the tenant. In Ontario a fixed term normally continues as month to month unless a valid notice and legal
              grounds apply, so check your province&apos;s rules before choosing &ldquo;Not renewing&rdquo;.
            </p>

            <div className="mt-4 space-y-3 border-t border-default pt-4 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <label htmlFor="notice" className="text-heading">Notice period (days)</label>
                <input id="notice" type="number" min={14} max={365} placeholder="Default" value={notice} onChange={(event) => setNotice(event.target.value)} className={`${selectClass} w-24`} />
                <button type="button" disabled={busy || !noticeValid} onClick={() => run(() => setNoticeDaysAction(tenancyId, notice === "" ? null : noticeNumber), "Notice period saved.")} className={ghostButton}>Save</button>
                {!noticeValid && <span className="text-xs text-red-700">14 to 365 days</span>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-heading">Reminders</span>
                <select aria-label="Snooze for" value={snoozeDays} onChange={(event) => setSnoozeDays(event.target.value)} className={selectClass}>
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                </select>
                <button type="button" disabled={busy} onClick={() => run(() => snoozeRenewalAction(tenancyId, Number(snoozeDays)), `Reminders paused for ${snoozeDays} days.`)} className={ghostButton}>Snooze</button>
                {snoozed && <button type="button" disabled={busy} onClick={() => run(() => snoozeRenewalAction(tenancyId, null), "Reminders resumed.")} className="text-xs font-semibold text-accent hover:text-accent-dark">Resume now</button>}
              </div>
            </div>

            {message && <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700">{message}</p>}
            {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>}

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} disabled={busy} className={ghostButton}>Close</button>
              <button type="button" disabled={busy} onClick={() => run(() => decideRenewalAction(tenancyId, choice), "Decision saved.", true)} className={primaryButton}>
                {busy ? "Saving…" : "Save decision"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
