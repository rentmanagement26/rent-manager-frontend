// Small text helpers shared by the Billing page and its popups: money, billing periods and dates.
import type { BillingInterval } from "@/lib/types";

// "$20.00". Amounts from the backend are already in dollars.
export function money(value: number): string {
  return `$${value.toFixed(2)}`;
}

// "$20.00/mo" or "$220.00/yr".
export function pricePer(value: number, interval: BillingInterval): string {
  return `${money(value)}${interval === "year" ? "/yr" : "/mo"}`;
}

// "Dec 2, 2026". Used for instants such as a renewal or trial end.
export function dayText(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
}
