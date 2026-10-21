// Backend calls for the landlord's Billing page: their plan, the plans they can choose, a preview and the change itself.
import { backendFetch } from "@/lib/api-client";
import { SessionExpiredError } from "@/lib/api-error";
import type { AvailablePlan, MySubscription, PlanChangePreview } from "@/lib/types";

const BASE = "/api/v1/subscription";

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

// Moves the landlord to another plan right away (same checks as the preview). No payment is taken: payments are not built yet.
export async function changeMyPlan(token: string, packageId: number): Promise<void> {
  const response = await backendFetch(`${BASE}/change`, token, { method: "POST", body: JSON.stringify({ PackageId: packageId }) });
  if (response.ok) return;
  if (response.status === 401) throw new SessionExpiredError();
  if (response.status === 429) throw new PlanChangeRefused("Too many attempts. Wait a minute and try again.");

  try {
    const body = (await response.json()) as { message?: string };
    if (body.message) throw new PlanChangeRefused(body.message);
  } catch (err) {
    if (err instanceof PlanChangeRefused) throw err;
  }
  throw new PlanChangeRefused("Couldn't change your plan. Please try again.");
}
