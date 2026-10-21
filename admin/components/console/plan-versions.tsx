"use client";

// The "Versions" button on a plan card and the popup it opens: every version the plan has had, newest first.

import { useEffect, useState } from "react";
import { Modal } from "@/components/console/modal";
import { ErrorBox, Pill, goToSessionExpired, inputClass, primaryButtonClass, secondaryButtonClass } from "@/components/console/ui";
import { daysFromNowIso, formatDate, formatPrice, formatWhen } from "@/lib/format";
import { clearTermsEndDateAction, loadPlanVersionsAction, setTermsEndDateAction } from "@/lib/package-actions";
import type { AdminPackageDetail, PackageVersionDetail } from "@/lib/types";

// Loads the history when the popup opens (not with the page), because most visits never look at it.
function VersionsModal({
  packageId,
  planName,
  canManage,
  onClose,
}: {
  packageId: number;
  planName: string;
  canManage: boolean;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<AdminPackageDetail | null>(null);
  const [error, setError] = useState("");
  // The older version whose end date is being set or removed, and the form for it.
  const [editing, setEditing] = useState<{ version: PackageVersionDetail; remove: boolean } | null>(null);
  const [endsAt, setEndsAt] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [result, setResult] = useState("");
  // Earliest end date: the price-rise notice is 60 days (the backend checks as well).
  const [earliest, setEarliest] = useState("");

  // Bumped after a save so the list loads again.
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    loadPlanVersionsAction(packageId).then((answer) => {
      if (cancelled) return;
      if ("error" in answer) {
        if (answer.expired) return goToSessionExpired();
        setError(answer.error);
        return;
      }
      setDetail(answer.data);
    });
    // Ignore the answer if the popup was closed before it arrived.
    return () => {
      cancelled = true;
    };
  }, [packageId, reloadKey]);

  function openForm(version: PackageVersionDetail, remove: boolean) {
    setEditing({ version, remove });
    setEndsAt(version.termsEndAt ? version.termsEndAt.slice(0, 10) : "");
    setNote("");
    setFormError("");
    setEarliest(daysFromNowIso(60));
  }

  async function submit() {
    if (!editing) return;
    setBusy(true);
    setFormError("");
    const input = { packageId, versionId: editing.version.packageVersionId, note };
    const answer = editing.remove ? await clearTermsEndDateAction(input) : await setTermsEndDateAction({ ...input, endsAt });
    setBusy(false);

    if ("error" in answer) {
      if (answer.expired) return goToSessionExpired();
      setFormError(answer.error);
      return;
    }
    const { landlords, noticesQueued } = answer.result;
    setResult(`${landlords} ${landlords === 1 ? "landlord" : "landlords"} on these terms, ${noticesQueued} ${noticesQueued === 1 ? "notice" : "notices"} queued.`);
    setEditing(null);
    setReloadKey((k) => k + 1);
  }

  return (
    <Modal title="Versions" subtitle={planName} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <ErrorBox message={error} />
        {!detail && !error && <p className="text-[13px] text-c-tx3">Loading…</p>}

        {detail?.versions.map((v) => (
          <article key={v.packageVersionId} className="rounded-xl bg-c-sf2 px-4 py-3 text-[13px]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2 font-medium">
                Version {v.version}
                {v.isCurrent && <Pill className="bg-c-ok text-c-okt">Current</Pill>}
              </span>
              <span className="text-xs text-c-tx3">{formatWhen(v.createdAt)}</span>
            </div>
            <p className="mt-1 text-c-tx2">
              {formatPrice(v.monthlyPrice)} / month · {v.landlords} {v.landlords === 1 ? "landlord" : "landlords"}
            </p>
            {v.limits.length > 0 && (
              <p className="mt-2 text-c-tx2">{v.limits.map((l) => `${l.displayName}: ${l.value}`).join(" · ")}</p>
            )}
            <p className="mt-1 text-c-tx2">
              {v.features.length > 0 ? v.features.map((f) => f.displayName).join(", ") : "No extra features"}
            </p>
            {!v.isCurrent && (
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-c-bd pt-2">
                <span className="text-xs text-c-tx2">
                  {v.termsEndAt ? `Ends ${formatDate(v.termsEndAt)}` : "No end date"}
                  {!!v.landlordsChoseToStay && ` · ${v.landlordsChoseToStay} chose to stay`}
                </span>
                {canManage && (
                  <span className="flex gap-2">
                    <button type="button" onClick={() => openForm(v, false)} className={`${secondaryButtonClass} h-8 px-3 text-xs`}>
                      {v.termsEndAt ? "Change date" : "Set end date"}
                    </button>
                    {v.termsEndAt && (
                      <button type="button" onClick={() => openForm(v, true)} className={`${secondaryButtonClass} h-8 px-3 text-xs`}>
                        Remove
                      </button>
                    )}
                  </span>
                )}
              </div>
            )}
          </article>
        ))}

        {result && <p className="rounded-[10px] bg-c-ok px-3 py-2.5 text-[13px] text-c-okt">{result}</p>}

        {editing && (
          <div className="flex flex-col gap-3 rounded-xl border border-c-bd2 p-4">
            <p className="text-[13px] font-medium">
              {editing.remove ? `Remove the end date of version ${editing.version.version}` : `End date for version ${editing.version.version}`}
            </p>
            <p className="text-xs text-c-tx2">
              {editing.remove
                ? "The landlords on these terms go back to the usual rules for the newest terms, and are told."
                : "Everyone still on these terms, including those who chose to stay, is told and moves to the newest terms on the first billing date on or after it."}
            </p>
            {!editing.remove && (
              <div className="flex flex-col gap-2">
                <label htmlFor="terms-end" className="text-xs text-c-tx2">
                  Ends on (at least 60 days from today)
                </label>
                <input id="terms-end" type="date" min={earliest} value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className={inputClass} />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <label htmlFor="terms-note" className="text-xs text-c-tx2">
                Note (required)
              </label>
              <textarea id="terms-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={2} className={`${inputClass} h-auto py-2.5`} />
            </div>
            <ErrorBox message={formError} />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} disabled={busy} className={secondaryButtonClass}>
                Back
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={busy || !note.trim() || (!editing.remove && !endsAt)}
                className={primaryButtonClass}
              >
                {busy ? "Saving…" : editing.remove ? "Remove end date" : "Save end date"}
              </button>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button type="button" onClick={onClose} className={secondaryButtonClass}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

// Shown on every plan card, for every role that can see plans.
export function PlanVersionsButton({ packageId, planName, canManage }: { packageId: number; planName: string; canManage: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="self-start text-[13px] text-c-act2 hover:underline">
        Versions
      </button>
      {open && <VersionsModal packageId={packageId} planName={planName} canManage={canManage} onClose={() => setOpen(false)} />}
    </>
  );
}
