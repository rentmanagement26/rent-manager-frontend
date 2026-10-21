"use server";

// Server actions for the Jobs page. SuperAdmin only; the backend enforces the permissions as well.
import { SessionExpiredError } from "@/lib/api-error";
import { requireAdmin } from "@/lib/auth-guard";
import { getJobRuns, requestJobRun } from "@/lib/jobs-api";
import { getPermissions, PERMISSIONS } from "@/lib/permissions";
import type { ActionFailure, AdminJobRun } from "@/lib/types";

// Asks a job to run now.
export async function runJobAction(name: string): Promise<{ ok: true } | ActionFailure> {
  const session = await requireAdmin();

  const { can } = await getPermissions(session);
  if (!can(PERMISSIONS.jobsRun)) return { error: "Your role can't run jobs.", expired: false };

  try {
    await requestJobRun(session.backendToken, String(name));
    return { ok: true };
  } catch (err) {
    if (err instanceof SessionExpiredError) return { error: err.message, expired: true };
    return { error: err instanceof Error ? err.message : "Couldn't ask the job to run. Try again.", expired: false };
  }
}

// Loads the recent runs of one job for the History popup (20 by default, up to 100 with Show more).
export async function loadJobRunsAction(name: string, limit = 20): Promise<{ ok: true; data: AdminJobRun[] } | ActionFailure> {
  const session = await requireAdmin();

  const count = Math.min(100, Math.max(1, Math.floor(Number(limit)) || 20));
  const result = await getJobRuns(session.backendToken, String(name), count);
  if (result.status === "ok") return { ok: true, data: result.data };
  if (result.status === "expired") return { error: "Your session expired. Sign in again.", expired: true };
  if (result.status === "forbidden") return { error: "Your role can't view job history.", expired: false };
  return { error: "Couldn't load the history. Try again.", expired: false };
}
