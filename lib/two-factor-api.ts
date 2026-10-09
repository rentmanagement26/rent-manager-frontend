import { extractErrorMessage } from "@/lib/api-error";
import type { BackendAuthResponse, TwoFactorEnabledResult, TwoFactorEnrollment } from "@/lib/types";

async function postTwoFactor<T>(path: string, body: Record<string, string>): Promise<T> {
  const response = await fetch(`${process.env.BACKEND_API_URL}/api/v1/auth/2fa/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
}

export function beginTwoFactorSetup(twoFactorToken: string): Promise<TwoFactorEnrollment> {
  return postTwoFactor("setup", { TwoFactorToken: twoFactorToken });
}

export function enableTwoFactor(twoFactorToken: string, code: string): Promise<TwoFactorEnabledResult> {
  return postTwoFactor("enable", { TwoFactorToken: twoFactorToken, Code: code });
}

export function verifyTwoFactor(twoFactorToken: string, code: string): Promise<BackendAuthResponse> {
  return postTwoFactor("verify", { TwoFactorToken: twoFactorToken, Code: code });
}

export function recoveryLogin(twoFactorToken: string, recoveryCode: string): Promise<BackendAuthResponse> {
  return postTwoFactor("recovery", { TwoFactorToken: twoFactorToken, RecoveryCode: recoveryCode });
}
