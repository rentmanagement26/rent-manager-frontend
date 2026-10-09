"use server";

import { redirect } from "next/navigation";
import { isSafeRedirectTarget } from "@/lib/auth-guard";
import {
  SESSION_EXPIRED_MESSAGE,
  clearTwoFactorCookie,
  getTwoFactorToken,
  isSessionExpiredMessage,
  startSession,
} from "@/lib/auth-session";
import { beginTwoFactorSetup, enableTwoFactor, recoveryLogin, verifyTwoFactor } from "@/lib/two-factor-api";
import type { ActionFailure, TwoFactorEnrollment } from "@/lib/types";

function loginErrorUrl(message: string) {
  return `/login?${new URLSearchParams({ error: message }).toString()}`;
}

function verifyUrl(error: string, redirectTo: string, recovery: boolean) {
  const params = new URLSearchParams({ error });
  if (isSafeRedirectTarget(redirectTo)) params.set("redirect", redirectTo);
  if (recovery) params.set("mode", "recovery");
  return `/login/two-factor/verify?${params.toString()}`;
}

async function failure(err: unknown, fallback: string): Promise<ActionFailure> {
  const message = err instanceof Error ? err.message : fallback;
  if (isSessionExpiredMessage(message)) {
    await clearTwoFactorCookie();
    return { error: message, expired: true };
  }
  return { error: message, expired: false };
}

async function finishSecondFactor(formData: FormData, recovery: boolean) {
  const token = await getTwoFactorToken();
  if (!token) redirect(loginErrorUrl(SESSION_EXPIRED_MESSAGE));

  const redirectTo = String(formData.get("redirect") ?? "");
  let destination: string | undefined;
  let error = "";

  try {
    const auth = recovery
      ? await recoveryLogin(token, String(formData.get("recoveryCode") ?? "").trim())
      : await verifyTwoFactor(token, String(formData.get("code") ?? "").replace(/\s/g, ""));
    destination = await startSession(auth, redirectTo);
  } catch (err) {
    error = err instanceof Error ? err.message : "Couldn't verify that code. Please try again.";
  }

  if (destination) redirect(destination);

  if (isSessionExpiredMessage(error)) {
    await clearTwoFactorCookie();
    redirect(loginErrorUrl(error));
  }
  redirect(verifyUrl(error, redirectTo, recovery));
}

export async function verifyTwoFactorAction(formData: FormData) {
  await finishSecondFactor(formData, false);
}

export async function recoveryLoginAction(formData: FormData) {
  await finishSecondFactor(formData, true);
}

export async function beginTwoFactorSetupAction(): Promise<TwoFactorEnrollment | ActionFailure> {
  const token = await getTwoFactorToken();
  if (!token) return { error: SESSION_EXPIRED_MESSAGE, expired: true };

  try {
    return await beginTwoFactorSetup(token);
  } catch (err) {
    return failure(err, "Couldn't start two-factor setup. Please try again.");
  }
}

export async function enableTwoFactorAction(
  code: string,
  redirectTo: string
): Promise<{ recoveryCodes: string[]; destination: string } | ActionFailure> {
  const token = await getTwoFactorToken();
  if (!token) return { error: SESSION_EXPIRED_MESSAGE, expired: true };

  try {
    const result = await enableTwoFactor(token, String(code).replace(/\s/g, ""));
    const destination = await startSession(result.auth, String(redirectTo));
    return { recoveryCodes: result.recoveryCodes, destination };
  } catch (err) {
    return failure(err, "Couldn't turn on two-factor. Please try again.");
  }
}
