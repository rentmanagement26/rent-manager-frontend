// Builds the receipt card the Billing page shows after a plan change or a cancellation: a title, a sentence, a few labelled amounts and one
// note. It only turns the backend's figures into text; the card itself is components/billing-receipt.tsx.
import { dayText, money, pricePer } from "@/lib/billing-format";
import type { BillingChangePreview, BillingChangeResult, BillingInterval, CancelResult } from "@/lib/types";

export interface ReceiptRow {
  label: string;
  value: string;
  // "credit" is shown in green (money back); "total" is the highlighted line (what is charged today).
  tone?: "credit" | "total";
}

export interface Receipt {
  // success (green), notice (amber, something is booked for later) or refund (orange).
  tone: "success" | "notice" | "refund";
  title: string;
  lead: string;
  rows: ReceiptRow[];
  note: { tone: "success" | "notice"; text: string };
  // A line about the refund policy, or null.
  refundNote: string | null;
  // The one button besides Done, or null: keep the current plan (drop a booked change) or undo a cancellation.
  action: { kind: "keepPlan" | "undoCancel"; label: string } | null;
}

const periodName = (interval: BillingInterval) => (interval === "year" ? "yearly" : "monthly");

// "First payment, Dec 2, 2026" after a trial, "Next payment, Dec 2, 2026" when the billing period stays the same, or "Then each year"
// when the plan moves between monthly and yearly (the new period starts today, so the end of the old one is not the next payment).
export function nextPaymentLabel(preview: BillingChangePreview): string {
  if (preview.inTrial && preview.trialEndsAt) return `First payment, ${dayText(preview.trialEndsAt)}`;
  const sameInterval = preview.current?.interval === preview.target?.interval;
  if (sameInterval && preview.periodEnd) return `Next payment, ${dayText(preview.periodEnd)}`;
  return preview.target?.interval === "year" ? "Then each year" : "Then each month";
}

// The receipt after a switch: made now (an upgrade, or a change of billing period) or booked for the end of the period.
export function changeReceipt(input: { fromName: string; toName: string; result: BillingChangeResult; refundWindowDays: number }): Receipt {
  const { fromName, toName, result, refundWindowDays } = input;
  const preview = result.preview;

  // Booked for the end of the paid period: nothing is charged today.
  if (result.timing === "end_of_period") {
    const date = dayText(result.effectiveAt ?? preview.atPeriodEnd?.effectiveAt ?? "");
    return {
      tone: "notice",
      title: `Your plan changes to ${toName} on ${date}`,
      lead: `You keep ${fromName} until then, so you lose nothing you have paid for. Nothing is charged today.`,
      rows: [
        { label: "Now", value: `${fromName}, until ${date}` },
        { label: "Then", value: toName },
        ...(preview.atPeriodEnd ? [{ label: `New price from ${date}`, value: pricePer(preview.atPeriodEnd.newAmount, preview.atPeriodEnd.newInterval) }] : []),
        { label: "Charged today", value: money(0), tone: "total" as const },
      ],
      note: { tone: "notice", text: `Changed your mind? You can keep ${fromName} any time before ${date}.` },
      refundNote: null,
      action: { kind: "keepPlan", label: `Keep ${fromName}` },
    };
  }

  const now = preview.now;
  const samePlan = fromName === toName;
  const periodChanged = !!preview.current && !!preview.target && preview.current.interval !== preview.target.interval;
  const withPeriod = (name: string, interval?: BillingInterval) => (samePlan && periodChanged && interval ? `${name}, ${periodName(interval)}` : name);

  const rows: ReceiptRow[] = [
    { label: "Before", value: withPeriod(fromName, preview.current?.interval) },
    { label: "Now", value: withPeriod(toName, preview.target?.interval) },
  ];
  if (preview.target) rows.push({ label: "New price", value: pricePer(preview.target.amount, preview.target.interval) });
  if (now && now.creditForUnusedTime > 0) rows.push({ label: `Credit for unused days on ${fromName}`, value: `-${money(now.creditForUnusedTime)}`, tone: "credit" });
  if (now && now.chargeForRemainingTime > 0) rows.push({ label: `${toName} for the rest of this period`, value: money(now.chargeForRemainingTime) });
  rows.push({ label: "Charged to your card today", value: money(now?.dueToday ?? 0), tone: "total" });
  if (preview.target) rows.push({ label: nextPaymentLabel(preview), value: pricePer(preview.target.amount, preview.target.interval) });

  return {
    tone: "success",
    title: samePlan && periodChanged ? `You are now billed ${periodName(preview.target?.interval ?? "month")}` : `You are now on ${toName}`,
    lead: preview.inTrial
      ? `You changed from ${fromName} to ${toName}. You are on a free trial, so nothing is charged today and your trial end date stays.`
      : `You changed from ${fromName} to ${toName}. We worked out the days you had already paid for, so you only pay the difference.`,
    rows,
    note: { tone: "success", text: "Everything in your new plan is ready to use right now." },
    refundNote: `Cancel within ${refundWindowDays} days of a payment and you can have that payment refunded in full. You will find this under Manage subscription.`,
    action: null,
  };
}

// The receipt after a cancellation: at the end of the period, with a refund, or a trial ended.
export function cancelReceipt(input: { planName: string; result: CancelResult }): Receipt {
  const { planName, result } = input;

  if (result.mode === "refunded") {
    return {
      tone: "refund",
      title: "Your plan is cancelled",
      lead: `Your last payment of ${money(result.refundAmount)} is on its way back to your card. You are now on the free plan.`,
      rows: [
        { label: "Plan cancelled", value: planName },
        { label: "Refunded", value: money(result.refundAmount), tone: "credit" },
        { label: "Your plan now", value: "Free plan" },
      ],
      note: { tone: "success", text: "No more payments will be taken." },
      refundNote: null,
      action: null,
    };
  }

  if (result.mode === "at_period_end") {
    const date = result.accessUntil ? dayText(result.accessUntil) : "the end of the period";
    return {
      tone: "notice",
      title: `Your plan ends on ${date}`,
      lead: `You keep ${planName} until then. There are no more payments after that.`,
      rows: [
        { label: "Plan", value: planName },
        { label: "Access until", value: date },
        { label: "After that", value: "Free plan" },
        { label: "Charged today", value: money(0), tone: "total" },
      ],
      note: { tone: "notice", text: `You can undo this any time before ${date}.` },
      refundNote: null,
      action: { kind: "undoCancel", label: "Undo cancel" },
    };
  }

  return {
    tone: "success",
    title: "Your trial is cancelled",
    lead: "You won't be charged.",
    rows: [
      { label: "Plan cancelled", value: planName },
      { label: "Charged today", value: money(0), tone: "total" },
    ],
    note: { tone: "success", text: "No payment was taken." },
    refundNote: null,
    action: null,
  };
}
