"use server";

// Server actions for lease renewals: record the decision, snooze the reminders, set the notice period. Each answers { ok } or { error, expired }.
import { SessionExpiredError } from "@/lib/api-error";
import { requireBackendToken } from "@/lib/auth-guard";
import { setRenewalDecision, setRenewalNotice, snoozeReminders } from "@/lib/tenancy-api";

export type RenewalResult = { ok: true } | { error: string; expired: boolean };

// Runs one call as the signed-in landlord and turns every outcome into a RenewalResult.
async function run(work: (token: string) => Promise<void>): Promise<RenewalResult> {
  const session = await requireBackendToken(["Admin", "Landlord"]);
  try {
    await work(session.backendToken);
    return { ok: true };
  } catch (err) {
    if (err instanceof SessionExpiredError) return { error: err.message, expired: true };
    return { error: err instanceof Error ? err.message : "Something went wrong. Please try again.", expired: false };
  }
}

const DECISIONS = ["pending", "offered", "not_renewing", "month_to_month"] as const;

export async function decideRenewalAction(tenancyId: number, decision: string): Promise<RenewalResult> {
  if (!(DECISIONS as readonly string[]).includes(decision)) return { error: "Choose what you plan to do.", expired: false };
  return run((token) => setRenewalDecision(token, Number(tenancyId), decision as (typeof DECISIONS)[number]));
}

export async function snoozeRenewalAction(tenancyId: number, days: number | null): Promise<RenewalResult> {
  return run((token) => snoozeReminders(token, Number(tenancyId), days === null ? null : Number(days)));
}

export async function setNoticeDaysAction(tenancyId: number, days: number | null): Promise<RenewalResult> {
  return run((token) => setRenewalNotice(token, Number(tenancyId), days === null ? null : Number(days)));
}
