"use server";

// Server actions for the Billing page. The backend resolves the landlord from the session, so one landlord can never change another's plan.
import { SessionExpiredError } from "@/lib/api-error";
import { requireBackendToken } from "@/lib/auth-guard";
import {
  PlanChangeRefused,
  cancelBillingPlan,
  changeBillingPlan,
  dropPendingChange,
  getCancelOptions,
  getCardPageUrl,
  previewBillingChange,
  startCheckout,
  undoCancel,
} from "@/lib/billing-api";
import type { ActionFailure, BillingChangeAnswer, BillingChangeResult, BillingInterval, BillingTiming, CancelOptions, CancelResult } from "@/lib/types";

function failure(err: unknown, fallback: string): ActionFailure {
  if (err instanceof SessionExpiredError) return { error: err.message, expired: true };
  if (err instanceof PlanChangeRefused) return { error: err.message, expired: false };
  return { error: fallback, expired: false };
}

// The browser only ever sends "month" or "year"; anything else is treated as monthly.
const intervalOf = (interval: string): BillingInterval => (interval === "year" ? "year" : "month");
const timingOf = (timing: string): BillingTiming => (timing === "now" ? "now" : "end_of_period");

// Returns the Stripe address for a paid plan; the browser then navigates to it.
export async function checkoutAction(packageId: number, interval: string): Promise<{ ok: true; url: string } | ActionFailure> {
  const session = await requireBackendToken(["Landlord"]);

  try {
    return { ok: true, url: await startCheckout(session.backendToken, Number(packageId), intervalOf(interval)) };
  } catch (err) {
    return failure(err, "Couldn't start checkout. Please try again.");
  }
}

// Shows what switching plan would cost and when, before the landlord confirms.
export async function previewChangeAction(packageId: number, interval: string): Promise<{ ok: true; answer: BillingChangeAnswer } | ActionFailure> {
  const session = await requireBackendToken(["Landlord"]);

  try {
    return { ok: true, answer: await previewBillingChange(session.backendToken, Number(packageId), intervalOf(interval)) };
  } catch (err) {
    return failure(err, "Couldn't check that plan. Please try again.");
  }
}

// Confirms the switch the preview showed and returns the figures for the receipt.
export async function changeAction(packageId: number, interval: string, timing: string): Promise<{ ok: true; result: BillingChangeResult } | ActionFailure> {
  const session = await requireBackendToken(["Landlord"]);

  try {
    return { ok: true, result: await changeBillingPlan(session.backendToken, Number(packageId), intervalOf(interval), timingOf(timing)) };
  } catch (err) {
    return failure(err, "Couldn't change your plan. Please try again.");
  }
}

// Keeps the current plan instead of the lower one booked for the end of the period.
export async function dropPendingChangeAction(): Promise<{ ok: true } | ActionFailure> {
  const session = await requireBackendToken(["Landlord"]);

  try {
    await dropPendingChange(session.backendToken);
    return { ok: true };
  } catch (err) {
    return failure(err, "Couldn't keep your plan. Please try again.");
  }
}

// What cancelling would do, for the cancel popup.
export async function cancelOptionsAction(): Promise<{ ok: true; options: CancelOptions } | ActionFailure> {
  const session = await requireBackendToken(["Landlord"]);

  try {
    return { ok: true, options: await getCancelOptions(session.backendToken) };
  } catch (err) {
    return failure(err, "Couldn't load the cancel options. Please try again.");
  }
}

// Cancels the plan, with or without the refund the landlord chose.
export async function cancelAction(refund: boolean): Promise<{ ok: true; result: CancelResult } | ActionFailure> {
  const session = await requireBackendToken(["Landlord"]);

  try {
    return { ok: true, result: await cancelBillingPlan(session.backendToken, refund === true) };
  } catch (err) {
    return failure(err, "Couldn't cancel your plan. Please try again.");
  }
}

// Takes back a cancellation.
export async function undoCancelAction(): Promise<{ ok: true } | ActionFailure> {
  const session = await requireBackendToken(["Landlord"]);

  try {
    await undoCancel(session.backendToken);
    return { ok: true };
  } catch (err) {
    return failure(err, "Couldn't undo the cancellation. Please try again.");
  }
}

// The address of Stripe's card page; the browser then navigates to it.
export async function cardPageAction(): Promise<{ ok: true; url: string } | ActionFailure> {
  const session = await requireBackendToken(["Landlord"]);

  try {
    return { ok: true, url: await getCardPageUrl(session.backendToken) };
  } catch (err) {
    return failure(err, "Couldn't open the card page. Please try again.");
  }
}
