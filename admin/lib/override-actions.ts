"use server";

// Server actions for landlord overrides. Each re-checks the input; the backend enforces permissions and the same rules.

import { revalidatePath } from "next/cache";
import { SessionExpiredError } from "@/lib/api-error";
import { requireAdmin } from "@/lib/auth-guard";
import { grantFeatureOverride, grantLimitOverride, revokeOverride } from "@/lib/override-api";
import { PLAN_CHANGE_REASONS } from "@/lib/types";
import type { ActionFailure } from "@/lib/types";

type Done = { ok: true };

function failure(err: unknown, fallback: string): ActionFailure {
  if (err instanceof SessionExpiredError) return { error: err.message, expired: true };
  return { error: err instanceof Error ? err.message : fallback, expired: false };
}

// Checks the reason code, note and optional end date shared by both kinds of grant.
// `endDate` is "yyyy-mm-dd" or empty; it becomes the end of that day in UTC and must be in the future.
function cleanReason(input: { reasonCode: string; note: string; endDate: string }): { reasonCode: string; note: string; expiresAt: string | null } | string {
  if (!PLAN_CHANGE_REASONS.some((r) => r.code === input.reasonCode)) return "Choose a reason.";
  const note = String(input.note ?? "").trim();
  if (!note || note.length > 500) return "Add a short note (up to 500 characters) explaining the change.";

  const endDate = String(input.endDate ?? "").trim();
  if (!endDate) return { reasonCode: input.reasonCode, note, expiresAt: null };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) return "The end date isn't valid.";
  const expiresAt = new Date(`${endDate}T23:59:59Z`);
  if (Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) return "The end date must be in the future.";
  return { reasonCode: input.reasonCode, note, expiresAt: expiresAt.toISOString() };
}

export async function grantLimitOverrideAction(input: {
  landlordProfileId: number;
  limitKey: string;
  additionalValue: number;
  reasonCode: string;
  note: string;
  endDate: string;
}): Promise<Done | ActionFailure> {
  const session = await requireAdmin();
  const amount = Number(input.additionalValue);
  if (!Number.isInteger(amount) || amount < 1 || amount > 1000) {
    return { error: "The extra amount must be a whole number from 1 to 1000.", expired: false };
  }
  const reason = cleanReason(input);
  if (typeof reason === "string") return { error: reason, expired: false };

  try {
    await grantLimitOverride(session.backendToken, Number(input.landlordProfileId), {
      ...reason,
      limitKey: String(input.limitKey),
      additionalValue: amount,
    });
    revalidatePath(`/landlords/${input.landlordProfileId}`);
    return { ok: true };
  } catch (err) {
    return failure(err, "Couldn't add the override. Try again.");
  }
}

export async function grantFeatureOverrideAction(input: {
  landlordProfileId: number;
  featureKey: string;
  grant: boolean;
  reasonCode: string;
  note: string;
  endDate: string;
}): Promise<Done | ActionFailure> {
  const session = await requireAdmin();
  const reason = cleanReason(input);
  if (typeof reason === "string") return { error: reason, expired: false };

  try {
    await grantFeatureOverride(session.backendToken, Number(input.landlordProfileId), {
      ...reason,
      featureKey: String(input.featureKey),
      grant: input.grant === true,
    });
    revalidatePath(`/landlords/${input.landlordProfileId}`);
    return { ok: true };
  } catch (err) {
    return failure(err, "Couldn't add the override. Try again.");
  }
}

export async function revokeOverrideAction(input: {
  landlordProfileId: number;
  kind: "limit" | "feature";
  overrideId: number;
  note: string;
}): Promise<Done | ActionFailure> {
  const session = await requireAdmin();
  const note = String(input.note ?? "").trim();
  if (!note || note.length > 500) return { error: "Add a short note (up to 500 characters).", expired: false };

  try {
    await revokeOverride(session.backendToken, Number(input.landlordProfileId), input.kind === "limit" ? "limit" : "feature", Number(input.overrideId), note);
    revalidatePath(`/landlords/${input.landlordProfileId}`);
    return { ok: true };
  } catch (err) {
    return failure(err, "Couldn't remove the override. Try again.");
  }
}
