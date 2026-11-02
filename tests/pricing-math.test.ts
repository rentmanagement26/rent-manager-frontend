// Checks for lib/pricing-math.ts: the monthly equivalent and the saving shown on yearly plan cards.
import { describe, expect, it } from "vitest";
import { yearlyPerMonth, yearlySaving } from "@/lib/pricing-math";

describe("yearlyPerMonth", () => {
  it("spreads the yearly price over twelve months", () => {
    expect(yearlyPerMonth(220)).toBe(18.33);
    expect(yearlyPerMonth(539)).toBe(44.92);
  });
});

describe("yearlySaving", () => {
  it("is twelve monthly payments minus the yearly price", () => {
    expect(yearlySaving(20, 220)).toBe(20);
    expect(yearlySaving(49, 539)).toBe(49);
  });
  it("is never negative", () => {
    expect(yearlySaving(10, 200)).toBe(0);
  });
});
