// Backend calls for the landlord's Billing page: their plan, the plans they can choose, and everything about paying for it
// (checkout, switching plan with a preview, cancelling with an optional refund, the card page).
import { backendFetch } from "@/lib/api-client";
import { SessionExpiredError } from "@/lib/api-error";
import type {
  AvailablePlan,
  BillingChangeAnswer,
  BillingChangeResult,
  BillingInterval,
  BillingTiming,
  CancelOptions,
  CancelResult,
  MyBilling,
  MySubscription,
} from "@/lib/types";

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

// The Stripe side: trial end, renewal, a booked change, a cancellation. Empty fields when the landlord has no Stripe subscription.
export async function getMyBilling(token: string): Promise<MyBilling> {
  return readJson(await backendFetch(BILLING, token, { cache: "no-store" }), "Couldn't load your billing.");
}

// Thrown when the backend refuses a billing request; the message is safe to show.
export class PlanChangeRefused extends Error {}

// Turns a refused request into a PlanChangeRefused with a message for the landlord. A dead session becomes SessionExpiredError.
// The backend's own message is used (409 already_on_plan / has_subscription, 404 no_checkout, 402 payment_failed, 422 over_limits
// with a violations list, 502 payment_provider_error); the violations are listed after it.
async function refused(response: Response, fallback: string): Promise<never> {
  if (response.status === 401) throw new SessionExpiredError();
  if (response.status === 429) throw new PlanChangeRefused("Too many attempts. Wait a minute and try again.");

  try {
    const body = (await response.json()) as { message?: string; violations?: { displayName: string; used: number; limit: number }[] };
    const details = (body.violations ?? []).map((v) => `${v.displayName}: ${v.used} used, limit ${v.limit}.`).join(" ");
    if (body.message) throw new PlanChangeRefused(details ? `${body.message} ${details} Reduce usage first.` : body.message);
  } catch (err) {
    if (err instanceof PlanChangeRefused) throw err;
  }
  throw new PlanChangeRefused(fallback);
}

// Sends a billing request and returns the successful response; any refusal is thrown by `refused`.
async function post(path: string, token: string, body: object | undefined, fallback: string): Promise<Response> {
  const response = await backendFetch(`${BILLING}${path}`, token, { method: "POST", body: body ? JSON.stringify(body) : undefined });
  return response.ok ? response : refused(response, fallback);
}

// Asks the backend for the Stripe checkout address of a paid plan, for a landlord with no paid plan yet; it checks the usage fits first.
export async function startCheckout(token: string, packageId: number, interval: BillingInterval): Promise<string> {
  const response = await post("/checkout", token, { PackageId: packageId, Interval: interval }, "Couldn't start checkout. Please try again.");
  const body = (await response.json()) as { url?: string };
  // Only ever send the landlord to an https address.
  if (body.url?.startsWith("https://")) return body.url;
  throw new PlanChangeRefused("Couldn't open the payment page. Please try again.");
}

// What switching to this plan and billing period would cost and when it would happen. Changes nothing.
export async function previewBillingChange(token: string, packageId: number, interval: BillingInterval): Promise<BillingChangeAnswer> {
  const response = await post("/change-preview", token, { PackageId: packageId, Interval: interval }, "Couldn't check that plan. Please try again.");
  return response.json();
}

// Makes the change the preview showed. An upgrade happens now and the difference is charged to the saved card; a lower plan waits
// for the end of the paid period unless timing is "now".
export async function changeBillingPlan(token: string, packageId: number, interval: BillingInterval, timing: BillingTiming): Promise<BillingChangeResult> {
  const response = await post("/change", token, { PackageId: packageId, Interval: interval, Timing: timing }, "Couldn't change your plan. Please try again.");
  return response.json();
}

// Drops a lower plan that was booked for the end of the period.
export async function dropPendingChange(token: string): Promise<void> {
  await post("/pending-change/cancel", token, undefined, "Couldn't keep your plan. Please try again.");
}

// What cancelling would do: when access ends, and whether a full refund is still possible.
export async function getCancelOptions(token: string): Promise<CancelOptions> {
  return readJson(await backendFetch(`${BILLING}/cancel-options`, token, { cache: "no-store" }), "Couldn't load the cancel options.");
}

// Cancels the plan at the end of the paid period (or at once in a trial). With refund true it cancels now and returns the last payment.
export async function cancelBillingPlan(token: string, refund: boolean): Promise<CancelResult> {
  const response = await post("/cancel", token, { Refund: refund }, "Couldn't cancel your plan. Please try again.");
  return response.json();
}

// Takes back a cancellation while the plan is still running.
export async function undoCancel(token: string): Promise<void> {
  await post("/cancel/undo", token, undefined, "Couldn't undo the cancellation. Please try again.");
}

// The address of Stripe's page where the landlord updates their card and sees their invoices.
export async function getCardPageUrl(token: string): Promise<string> {
  const response = await post("/payment-method", token, undefined, "Couldn't open the card page. Please try again.");
  const body = (await response.json()) as { url?: string };
  if (body.url?.startsWith("https://")) return body.url;
  throw new PlanChangeRefused("Couldn't open the card page. Please try again.");
}
