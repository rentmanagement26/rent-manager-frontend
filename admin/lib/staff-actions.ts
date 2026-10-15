"use server";

import { SessionExpiredError } from "@/lib/api-error";
import { requireAdmin } from "@/lib/auth-guard";
import {
  createStaff,
  deactivateStaff,
  reactivateStaff,
  resetLandlordTwoFactor,
  resetStaffPassword,
  resetStaffTwoFactor,
  setLandlordActive,
  setStaffRoles,
} from "@/lib/staff-api";
import { ADMIN_ROLES, TWO_FACTOR_RESET_REASONS } from "@/lib/types";
import type { ActionFailure, TemporaryPassword, TwoFactorResetReason } from "@/lib/types";

// Server actions for the SuperAdmin-only controls (Admin team and landlord account controls).
//
// A server action can be called by anyone holding a session cookie, so each one checks the role again.
// The backend checks too; these checks just give a friendlier message.

type Done = { ok: true };
type DoneWithPassword = { ok: true; password: TemporaryPassword };

// Turns a thrown error into the { error, expired } shape the screens expect.
function failure(err: unknown, fallback: string): ActionFailure {
  if (err instanceof SessionExpiredError) return { error: err.message, expired: true };
  return {
    error: err instanceof Error ? err.message : fallback,
    expired: false,
  };
}

// The signed-in admin's token, or a failure when they are not a SuperAdmin.
async function superAdminToken(): Promise<{ token: string } | ActionFailure> {
  const session = await requireAdmin();
  if (session.role !== "SuperAdmin") return { error: "Only a SuperAdmin can do this.", expired: false };
  return { token: session.backendToken };
}

// The 6-digit code from the admin's own authenticator app, with spaces removed.
function cleanCode(code: string) {
  return String(code ?? "").replace(/\s/g, "");
}

function validRoles(roles: string[]) {
  const list = Array.from(new Set((roles ?? []).map((r) => String(r))));
  return list.length > 0 && list.every((r) => (ADMIN_ROLES as readonly string[]).includes(r)) ? list : null;
}

// Both 2FA resets need a reason from the list and a written note.
function validReason(
  reasonCode: string,
  note: string,
): { reasonCode: TwoFactorResetReason; note: string } | ActionFailure {
  const reason = TWO_FACTOR_RESET_REASONS.find((r) => r.code === reasonCode);
  const cleanNote = String(note ?? "").trim();
  if (!reason) return { error: "Choose a reason.", expired: false };
  if (!cleanNote) return { error: "Add a short note explaining the reset.", expired: false };
  return { reasonCode: reason.code, note: cleanNote };
}

// ---- Admin team ---------------------------------------------------------------------------------------------

export async function createStaffAction(input: {
  email: string;
  fullName: string;
  roles: string[];
  code: string;
}): Promise<DoneWithPassword | ActionFailure> {
  const auth = await superAdminToken();
  if ("error" in auth) return auth;

  const roles = validRoles(input.roles);
  if (!roles) return { error: "Choose at least one role.", expired: false };

  try {
    const password = await createStaff(auth.token, {
      email: String(input.email).trim(),
      fullName: String(input.fullName).trim(),
      roles,
      code: cleanCode(input.code),
    });
    return password ? { ok: true, password } : { error: "Couldn't create the account. Try again.", expired: false };
  } catch (err) {
    return failure(err, "Couldn't create the account. Try again.");
  }
}

export async function resetStaffPasswordAction(
  userId: string,
  code: string,
): Promise<DoneWithPassword | ActionFailure> {
  const auth = await superAdminToken();
  if ("error" in auth) return auth;

  try {
    const password = await resetStaffPassword(auth.token, String(userId), cleanCode(code));
    return password ? { ok: true, password } : { error: "Couldn't reset the password. Try again.", expired: false };
  } catch (err) {
    return failure(err, "Couldn't reset the password. Try again.");
  }
}

export async function setStaffRolesAction(
  userId: string,
  roles: string[],
  code: string,
): Promise<Done | ActionFailure> {
  const auth = await superAdminToken();
  if ("error" in auth) return auth;

  const cleanRoles = validRoles(roles);
  if (!cleanRoles) return { error: "Choose at least one role.", expired: false };

  try {
    await setStaffRoles(auth.token, String(userId), cleanRoles, cleanCode(code));
    return { ok: true };
  } catch (err) {
    return failure(err, "Couldn't change the roles. Try again.");
  }
}

export async function deactivateStaffAction(userId: string): Promise<Done | ActionFailure> {
  const auth = await superAdminToken();
  if ("error" in auth) return auth;

  try {
    await deactivateStaff(auth.token, String(userId));
    return { ok: true };
  } catch (err) {
    return failure(err, "Couldn't deactivate the account. Try again.");
  }
}

export async function reactivateStaffAction(userId: string, code: string): Promise<Done | ActionFailure> {
  const auth = await superAdminToken();
  if ("error" in auth) return auth;

  try {
    await reactivateStaff(auth.token, String(userId), cleanCode(code));
    return { ok: true };
  } catch (err) {
    return failure(err, "Couldn't reactivate the account. Try again.");
  }
}

export async function resetStaffTwoFactorAction(
  userId: string,
  reasonCode: string,
  note: string,
  code: string,
): Promise<DoneWithPassword | ActionFailure> {
  const auth = await superAdminToken();
  if ("error" in auth) return auth;

  const reason = validReason(reasonCode, note);
  if ("error" in reason) return reason;

  try {
    const password = await resetStaffTwoFactor(auth.token, String(userId), {
      ...reason,
      code: cleanCode(code),
    });
    return password ? { ok: true, password } : { error: "Couldn't reset two-factor. Try again.", expired: false };
  } catch (err) {
    return failure(err, "Couldn't reset two-factor. Try again.");
  }
}

// ---- Landlord account controls ------------------------------------------------------------------------------

export async function resetLandlordTwoFactorAction(
  userId: string,
  reasonCode: string,
  note: string,
  code: string,
): Promise<Done | ActionFailure> {
  const auth = await superAdminToken();
  if ("error" in auth) return auth;

  const reason = validReason(reasonCode, note);
  if ("error" in reason) return reason;

  try {
    await resetLandlordTwoFactor(auth.token, String(userId), {
      ...reason,
      code: cleanCode(code),
    });
    return { ok: true };
  } catch (err) {
    return failure(err, "Couldn't reset two-factor. Try again.");
  }
}

export async function setLandlordActiveAction(
  landlordProfileId: number,
  active: boolean,
): Promise<Done | ActionFailure> {
  const auth = await superAdminToken();
  if ("error" in auth) return auth;

  try {
    await setLandlordActive(auth.token, Number(landlordProfileId), active === true);
    return { ok: true };
  } catch (err) {
    return failure(err, "Couldn't change the account. Try again.");
  }
}
