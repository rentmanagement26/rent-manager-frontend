import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS, createSession } from "@/lib/session";
import { getDefaultDashboard, isSafeRedirectTarget } from "@/lib/auth-guard";
import type { BackendAuthResponse, SessionUser } from "@/lib/types";

const TWO_FACTOR_COOKIE_NAME = "two_factor_token";
const TWO_FACTOR_COOKIE_PATH = "/login/two-factor";
// Match the backend token lifetimes: 15 min for setup, 5 min for the verify challenge.
const SETUP_TOKEN_SECONDS = 15 * 60;
const CHALLENGE_TOKEN_SECONDS = 5 * 60;

export const SESSION_EXPIRED_MESSAGE = "Your sign-in session has expired. Please log in again.";

export function isSessionExpiredMessage(message: string): boolean {
  return message.toLowerCase().includes("session has expired");
}

export async function setTwoFactorCookie(twoFactorToken: string, setupRequired: boolean) {
  const cookieStore = await cookies();
  cookieStore.set({
    name: TWO_FACTOR_COOKIE_NAME,
    value: twoFactorToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: TWO_FACTOR_COOKIE_PATH,
    maxAge: setupRequired ? SETUP_TOKEN_SECONDS : CHALLENGE_TOKEN_SECONDS,
  });
}

export async function getTwoFactorToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(TWO_FACTOR_COOKIE_NAME)?.value;
}

export async function clearTwoFactorCookie() {
  const cookieStore = await cookies();
  cookieStore.set({
    name: TWO_FACTOR_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: TWO_FACTOR_COOKIE_PATH,
    maxAge: 0,
  });
}

// Creates the real session after the second factor passes and returns where to send the user.
export async function startSession(auth: BackendAuthResponse, redirectTo: string): Promise<string> {
  const user: SessionUser = {
    id: auth.userId,
    email: auth.email,
    fullName: auth.fullName,
    role: auth.roles[0],
    backendToken: auth.token,
    backendTokenExpiresAt: auth.expiresAt,
    refreshToken: auth.refreshToken,
    refreshTokenExpiresAt: auth.refreshTokenExpiresAt,
  };

  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: await createSession(user),
    ...SESSION_COOKIE_OPTIONS,
  });
  await clearTwoFactorCookie();

  if (isSafeRedirectTarget(redirectTo)) {
    return redirectTo;
  }

  const pendingInvite = cookieStore.get("pending_tenant_invite")?.value;
  if (pendingInvite) {
    cookieStore.delete("pending_tenant_invite");
    return `/register/tenant?token=${encodeURIComponent(pendingInvite)}`;
  }

  return getDefaultDashboard(user.role);
}
