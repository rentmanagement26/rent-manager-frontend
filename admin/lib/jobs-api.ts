// Backend calls for the Jobs page (SuperAdmin only): the scheduled jobs, how their runs went, and "run now".
import { backendFetch, getJson } from "@/lib/api-client";
import { SessionExpiredError } from "@/lib/api-error";
import type { AdminJob, AdminJobRun } from "@/lib/types";

const BASE = "/api/v1/admin/jobs";

// Every job with its schedule, whether it is running, when it is next due and its last run.
export function getJobs(token: string) {
  return getJson<AdminJob[]>(BASE, token);
}

// The recent runs of one job, newest first. The backend allows at most 100 per request.
export function getJobRuns(token: string, name: string, limit = 20) {
  return getJson<AdminJobRun[]>(`${BASE}/${encodeURIComponent(name)}/runs?limit=${limit}`, token);
}

// Asks for a job to run now. It runs in the background within a moment; look at the job's runs to see how it went.
export async function requestJobRun(token: string, name: string): Promise<void> {
  const response = await backendFetch(`${BASE}/${encodeURIComponent(name)}/run`, token, { method: "POST" });
  if (response.ok) return;
  if (response.status === 401) throw new SessionExpiredError();
  if (response.status === 403) throw new Error("Your role can't run jobs.");
  if (response.status === 404) throw new Error("No such job.");
  throw new Error("Couldn't ask the job to run. Try again.");
}
