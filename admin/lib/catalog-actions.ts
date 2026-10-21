"use server";

// Server actions for the Catalog page. Each re-checks the input; the backend enforces permissions too.

import { revalidatePath } from "next/cache";
import { SessionExpiredError } from "@/lib/api-error";
import { requireAdmin } from "@/lib/auth-guard";
import { createFeature, createLimit, updateFeature, updateLimitType } from "@/lib/catalog-api";
import type { ActionFailure } from "@/lib/types";

type Done = { ok: true };

// Same rule as the backend: lower-case words of letters/digits separated by dots, 3 to 60 characters.
const KEY_PATTERN = /^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)*$/;

function failure(err: unknown, fallback: string): ActionFailure {
  if (err instanceof SessionExpiredError) return { error: err.message, expired: true };
  return { error: err instanceof Error ? err.message : fallback, expired: false };
}

// Trims and checks a display name (2 to 80 characters); returns an error message or null.
function checkName(name: string): string | null {
  return name.length < 2 || name.length > 80 ? "The name must be 2 to 80 characters." : null;
}

function checkDescription(description: string): string | null {
  return description.length > 300 ? "The description can be at most 300 characters." : null;
}

export async function createFeatureAction(input: {
  key: string;
  displayName: string;
  description: string;
}): Promise<Done | ActionFailure> {
  const session = await requireAdmin();
  const key = String(input.key ?? "").trim();
  const displayName = String(input.displayName ?? "").trim();
  const description = String(input.description ?? "").trim();

  if (key.length < 3 || key.length > 60 || !KEY_PATTERN.test(key)) {
    return {
      error: "The key must be lower-case words of letters and digits, separated by dots, like reports.export.",
      expired: false,
    };
  }
  const invalid = checkName(displayName) ?? checkDescription(description);
  if (invalid) return { error: invalid, expired: false };

  try {
    await createFeature(session.backendToken, { key, displayName, description });
    revalidatePath("/catalog");
    return { ok: true };
  } catch (err) {
    return failure(err, "Couldn't add the feature. Try again.");
  }
}

export async function updateFeatureAction(input: {
  featureId: number;
  displayName: string;
  description: string;
}): Promise<Done | ActionFailure> {
  const session = await requireAdmin();
  const displayName = String(input.displayName ?? "").trim();
  const description = String(input.description ?? "").trim();

  const invalid = checkName(displayName) ?? checkDescription(description);
  if (invalid) return { error: invalid, expired: false };

  try {
    await updateFeature(session.backendToken, Number(input.featureId), { displayName, description });
    revalidatePath("/catalog");
    return { ok: true };
  } catch (err) {
    return failure(err, "Couldn't save the feature. Try again.");
  }
}

// Edits a limit: its display name and whether landlords may stay when it is lowered.
export async function editLimitAction(input: {
  limitTypeId: number;
  displayName: string;
  mayStayWhenLowered: boolean;
}): Promise<Done | ActionFailure> {
  const session = await requireAdmin();
  const displayName = String(input.displayName ?? "").trim();

  const invalid = checkName(displayName);
  if (invalid) return { error: invalid, expired: false };

  try {
    await updateLimitType(session.backendToken, Number(input.limitTypeId), {
      displayName,
      mayStayWhenLowered: input.mayStayWhenLowered === true,
    });
    revalidatePath("/catalog");
    return { ok: true };
  } catch (err) {
    return failure(err, "Couldn't save the limit. Try again.");
  }
}

// Adds a limit for something the system can count. The name is optional (the backend uses its default).
export async function createLimitAction(input: {
  metricKey: string;
  displayName: string;
  mayStayWhenLowered: boolean;
}): Promise<Done | ActionFailure> {
  const session = await requireAdmin();
  const metricKey = String(input.metricKey ?? "").trim();
  const displayName = String(input.displayName ?? "").trim();

  if (!metricKey) return { error: "Choose what to limit.", expired: false };
  if (displayName) {
    const invalid = checkName(displayName);
    if (invalid) return { error: invalid, expired: false };
  }

  try {
    await createLimit(session.backendToken, { metricKey, displayName, mayStayWhenLowered: input.mayStayWhenLowered === true });
    revalidatePath("/catalog");
    return { ok: true };
  } catch (err) {
    return failure(err, "Couldn't add the limit. Try again.");
  }
}
