"use server";

import { SessionExpiredError } from "@/lib/api-error";
import { requireBackendToken } from "@/lib/auth-guard";
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
  const session = await requireBackendToken();

  try {
    const recoveryCodes = await regenerateRecoveryCodes(session.backendToken, cleanCode(code));
    return { recoveryCodes };
  } catch (err) {
    return failure(err, "Couldn't create new recovery codes. Please try again.");
  }
}

export async function startAuthenticatorReplacementAction(
  password: string,
  code: string,
  recoveryCode: string
): Promise<TwoFactorEnrollment | ActionFailure> {
  const session = await requireBackendToken();

  try {
    return await startAuthenticatorReplacement(session.backendToken, {
      password: String(password),
      code: cleanCode(code) || undefined,
      recoveryCode: String(recoveryCode).trim() || undefined,
    });
  } catch (err) {
    return failure(err, "Couldn't start the replacement. Please try again.");
  }
}

export async function confirmAuthenticatorReplacementAction(
  code: string
): Promise<{ recoveryCodes: string[] } | ActionFailure> {
  const session = await requireBackendToken();

  try {
    const result = await confirmAuthenticatorReplacement(session.backendToken, cleanCode(code));
    // The backend revokes every old refresh token and issues a fresh session; keep this browser signed in.
    await saveSession(result.auth);
    return { recoveryCodes: result.recoveryCodes };
  } catch (err) {
    return failure(err, "Couldn't replace the authenticator. Please try again.");
  }
}
