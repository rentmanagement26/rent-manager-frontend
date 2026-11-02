// Checks for lib/billing-receipt.ts: the wording and amounts on the receipt after a plan change or a cancellation.
import { describe, expect, it } from "vitest";
import { cancelReceipt, changeReceipt, nextPaymentLabel } from "@/lib/billing-receipt";
import type { BillingChangePreview, BillingChangeResult } from "@/lib/types";

const upgradePreview: BillingChangePreview = {
  inTrial: false,
  trialEndsAt: null,
  current: { interval: "month", amount: 20, currency: "cad" },
  target: { interval: "month", amount: 49, currency: "cad" },
  periodEnd: "2026-12-03T00:00:00Z",
  daysLeft: 15,
  isIncrease: true,
  recommendedTiming: "now",
  allowedTimings: ["now"],
  now: { creditForUnusedTime: 10, chargeForRemainingTime: 24.5, dueToday: 14.5, creditToBalance: 0 },
  atPeriodEnd: null,
};

const upgrade: BillingChangeResult = { applied: true, timing: "now", effectiveAt: null, preview: upgradePreview };

describe("changeReceipt, upgrade now", () => {
  const receipt = changeReceipt({ fromName: "Pro", toName: "Max", result: upgrade, refundWindowDays: 7 });

  it("names the new plan and the amounts", () => {
    expect(receipt.title).toBe("You are now on Max");
    expect(receipt.rows.find((row) => row.label === "Charged to your card today")?.value).toBe("$14.50");
    expect(receipt.rows.find((row) => row.tone === "credit")?.value).toBe("-$10.00");
  });
  it("mentions the refund window and offers no extra button", () => {
    expect(receipt.refundNote).toContain("7 days");
    expect(receipt.action).toBeNull();
  });
});

describe("changeReceipt, booked for the end of the period", () => {
  it("charges nothing today and offers to keep the current plan", () => {
    const booked: BillingChangeResult = {
      applied: true,
      timing: "end_of_period",
      effectiveAt: "2026-12-02T00:00:00Z",
      preview: { ...upgradePreview, isIncrease: false, now: null, atPeriodEnd: { effectiveAt: "2026-12-02T00:00:00Z", newAmount: 20, newInterval: "month" } },
    };
    const receipt = changeReceipt({ fromName: "Max", toName: "Pro", result: booked, refundWindowDays: 7 });
    expect(receipt.rows.find((row) => row.tone === "total")?.value).toBe("$0.00");
    expect(receipt.action).toEqual({ kind: "keepPlan", label: "Keep Max" });
  });
});

describe("cancelReceipt", () => {
  it("ends at the end of the period with an undo button", () => {
    const receipt = cancelReceipt({ planName: "Pro", result: { mode: "at_period_end", accessUntil: "2026-12-02T00:00:00Z", refundAmount: 0 } });
    expect(receipt.action?.kind).toBe("undoCancel");
  });
  it("shows the refunded amount", () => {
    const receipt = cancelReceipt({ planName: "Pro", result: { mode: "refunded", accessUntil: null, refundAmount: 20 } });
    expect(receipt.rows.find((row) => row.tone === "credit")?.value).toBe("$20.00");
  });
});

describe("nextPaymentLabel", () => {
  it("does not use the end of the old period when the billing period changes", () => {
    const toYearly = { ...upgradePreview, target: { interval: "year" as const, amount: 539, currency: "cad" } };
    expect(nextPaymentLabel(toYearly)).toBe("Then each year");
  });
});
