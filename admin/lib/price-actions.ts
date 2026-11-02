"use server";

// Server actions for plan prices and custom prices. Each re-checks the input; the backend enforces permissions and the same rules.

import { revalidatePath } from "next/cache";
import { SessionExpiredError } from "@/lib/api-error";
import { requireAdmin } from "@/lib/auth-guard";
import { getPackageBilling, grantPriceOverride, revokePriceOverride, setStripePrice } from "@/lib/price-api";
import { PLAN_CHANGE_REASONS } from "@/lib/types";
import type { ActionFailure, PackageBilling } from "@/lib/types";

type Done = { ok: true };

function failure(err: unknown, fallback: string): ActionFailure {
  if (err instanceof SessionExpiredError) return { error: err.message, expired: true };
  return { error: err instanceof Error ? err.message : fallback, expired: false };
}

// Loads what is saved for a plan when its "Stripe price" popup opens.
export async function loadPackageBillingAction(packageId: number): Promise<{ ok: true; data: PackageBilling } | ActionFailure> {
  const session = await requireAdmin();
  const result = await getPackageBilling(session.backendToken, Number(packageId));
  if (result.status === "ok") return { ok: true, data: result.data };
  if (result.status === "expired") return { error: "Your session expired. Sign in again.", expired: true };
  return { error: "Couldn't load the saved price. Try again.", expired: false };
}

// Saves a plan's Stripe Price id. Checks the shape here; the backend asks Stripe whether it is usable.
export async function setStripePriceAction(input: { packageId: number; priceId: string }): Promise<Done | ActionFailure> {
  const session = await requireAdmin();
  const priceId = String(input.priceId ?? "").trim();
  if (!/^price_[A-Za-z0-9]+$/.test(priceId)) return { error: "The price id must look like price_ followed by letters and numbers.", expired: false };

  try {
    await setStripePrice(session.backendToken, Number(input.packageId), priceId);
    return { ok: true };
  } catch (err) {
    return failure(err, "Couldn't save the price. Try again.");
  }
}

// Gives a landlord a custom price: a fixed monthly amount or a percent off, for some months or for as long as they stay.
export async function grantPriceOverrideAction(input: {
  landlordProfileId: number;
  kind: string;
  value: string;
  months: string; // empty = for as long as they stay
  reasonCode: string;
  note: string;
}): Promise<Done | ActionFailure> {
  const session = await requireAdmin();

  const value = Number(input.value);
  const isPercent = input.kind === "percent_off";
  if (input.kind !== "fixed_amount" && !isPercent) return { error: "Choose the kind of price.", expired: false };
  if (isPercent && !(value > 0 && value <= 100)) return { error: "The percent off must be more than 0 and at most 100.", expired: false };
  if (!isPercent && !(Number.isFinite(value) && value >= 0 && value <= 10_000 && Math.round(value * 100) / 100 === value)) {
    return { error: "The monthly amount must be from 0 to 10,000, with at most two decimals.", expired: false };
  }

  const monthsText = String(input.months ?? "").trim();
  const months = monthsText === "" ? null : Number(monthsText);
  if (months !== null && (!Number.isInteger(months) || months < 1 || months > 120)) {
    return { error: "Months must be a whole number from 1 to 120.", expired: false };
  }

  if (!PLAN_CHANGE_REASONS.some((r) => r.code === input.reasonCode)) return { error: "Choose a reason.", expired: false };
  const note = String(input.note ?? "").trim();
  if (!note || note.length > 500) return { error: "Add a short note (up to 500 characters) explaining the price.", expired: false };

  try {
    await grantPriceOverride(session.backendToken, Number(input.landlordProfileId), {
      kind: isPercent ? "percent_off" : "fixed_amount",
      monthlyAmount: isPercent ? null : value,
      percentOff: isPercent ? value : null,
      months,
      reasonCode: input.reasonCode,
      note,
    });
    revalidatePath(`/landlords/${input.landlordProfileId}`);
    return { ok: true };
  } catch (err) {
    return failure(err, "Couldn't save the custom price. Try again.");
  }
}

// Removes a custom price. A note is required.
export async function revokePriceOverrideAction(input: { landlordProfileId: number; overrideId: number; note: string }): Promise<Done | ActionFailure> {
  const session = await requireAdmin();
  const note = String(input.note ?? "").trim();
  if (!note || note.length > 500) return { error: "Add a short note (up to 500 characters) explaining why.", expired: false };

  try {
    await revokePriceOverride(session.backendToken, Number(input.landlordProfileId), Number(input.overrideId), note);
    revalidatePath(`/landlords/${input.landlordProfileId}`);
    return { ok: true };
  } catch (err) {
    return failure(err, "Couldn't remove the custom price. Try again.");
  }
}
