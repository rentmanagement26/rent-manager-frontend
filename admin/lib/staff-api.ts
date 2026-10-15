import { backendFetch, getJson } from "@/lib/api-client";
import { SessionExpiredError, extractErrorMessage } from "@/lib/api-error";
import type { StaffMember, TemporaryPassword, TwoFactorResetReason } from "@/lib/types";

// Calls for the SuperAdmin-only controls: the Admin team (staff accounts) and a few landlord account controls.
// All of them need the signed-in admin's token. Several also need a fresh 6-digit code from the admin's own
// authenticator app (`code`), which the backend checks as proof that it really is that admin.

const ADMIN = "/api/v1/admin";

// Sends one write request and turns every kind of answer into a value or a readable error.
// Returns the parsed JSON body, or null when the backend answers "204 No Content".
async function send<T>(method: "POST" | "PUT", path: string, token: string, body?: unknown): Promise<T | null> {
  const response = await backendFetch(path, token, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.ok) {
    if (response.status === 204) return null;
    const text = await response.text();
    return text ? (JSON.parse(text) as T) : null;
  }

  if (response.status === 401) throw new SessionExpiredError();
  if (response.status === 403) throw new Error("Your role can't do this.");
  if (response.status === 429) throw new Error("Too many attempts. Wait a minute and try again.");

  // The backend's staff errors look like { code, message }. Anything else falls back to the generic reader.
  const text = await response.text();
  try {
    const parsed = JSON.parse(text) as { message?: string };
    if (parsed.message) throw new Error(parsed.message);
  } catch (err) {
    if (err instanceof Error && err.message && !(err instanceof SyntaxError)) throw err;
  }
  throw new Error(await extractErrorMessage(new Response(text)));
}

// ---- Admin team ---------------------------------------------------------------------------------------------

export function getStaff(token: string) {
  return getJson<StaffMember[]>(`${ADMIN}/staff`, token);
}

// New staff account. The backend makes a temporary password and returns it once.
export function createStaff(token: string, input: { email: string; fullName: string; roles: string[]; code: string }) {
  return send<TemporaryPassword>("POST", `${ADMIN}/staff`, token, {
    Email: input.email,
    FullName: input.fullName,
    Roles: input.roles,
    Code: input.code,
  });
}

// A new temporary password for someone who is locked out. Shown once.
export function resetStaffPassword(token: string, userId: string, code: string) {
  return send<TemporaryPassword>("POST", `${ADMIN}/staff/${userId}/reset-password`, token, { Code: code });
}

export function setStaffRoles(token: string, userId: string, roles: string[], code: string) {
  return send<null>("PUT", `${ADMIN}/staff/${userId}/roles`, token, {
    Roles: roles,
    Code: code,
  });
}

// Signs the person out everywhere and blocks sign-in. Needs no code.
export function deactivateStaff(token: string, userId: string) {
  return send<null>("POST", `${ADMIN}/staff/${userId}/deactivate`, token);
}

export function reactivateStaff(token: string, userId: string, code: string) {
  return send<null>("POST", `${ADMIN}/staff/${userId}/reactivate`, token, {
    Code: code,
  });
}

// Resets a staff member's authenticator. Returns a new temporary password (shown once).
export function resetStaffTwoFactor(
  token: string,
  userId: string,
  input: { reasonCode: TwoFactorResetReason; note: string; code: string },
) {
  return send<TemporaryPassword>("POST", `${ADMIN}/staff/${userId}/reset-2fa`, token, {
    ReasonCode: input.reasonCode,
    Note: input.note,
    Code: input.code,
  });
}

// ---- Landlord account controls (SuperAdmin) -----------------------------------------------------------------

// Resets a landlord's authenticator. They set it up again at their next sign-in; their password is unchanged.
export function resetLandlordTwoFactor(
  token: string,
  userId: string,
  input: { reasonCode: TwoFactorResetReason; note: string; code: string },
) {
  return send<{ message: string }>("POST", `${ADMIN}/users/${userId}/reset-2fa`, token, {
    ReasonCode: input.reasonCode,
    Note: input.note,
    Code: input.code,
  });
}

// Switches a landlord's account off (they are signed out everywhere) or back on. Their data is kept.
export function setLandlordActive(token: string, landlordProfileId: number, active: boolean) {
  return send<null>("POST", `${ADMIN}/landlords/${landlordProfileId}/${active ? "reactivate" : "deactivate"}`, token);
}
