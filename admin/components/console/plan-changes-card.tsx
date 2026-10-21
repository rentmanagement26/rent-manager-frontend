"use client";

// The "Plan changes" card on a landlord's detail page: changes planned for them (queued, told, chose to stay) with Cancel and
// Postpone, and the recent ones that are settled. Cancelling or postponing is in the landlord's favour, so it needs no
// agreement; a note is required and the landlord is told.
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/console/modal";
import { ErrorBox, Pill, cardClass, goToSessionExpired, inputClass, primaryButtonClass, secondaryButtonClass } from "@/components/console/ui";
import { formatDate, tomorrowIso } from "@/lib/format";
import { cancelPlannedChangeAction, postponePlannedChangeAction } from "@/lib/proposal-actions";
import type { AdminScheduledChange } from "@/lib/types";

// Why a rollout was planned, in words.
const RULE_TEXT: Record<string, string> = {
  price_up: "Price rise",
  limits_changed: "Limits changed",
  features_removed: "Feature removed",
  limits_lowered_may_stay: "Lower limits (they may stay)",
  courtesy: "Courtesy note",
  terms_ending: "Old terms ending",
};

// The pill for a change, from its kind and status.
function statusPill(change: AdminScheduledChange) {
  if (change.kind === "proposal") {
    if (change.status === "Notified") return { label: "Awaiting customer", className: "bg-c-pu text-c-put" };
    if (change.status === "Applied") return { label: "Accepted", className: "bg-c-ok text-c-okt" };
    if (change.status === "Declined") return { label: "Declined", className: "bg-c-sf2 text-c-tx2" };
    if (change.status === "Expired") return { label: "Expired", className: "bg-c-sf2 text-c-tx2" };
  } else {
    if (change.status === "Pending") return { label: "Queued", className: "bg-c-sf2 text-c-tx2" };
    if (change.status === "Notified") return { label: "Told", className: "bg-c-aci text-c-act2" };
    if (change.status === "Declined") return { label: "Chose to stay", className: "bg-c-ok text-c-okt" };
    if (change.status === "Applied") return { label: "Applied", className: "bg-c-ok text-c-okt" };
  }
  if (change.status === "Cancelled") return { label: "Cancelled", className: "bg-c-sf2 text-c-tx2" };
  if (change.status === "Failed") return { label: "Failed", className: "bg-c-bad text-c-badt" };
  return { label: change.status, className: "bg-c-sf2 text-c-tx2" };
}

// A rollout that has not been applied or answered yet can be cancelled; one with a date can also be postponed.
function isOpenRollout(change: AdminScheduledChange) {
  return change.kind === "rollout" && (change.status === "Pending" || change.status === "Notified");
}

// One-line description under the plan name.
function detailLine(change: AdminScheduledChange) {
  const parts: string[] = [];
  if (change.kind === "rollout" && change.rule) parts.push(RULE_TEXT[change.rule] ?? change.rule);
  if (change.noticeSentAt) parts.push(`Notice sent ${formatDate(change.noticeSentAt)}`);
  if (change.dueAt && isOpenRollout(change)) parts.push(`Applies ${formatDate(change.dueAt)}`);
  if (change.status === "Declined" && change.kind === "rollout" && change.resolvedAt) parts.push(`Chose to stay ${formatDate(change.resolvedAt)}`);
  if (change.failureReason) parts.push(change.failureReason);
  return parts.join(" · ");
}

type Dialog = { kind: "cancel" | "postpone"; change: AdminScheduledChange } | null;

export function PlanChangesCard({ changes, canChange }: { changes: AdminScheduledChange[]; canChange: boolean }) {
  const router = useRouter();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [note, setNote] = useState("");
  const [until, setUntil] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Earliest date the picker allows: tomorrow (set when a popup opens; the backend also needs a date later than the current one).
  const [earliest, setEarliest] = useState("");

  function open(kind: "cancel" | "postpone", change: AdminScheduledChange) {
    setDialog({ kind, change });
    setNote("");
    setUntil("");
    setError("");
    setEarliest(tomorrowIso());
  }

  async function submit() {
    if (!dialog) return;
    setBusy(true);
    setError("");
    const result =
      dialog.kind === "cancel"
        ? await cancelPlannedChangeAction(dialog.change.id, note)
        : await postponePlannedChangeAction(dialog.change.id, until, note);
    setBusy(false);

    if ("error" in result) {
      if (result.expired) return goToSessionExpired();
      setError(result.error);
      return;
    }
    setDialog(null);
    router.refresh();
  }

  return (
    <section className={`${cardClass} animate-up`}>
      <h2 className="text-lg font-medium">Plan changes</h2>
      <p className="mt-1 text-[13px] text-c-tx2">Changes planned for or proposed to this landlord, newest first.</p>

      <ul className="mt-3 flex flex-col">
        {changes.map((change) => {
          const pill = statusPill(change);
          const line = detailLine(change);
          const open_ = isOpenRollout(change);
          return (
            <li key={change.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-c-bd py-3 first:border-t-0">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  {change.kind === "proposal" ? "Proposal: " : ""}
                  {change.targetPackageName}
                  <Pill className={pill.className}>{pill.label}</Pill>
                </p>
                {line && <p className="mt-0.5 text-xs text-c-tx2">{line}</p>}
              </div>
              {canChange && open_ && (
                <div className="flex gap-2">
                  {change.dueAt && (
                    <button type="button" onClick={() => open("postpone", change)} className={`${secondaryButtonClass} h-8 px-3 text-xs`}>
                      Postpone
                    </button>
                  )}
                  <button type="button" onClick={() => open("cancel", change)} className={`${secondaryButtonClass} h-8 px-3 text-xs`}>
                    Cancel
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {dialog && (
        <Modal
          title={dialog.kind === "cancel" ? "Cancel planned change" : "Postpone planned change"}
          subtitle={`${dialog.change.targetPackageName} · the landlord is told`}
          busy={busy}
          onClose={() => setDialog(null)}
        >
          <div className="flex flex-col gap-4">
            {dialog.kind === "postpone" && (
              <div className="flex flex-col gap-2">
                <label htmlFor="postpone-until" className="text-xs text-c-tx2">
                  Move it to the first billing date on or after
                </label>
                <input
                  id="postpone-until"
                  type="date"
                  min={earliest}
                  value={until}
                  onChange={(e) => setUntil(e.target.value)}
                  className={inputClass}
                />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <label htmlFor="change-note" className="text-xs text-c-tx2">
                Note (required)
              </label>
              <textarea
                id="change-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                rows={3}
                className={`${inputClass} h-auto py-2.5`}
              />
            </div>
            <ErrorBox message={error} />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDialog(null)} disabled={busy} className={secondaryButtonClass}>
                Back
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={busy || !note.trim() || (dialog.kind === "postpone" && !until)}
                className={primaryButtonClass}
              >
                {busy ? "Saving…" : dialog.kind === "cancel" ? "Cancel change" : "Postpone"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </section>
  );
}
