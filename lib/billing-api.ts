// Backend calls for the landlord's Billing page: their plan, the plans they can choose, a preview and the change itself.
import { backendFetch } from "@/lib/api-client";
import { SessionExpiredError } from "@/lib/api-error";
import type { AvailablePlan, MyBilling, MySubscription, PlanChangePreview } from "@/lib/types";

const BASE = "/api/v1/subscription";
const BILLING = "/api/v1/billing";

// Reads a JSON answer; a dead session becomes SessionExpiredError.
async function readJson<T>(response: Response, failure: string): Promise<T> {
  if (response.status === 401) throw new SessionExpiredError();
  if (!response.ok) throw new Error(failure);
  return response.json();
}

export async function getMySubscription(token: string): Promise<MySubscription> {
  return readJson(await backendFetch(BASE, token, { cache: "no-store" }), "Couldn't load your plan.");
}

export async function getAvailablePlans(token: string): Promise<AvailablePlan[]> {
  return readJson(await backendFetch(`${BASE}/packages`, token, { cache: "no-store" }), "Couldn't load the plans.");
}

// What changing to this plan would do, and whether the landlord's current usage fits it. Changes nothing.
export async function previewPlanChange(token: string, packageId: number): Promise<PlanChangePreview> {
  const response = await backendFetch(`${BASE}/preview-change`, token, { method: "POST", body: JSON.stringify({ PackageId: packageId }) });
  return readJson(response, "Couldn't check that plan.");
}

// Thrown when the backend refuses the change; the message is safe to show.
export class PlanChangeRefused extends Error {}

// Moves the landlord to another plan right away (same checks as the preview). Free plans only: a paid plan is refused (402) and goes through checkout.
export async function changeMyPlan(token: string, packageId: number): Promise<void> {
  const response = await backendFetch(`${BASE}/change`, token, { method: "POST", body: JSON.stringify({ PackageId: packageId }) });
  if (response.ok) return;
  if (response.status === 401) throw new SessionExpiredError();
  if (response.status === 429) throw new PlanChangeRefused("Too many attempts. Wait a minute and try again.");
  if (response.status === 402) throw new PlanChangeRefused("This plan is paid. Use its Pay with Stripe button first.");

  try {
    const body = (await response.json()) as { message?: string };
    if (body.message) throw new PlanChangeRefused(body.message);
  } catch (err) {
    if (err instanceof PlanChangeRefused) throw err;
  }
  throw new PlanChangeRefused("Couldn't change your plan. Please try again.");
}

// The Stripe subscription state (trial end, renewal). Empty fields when the landlord has no Stripe subscription.
export async function getMyBilling(token: string): Promise<MyBilling> {
  return readJson(await backendFetch(BILLING, token, { cache: "no-store" }), "Couldn't load your billing.");
}

// Asks the backend for the Stripe checkout address of a paid plan; it checks the usage fits first.
// Errors: 409 already_on_plan, 404 no_checkout / not_found, 422 over_limits (with a violations list).
export async function startCheckout(token: string, packageId: number): Promise<string> {
  const response = await backendFetch(`${BILLING}/checkout`, token, { method: "POST", body: JSON.stringify({ PackageId: packageId }) });
  if (response.status === 401) throw new SessionExpiredError();
  if (response.status === 429) throw new PlanChangeRefused("Too many attempts. Wait a minute and try again.");

  if (response.ok) {
    const body = (await response.json()) as { url?: string };
    // Only ever send the landlord to an https address.
    if (body.url?.startsWith("https://")) return body.url;
    throw new PlanChangeRefused("Couldn't open the payment page. Please try again.");
  }

  try {
    const body = (await response.json()) as { message?: string; violations?: { displayName: string; used: number; limit: number }[] };
    const details = (body.violations ?? []).map((v) => `${v.displayName}: ${v.used} used, limit ${v.limit}.`).join(" ");
    if (body.message) throw new PlanChangeRefused(details ? `${body.message} ${details} Reduce usage first.` : body.message);
  } catch (err) {
    if (err instanceof PlanChangeRefused) throw err;
  }
  throw new PlanChangeRefused("Couldn't start checkout. Please try again.");
}
