// The request helper shared by the tenant and landlord maintenance calls (lib/maintenance-api.ts and lib/landlord-maintenance-api.ts), and the
// wrapper every server action uses. Server only.
import { backendFetch } from "@/lib/api-client";
import { SessionExpiredError } from "@/lib/api-error";
import { requireBackendToken } from "@/lib/auth-guard";
import { backendUrl } from "@/lib/env";
import type { ActionResult } from "@/lib/document-actions";
import type { AppRole } from "@/lib/types";

// Thrown when the backend refuses; the message is safe to show and the code (such as "wrong_state") says why.
export class MaintenanceError extends Error {
  constructor(message: string, readonly code: string, readonly status: number) {
    super(message);
  }
}

// Turns a backend answer into its JSON (null for an empty answer), or throws MaintenanceError with the backend's message and code.
async function readAnswer<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = "Something went wrong. Please try again.";
    let code = "error";
    try {
      const data = (await response.json()) as { message?: string; code?: string };
      if (data.message) message = data.message;
      if (data.code) code = data.code;
    } catch {
      // Not JSON: keep the generic message.
    }
    throw new MaintenanceError(message, code, response.status);
  }

  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

// Sends a request to a backend path (for example "/api/v1/maintenance/summary") and gives back the JSON answer (null for an empty answer).
// A dead session becomes SessionExpiredError.
export async function maintenanceCall<T>(token: string, method: string, path: string, body?: unknown): Promise<T> {
  const response = await backendFetch(path, token, {
    method,
    cache: "no-store",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.status === 401) throw new SessionExpiredError();
  return readAnswer<T>(response);
}

// The same for the few calls that need no sign-in (an invitation page, the contractor's email link): the secret is in the path, not a token.
export async function publicMaintenanceCall<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${backendUrl()}${path}`, {
    method,
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return readAnswer<T>(response);
}

// A 404 means "not yours or not there": answer null instead of throwing.
export async function orNull<T>(work: Promise<T>): Promise<T | null> {
  try {
    return await work;
  } catch (err) {
    if (err instanceof MaintenanceError && err.status === 404) return null;
    throw err;
  }
}

// Signs in the caller for the allowed roles, runs the call and turns every outcome into an ActionResult for a screen to show.
export async function runMaintenance<T>(roles: AppRole[], work: (token: string) => Promise<T>): Promise<ActionResult<T>> {
  const session = await requireBackendToken(roles);
  try {
    return { ok: true, data: await work(session.backendToken) };
  } catch (err) {
    if (err instanceof SessionExpiredError) return { error: err.message, expired: true };
    if (err instanceof MaintenanceError) return { error: err.message, expired: false, code: err.code };
    return { error: "Something went wrong. Please try again.", expired: false };
  }
}

// The same for a public call (no sign-in): every outcome becomes an ActionResult.
export async function runPublicMaintenance<T>(work: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await work() };
  } catch (err) {
    if (err instanceof MaintenanceError) return { error: err.message, expired: false, code: err.code };
    return { error: "Something went wrong. Please try again.", expired: false };
  }
}
