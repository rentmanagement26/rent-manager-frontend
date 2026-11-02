"use client";

// The "Cancel plan" popup: shows what cancelling does (keep the plan until the end of the period, or a full refund and an
// immediate stop within the refund window) and cancels only when the landlord confirms. In a trial it simply ends the trial.
import { useEffect, useState } from "react";
import { BillingDialog, ChoiceRow, ghostButton } from "@/components/billing-dialog";
import { cancelAction, cancelOptionsAction } from "@/lib/billing-actions";
import { dayText, money } from "@/lib/billing-format";
import { goToSessionExpired } from "@/lib/session-expired-client";
import type { CancelOptions } from "@/lib/types";

interface Props {
  currentName: string;
  onClose: () => void;
  // Called after a successful cancellation, with a sentence for the Billing page to show.
  onDone: (message: string) => void;
}

export function BillingCancelDialog({ currentName, onClose, onDone }: Props) {
  const [options, setOptions] = useState<CancelOptions | null>(null);
  const [refund, setRefund] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Asks the backend what cancelling would do, when the popup opens.
  useEffect(() => {
    let cancelled = false;
    cancelOptionsAction().then((result) => {
      if (cancelled) return;
      if ("error" in result) {
        if (result.expired) return goToSessionExpired();
        setError(result.error);
        return;
      }
      setOptions(result.options);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function confirm() {
    setBusy(true);
    setError("");
    const result = await cancelAction(refund);
    setBusy(false);
    if ("error" in result) {
      if (result.expired) return goToSessionExpired();
      setError(result.error);
      return;
    }
    const done = result.result;
    onDone(
      done.mode === "refunded"
        ? `Your plan is cancelled and ${money(done.refundAmount)} is on its way back to your card.`
        : done.mode === "at_period_end"
          ? `Your plan ends on ${done.accessUntil ? dayText(done.accessUntil) : "the end of the period"}. You keep ${currentName} until then.`
          : "Your trial is cancelled. You won't be charged.",
    );
  }

  const canCancel = options?.hasSubscription && !options.alreadyCancelling;

  return (
    <BillingDialog title="Cancel your plan" subtitle={currentName}>
      {!options && !error && <p className="text-sm text-muted">Checking your plan…</p>}

      {options && !options.hasSubscription && <p className="text-sm text-body">You don&apos;t have a paid plan to cancel.</p>}
      {options?.alreadyCancelling && <p className="text-sm text-body">Your plan already ends on {options.accessUntil ? dayText(options.accessUntil) : "the end of the period"}.</p>}

      {options && canCancel && options.inTrial && (
        <p className="text-sm text-body">You are on a free trial, so cancelling ends it today. You pay nothing.</p>
      )}

      {options && canCancel && !options.inTrial && (
        <div className="space-y-2">
          <ChoiceRow
            selected={!refund}
            onSelect={() => setRefund(false)}
            title="Cancel at the end of the period"
            note={`Keep ${currentName} until ${options.accessUntil ? dayText(options.accessUntil) : "the end of the period"}. No more payments after that. You can undo this any time before.`}
          />
          {options.refundEligible && (
            <ChoiceRow
              selected={refund}
              onSelect={() => setRefund(true)}
              title={`Cancel now and get ${money(options.refundAmount)} back`}
              note={`Available for ${options.refundWindowDays} days after a payment${options.refundUntil ? ` (until ${dayText(options.refundUntil)})` : ""}. You move to the free plan today and the refund goes back to your card.`}
            />
          )}
        </div>
      )}

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>}

      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} disabled={busy} className={ghostButton}>Keep my plan</button>
        {canCancel && (
          <button
            type="button"
            onClick={confirm}
            disabled={busy}
            className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Cancelling…" : "Cancel plan"}
          </button>
        )}
      </div>
    </BillingDialog>
  );
}
