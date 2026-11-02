// Checks for lib/billing-offer.ts: the trial and custom price wording on the Billing page.
import { describe, expect, it } from "vitest";
import { offerText, priceAfterOverride } from "@/lib/billing-offer";

describe("priceAfterOverride", () => {
  it("keeps the plan price with no custom price", () => {
    expect(priceAfterOverride(20, null)).toBe(20);
  });
  it("replaces the price with a fixed amount", () => {
    expect(priceAfterOverride(20, { kind: "fixed_amount", monthlyAmount: 15, percentOff: null, months: null })).toBe(15);
  });
  it("multiplies a fixed monthly amount by 12 on a yearly plan", () => {
    expect(priceAfterOverride(220, { kind: "fixed_amount", monthlyAmount: 15, percentOff: null, months: null }, "year")).toBe(180);
  });
  it("takes a percent off", () => {
    expect(priceAfterOverride(20, { kind: "percent_off", monthlyAmount: null, percentOff: 50, months: 6 })).toBe(10);
  });
});

describe("offerText", () => {
  it("is empty when nothing differs", () => {
    expect(offerText(20, null, null)).toBeNull();
  });
  it("describes a trial", () => {
    expect(offerText(20, 1, null)).toBe("1 month free, then $20.00/mo");
  });
  it("describes a yearly trial", () => {
    expect(offerText(220, 1, null, "year")).toBe("1 month free, then $220.00/yr");
  });
  it("describes a limited custom price", () => {
    const over = { kind: "percent_off" as const, monthlyAmount: null, percentOff: 50, months: 6 };
    expect(offerText(20, null, over)).toBe("$10.00/mo for 6 months, then $20.00/mo");
  });
});
