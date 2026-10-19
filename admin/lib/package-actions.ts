"use server";

// Server actions for editing plans. Each re-checks the input; the backend enforces permissions and the same rules.

import { revalidatePath } from "next/cache";
import { SessionExpiredError } from "@/lib/api-error";
import { requireAdmin } from "@/lib/auth-guard";
import { createPackage, publishPackageVersion, updatePackage } from "@/lib/package-api";
import type { PlanContentInput } from "@/lib/package-api";
import type { ActionFailure } from "@/lib/types";

type Done = { ok: true };

function failure(err: unknown, fallback: string): ActionFailure {
  if (err instanceof SessionExpiredError) return { error: err.message, expired: true };
  return { error: err instanceof Error ? err.message : fallback, expired: false };
}

// True when `value` is a number in [0, max] with at most two decimals (the backend's rule for prices and limits).
function validAmount(value: number, max: number) {
  return Number.isFinite(value) && value >= 0 && value <= max && Math.round(value * 100) / 100 === value;
}

// Checks price, limits and features; returns the cleaned content or an error message.
function cleanContent(input: PlanContentInput): PlanContentInput | string {
  const monthlyPrice = Number(input.monthlyPrice);
  if (!validAmount(monthlyPrice, 100_000)) {
    return "The monthly price must be between 0 and 100,000, with at most two decimals.";
  }
  const limits = (input.limits ?? []).map((l) => ({ limitKey: String(l.limitKey), value: Number(l.value) }));
  const bad = limits.find((l) => !validAmount(l.value, 1_000_000));
  if (bad) return `The value for ${bad.limitKey} must be between 0 and 1,000,000, with at most two decimals.`;
  const featureKeys = Array.from(new Set((input.featureKeys ?? []).map((k) => String(k))));
  return { monthlyPrice, limits, featureKeys };
}

function cleanName(name: string): string | null {
  const cleaned = String(name ?? "").trim();
  return cleaned.length >= 2 && cleaned.length <= 60 ? cleaned : null;
}

function validOrder(order: number) {
  return Number.isInteger(order) && order >= 0 && order <= 1000;
}

export async function createPlanAction(
  input: PlanContentInput & { name: string; sortOrder: number },
): Promise<Done | ActionFailure> {
  const session = await requireAdmin();
  const name = cleanName(input.name);
  if (!name) return { error: "The name must be 2 to 60 characters.", expired: false };
  const sortOrder = Number(input.sortOrder);
  if (!validOrder(sortOrder)) return { error: "The order must be a whole number from 0 to 1000.", expired: false };
  const content = cleanContent(input);
  if (typeof content === "string") return { error: content, expired: false };

  try {
    await createPackage(session.backendToken, { ...content, name, sortOrder });
    revalidatePath("/plans");
    return { ok: true };
  } catch (err) {
    return failure(err, "Couldn't create the plan. Try again.");
  }
}

export async function publishPlanVersionAction(
  input: PlanContentInput & { packageId: number; note: string },
): Promise<Done | ActionFailure> {
  const session = await requireAdmin();
  const note = String(input.note ?? "").trim();
  if (!note || note.length > 500) return { error: "Add a short note (up to 500 characters) explaining the change.", expired: false };
  const content = cleanContent(input);
  if (typeof content === "string") return { error: content, expired: false };

  try {
    await publishPackageVersion(session.backendToken, Number(input.packageId), { ...content, note });
    revalidatePath("/plans");
    return { ok: true };
  } catch (err) {
    return failure(err, "Couldn't publish the new version. Try again.");
  }
}

export async function updatePlanDetailsAction(input: {
  packageId: number;
  name: string;
  sortOrder: number;
  isActive: boolean;
  isDefault: boolean;
}): Promise<Done | ActionFailure> {
  const session = await requireAdmin();
  const name = cleanName(input.name);
  if (!name) return { error: "The name must be 2 to 60 characters.", expired: false };
  const sortOrder = Number(input.sortOrder);
  if (!validOrder(sortOrder)) return { error: "The order must be a whole number from 0 to 1000.", expired: false };

  try {
    await updatePackage(session.backendToken, Number(input.packageId), {
      name,
      sortOrder,
      isActive: input.isActive === true,
      isDefault: input.isDefault === true,
    });
    revalidatePath("/plans");
    return { ok: true };
  } catch (err) {
    return failure(err, "Couldn't save the plan. Try again.");
  }
}
