import { backendFetch } from "@/lib/api-client";
import { SessionExpiredError, extractErrorMessage } from "@/lib/api-error";
import type {
  BackendAuthResponse,
  TwoFactorEnabledResult,
  TwoFactorEnrollment,
  TwoFactorStatus,
} from "@/lib/types";

async function authedTwoFactor<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await backendFetch(`/api/v1/auth/2fa/${path}`, token, init);
  if (response.status === 401) {
    throw new SessionExpiredError();
  }
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
}

function postAuthed<T>(path: string, token: string, body: Record<string, string | undefined>) {
  return authedTwoFactor<T>(path, token, { method: "POST", body: JSON.stringify(body) });
}

export function getTwoFactorStatus(token: string): Promise<TwoFactorStatus> {
  return authedTwoFactor("status", token);
}

export async function regenerateRecoveryCodes(token: string, code: string): Promise<string[]> {
  const result = await postAuthed<{ recoveryCodes: string[] }>("recovery-codes/regenerate", token, { Code: code });
  return result.recoveryCodes;
}

export function startAuthenticatorReplacement(
  token: string,
  input: { password: string; code?: string; recoveryCode?: string }
): Promise<TwoFactorEnrollment> {
  return postAuthed("replace/start", token, {
    Password: input.password,
    Code: input.code,
    RecoveryCode: input.recoveryCode,
  });
}

export function confirmAuthenticatorReplacement(token: string, code: string): Promise<TwoFactorEnabledResult> {
  return postAuthed("replace/confirm", token, { Code: code });
}

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
