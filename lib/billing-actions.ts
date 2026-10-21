"use server";

// Server actions for the Billing page. The backend resolves the landlord from the session, so one landlord can never change another's plan.
import { SessionExpiredError } from "@/lib/api-error";
import { requireBackendToken } from "@/lib/auth-guard";
import { PlanChangeRefused, changeMyPlan, previewPlanChange } from "@/lib/billing-api";
import type { ActionFailure, PlanChangePreview } from "@/lib/types";

function failure(err: unknown, fallback: string): ActionFailure {
  if (err instanceof SessionExpiredError) return { error: err.message, expired: true };
  if (err instanceof PlanChangeRefused) return { error: err.message, expired: false };
  return { error: fallback, expired: false };
}

// Checks a plan before the landlord confirms: direction, and any limit their usage would break.
export async function previewPlanChangeAction(packageId: number): Promise<{ ok: true; preview: PlanChangePreview } | ActionFailure> {
  const session = await requireBackendToken(["Landlord"]);

  try {
    return { ok: true, preview: await previewPlanChange(session.backendToken, Number(packageId)) };
  } catch (err) {
    return failure(err, "Couldn't check that plan. Please try again.");
  }
}

// Confirms the change. Takes no payment.
export async function changePlanAction(packageId: number): Promise<{ ok: true } | ActionFailure> {
  const session = await requireBackendToken(["Landlord"]);

  try {
    await changeMyPlan(session.backendToken, Number(packageId));
    return { ok: true };
  } catch (err) {
    return failure(err, "Couldn't change your plan. Please try again.");
  }
}
