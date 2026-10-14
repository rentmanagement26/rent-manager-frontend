"use server";

import { SessionExpiredError } from "@/lib/api-error";
import { requireAdmin } from "@/lib/auth-guard";
import { PlanChangeError, changeLandlordPlan, getLandlordSubscription } from "@/lib/subscription-api";
import { PLAN_CHANGE_REASONS } from "@/lib/types";
import type { ActionFailure, AdminLandlordSubscription, ChangePlanFailure, PlanChangeReasonCode } from "@/lib/types";

// Server actions can be called by anyone holding a session cookie, so each one re-checks its input and the role.
// The backend enforces permissions too; these checks mainly give friendlier messages.

// Loads one landlord's plan and usage when the "Change plan" popup opens.
export async function loadLandlordSubscriptionAction(
  landlordProfileId: number,
): Promise<{ ok: true; data: AdminLandlordSubscription } | ActionFailure> {
  const session = await requireAdmin();

  const result = await getLandlordSubscription(session.backendToken, Number(landlordProfileId));
  if (result.status === "ok") return { ok: true, data: result.data };
  if (result.status === "expired") return { error: "Your session expired. Sign in again.", expired: true };
  if (result.status === "forbidden") return { error: "Your role can't view this landlord's plan.", expired: false };
  return { error: "Couldn't load this landlord's plan. Try again.", expired: false };
}

// Sends the plan change. The backend requires BOTH a reason code and a written note for admin changes.
export async function changePlanAction(input: {
  landlordProfileId: number;
  packageId: number;
  reasonCode: PlanChangeReasonCode;
  note: string;
  overrideUsageCheck: boolean;
}): Promise<{ ok: true } | ChangePlanFailure> {
  const session = await requireAdmin();

  if (session.role === "Support") {
    return { error: "Your role can't change plans.", expired: false };
  }
  if (!PLAN_CHANGE_REASONS.some((r) => r.code === input.reasonCode)) {
    return { error: "Choose a reason.", expired: false };
  }
  const note = String(input.note ?? "").trim();
  if (!note) {
    return { error: "Add a short note explaining the change.", expired: false };
  }
  // Only a SuperAdmin may skip the usage check (the backend refuses anyone else as well).
  const overrideUsageCheck = input.overrideUsageCheck === true && session.role === "SuperAdmin";

  try {
    await changeLandlordPlan(session.backendToken, Number(input.landlordProfileId), {
      packageId: Number(input.packageId),
      reasonCode: input.reasonCode,
      note,
      overrideUsageCheck,
    });
    return { ok: true };
  } catch (err) {
    if (err instanceof SessionExpiredError) return { error: err.message, expired: true };
    if (err instanceof PlanChangeError) {
      return { error: err.message, expired: false, code: err.code, violations: err.violations };
    }
    return { error: "Couldn't change the plan. Try again.", expired: false };
  }
}
