"use client";

// The "Switch plan" popup for a landlord who already pays: asks the backend what the switch would cost, shows it, and only changes
// the plan when the landlord confirms. An upgrade happens now (the difference is charged to the saved card); a lower plan can wait
// for the end of the paid period.
import { useEffect, useState } from "react";
import { AmountRow, BillingDialog, ChoiceRow, ghostButton, primaryButton } from "@/components/billing-dialog";
import { changeAction, previewChangeAction } from "@/lib/billing-actions";
import { dayText, money, pricePer } from "@/lib/billing-format";
import { changeReceipt, nextPaymentLabel } from "@/lib/billing-receipt";
import type { Receipt } from "@/lib/billing-receipt";
import { goToSessionExpired } from "@/lib/session-expired-client";
import type { AvailablePlan, BillingChangePreview, BillingInterval, BillingTiming } from "@/lib/types";

interface Props {
  plan: AvailablePlan;
  interval: BillingInterval;
  // The name of the plan they are on now, for the wording.
  currentName: string;
  onClose: () => void;
  // How many days after a payment the landlord may cancel for a full refund (for the receipt's refund line).
  refundWindowDays: number;
  // Called after a successful change, with the receipt for the Billing page to show.
  onDone: (receipt: Receipt) => void;
}

export function BillingSwitchDialog({ plan, interval, currentName, refundWindowDays, onClose, onDone }: Props) {
  const [preview, setPreview] = useState<BillingChangePreview | null>(null);
  const [timing, setTiming] = useState<BillingTiming>("now");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Asks the backend what the switch would do, when the popup opens.
  useEffect(() => {
    let cancelled = false;
    previewChangeAction(plan.packageId, interval).then((result) => {
      if (cancelled) return;
      if ("error" in result) {
        if (result.expired) return goToSessionExpired();
        setError(result.error);
        return;
      }
      if (result.answer.kind !== "change") {
        setError("Moving to a free plan is a cancellation. Use Cancel plan instead.");
        return;
      }
      setPreview(result.answer.preview);
      setTiming(result.answer.preview.recommendedTiming ?? "now");
    });
    return () => {
      cancelled = true;
    };
  }, [plan.packageId, interval]);

  async function confirm() {
    setBusy(true);
    setError("");
    const result = await changeAction(plan.packageId, interval, timing);
    setBusy(false);
    if ("error" in result) {
      if (result.expired) return goToSessionExpired();
      setError(result.error);
      return;
    }
    onDone(changeReceipt({ fromName: currentName, toName: plan.name, result: result.result, refundWindowDays }));
  }

  return (
    <BillingDialog title={`Switch to ${plan.name}`} subtitle={`${currentName} now`}>
      {!preview && !error && <p className="text-sm text-muted">Checking your plan…</p>}

      {preview && (
        <div className="space-y-3">
          {preview.inTrial && (
            <p className="rounded-lg bg-accent-tint px-3 py-2 text-xs text-body">
              You are on a free trial, so nothing is charged today and your trial end date stays
              {preview.trialEndsAt ? ` (${dayText(preview.trialEndsAt)})` : ""}.
            </p>
          )}

          {preview.allowedTimings.length > 1 && (
            <div className="space-y-2">
              {preview.allowedTimings.map((option) =>
                option === "end_of_period" ? (
                  <ChoiceRow
                    key={option}
                    selected={timing === option}
                    onSelect={() => setTiming(option)}
                    title={`At the end of this period${preview.periodEnd ? ` (${dayText(preview.periodEnd)})` : ""}`}
                    note={`You keep ${currentName} until then. After that you pay ${preview.atPeriodEnd ? pricePer(preview.atPeriodEnd.newAmount, preview.atPeriodEnd.newInterval) : "the new price"}.`}
                    tag={preview.recommendedTiming === option ? "Recommended" : undefined}
                  />
                ) : (
                  <ChoiceRow
                    key={option}
                    selected={timing === option}
                    onSelect={() => setTiming(option)}
                    title="Now"
                    note={`Switch today.${preview.now && preview.now.creditToBalance > 0 ? ` About ${money(preview.now.creditToBalance)} stays as credit on your next bill.` : ""}`}
                    tag={preview.recommendedTiming === option ? "Recommended" : undefined}
                  />
                ),
              )}
            </div>
          )}

          {timing === "now" && preview.now && (
            <div>
              {preview.now.creditForUnusedTime > 0 && <AmountRow label={`Credit for unused ${currentName} time (${preview.daysLeft} days)`} value={`-${money(preview.now.creditForUnusedTime)}`} />}
              {preview.now.chargeForRemainingTime > 0 && <AmountRow label={`${plan.name} for the rest of this period`} value={money(preview.now.chargeForRemainingTime)} />}
              <AmountRow label="Charged today to your saved card" value={money(preview.now.dueToday)} strong />
              {preview.target && <AmountRow label={nextPaymentLabel(preview)} value={pricePer(preview.target.amount, preview.target.interval)} />}
              {!preview.inTrial && preview.isIncrease && <p className="mt-2 text-xs text-muted">Your plan changes right away. If your card is declined, nothing changes.</p>}
            </div>
          )}

          {timing === "end_of_period" && preview.atPeriodEnd && (
            <p className="text-xs text-muted">
              From {dayText(preview.atPeriodEnd.effectiveAt)} you pay {pricePer(preview.atPeriodEnd.newAmount, preview.atPeriodEnd.newInterval)}. Nothing is charged today.
            </p>
          )}
        </div>
      )}

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{error}</p>}

      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onClose} disabled={busy} className={ghostButton}>Close</button>
        {preview && (
          <button type="button" onClick={confirm} disabled={busy} className={primaryButton}>
            {busy ? "Switching…" : "Confirm switch"}
          </button>
        )}
      </div>
    </BillingDialog>
  );
}
