"use server";

import { changeMyPassword } from "@/lib/account-api";
import { SessionExpiredError } from "@/lib/api-error";
import { requireAdmin } from "@/lib/auth-guard";
import { saveSession } from "@/lib/auth-session";
import {
  confirmAuthenticatorReplacement,
  regenerateRecoveryCodes,
  startAuthenticatorReplacement,
} from "@/lib/two-factor-api";
import type { ActionFailure, TwoFactorEnrollment } from "@/lib/types";

function failure(err: unknown, fallback: string): ActionFailure {
  if (err instanceof SessionExpiredError) {
    return { error: err.message, expired: true };
  }
  return { error: err instanceof Error ? err.message : fallback, expired: false };
}

function cleanCode(value: string) {
  return String(value).replace(/\s/g, "");
}

export async function regenerateRecoveryCodesAction(code: string): Promise<{ recoveryCodes: string[] } | ActionFailure> {
  const session = await requireAdmin();

  try {
    return { recoveryCodes: await regenerateRecoveryCodes(session.backendToken, cleanCode(code)) };
  } catch (err) {
    return failure(err, "Couldn't create new recovery codes. Try again.");
  }
}

export async function startAuthenticatorReplacementAction(
  password: string,
  code: string,
  recoveryCode: string,
): Promise<TwoFactorEnrollment | ActionFailure> {
  const session = await requireAdmin();

  try {
    return await startAuthenticatorReplacement(session.backendToken, {
      password: String(password),
      code: cleanCode(code) || undefined,
      recoveryCode: String(recoveryCode).trim() || undefined,
    });
  } catch (err) {
    return failure(err, "Couldn't start the replacement. Try again.");
  }
}

export async function confirmAuthenticatorReplacementAction(
  code: string,
): Promise<{ recoveryCodes: string[] } | ActionFailure> {
  const session = await requireAdmin();

  try {
    const result = await confirmAuthenticatorReplacement(session.backendToken, cleanCode(code));
    // The backend revokes every old refresh token and issues a fresh session; keep this browser signed in.
    await saveSession(result.auth);
    return { recoveryCodes: result.recoveryCodes };
  } catch (err) {
    return failure(err, "Couldn't replace the authenticator. Try again.");
  }
}

export async function changePasswordAction(
  currentPassword: string,
  newPassword: string,
): Promise<{ ok: true } | ActionFailure> {
  const session = await requireAdmin();

  try {
    const auth = await changeMyPassword(session.backendToken, String(currentPassword), String(newPassword));
    // The backend signed out every other device and issued a fresh session; keep this browser signed in.
    await saveSession(auth);
    return { ok: true };
  } catch (err) {
    return failure(err, "Couldn't change your password. Try again.");
  }
}
