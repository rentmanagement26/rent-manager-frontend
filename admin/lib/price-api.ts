// Calls for what customers pay: a plan's Stripe price, and a custom price for one landlord.
import { getJson } from "@/lib/api-client";
import { send } from "@/lib/staff-api";
import type { PackageBilling, PriceOverride } from "@/lib/types";

const PACKAGES = "/api/v1/admin/packages";
const LANDLORDS = "/api/v1/admin/landlords";

// How a plan is sold in Stripe right now (its Price id, and the older payment link if it still has one).
export function getPackageBilling(token: string, packageId: number) {
  return getJson<PackageBilling>(`${PACKAGES}/${packageId}/billing-link`, token);
}

// Sets the Stripe Price (price_...) landlords pay for a plan. The backend asks Stripe first and refuses a wrong or archived price.
export function setStripePrice(token: string, packageId: number, stripePriceId: string) {
  return send<null>("PUT", `${PACKAGES}/${packageId}/stripe-price`, token, { StripePriceId: stripePriceId });
}

// Every custom price the landlord has had, newest first, including removed ones.
export async function getPriceOverrides(token: string, landlordProfileId: number) {
  const result = await getJson<{ items: PriceOverride[] }>(`${LANDLORDS}/${landlordProfileId}/price-overrides?includeInactive=true`, token);
  return result.status === "ok" ? { status: "ok" as const, data: result.data.items } : result;
}

export interface GrantPriceInput {
  kind: "fixed_amount" | "percent_off";
  monthlyAmount: number | null;
  percentOff: number | null;
  months: number | null; // null = for as long as the landlord stays
  reasonCode: string;
  note: string;
}

// Gives the landlord a custom price. One can be live at a time.
export function grantPriceOverride(token: string, landlordProfileId: number, input: GrantPriceInput) {
  return send<{ id: number; onSubscriptionNow: boolean }>("POST", `${LANDLORDS}/${landlordProfileId}/price-overrides`, token, {
    Kind: input.kind,
    MonthlyAmount: input.monthlyAmount,
    PercentOff: input.percentOff,
    Months: input.months,
    ReasonCode: input.reasonCode,
    Note: input.note,
  });
}

// Removes a custom price. The note is required.
export function revokePriceOverride(token: string, landlordProfileId: number, overrideId: number, note: string) {
  return send<null>("POST", `${LANDLORDS}/${landlordProfileId}/price-overrides/${overrideId}/revoke`, token, { Note: note });
}
