import { cookies } from "next/headers";
import { HOME_PATH } from "@/lib/auth-guard";
import { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS, createSession } from "@/lib/session";
import { isAdminRole } from "@/lib/types";
import type { BackendAuthResponse, SessionUser } from "@/lib/types";

const TWO_FACTOR_COOKIE_NAME = "admin_two_factor";
const TWO_FACTOR_COOKIE_PATH = "/login/two-factor";
// Match the backend token lifetimes: 15 min for setup, 5 min for the verify challenge.
const SETUP_TOKEN_SECONDS = 15 * 60;
const CHALLENGE_TOKEN_SECONDS = 5 * 60;

export const SESSION_EXPIRED_MESSAGE = "Your sign-in expired. Start again.";
export const NOT_ADMIN_MESSAGE = "This account can't sign in here.";

export function isSessionExpiredMessage(message: string): boolean {
  return message.toLowerCase().includes("expired");
}

const twoFactorCookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: TWO_FACTOR_COOKIE_PATH,
};

export async function setTwoFactorCookie(twoFactorToken: string, setupRequired: boolean) {
  const cookieStore = await cookies();
  cookieStore.set({
    ...twoFactorCookieBase,
    name: TWO_FACTOR_COOKIE_NAME,
    value: twoFactorToken,
    maxAge: setupRequired ? SETUP_TOKEN_SECONDS : CHALLENGE_TOKEN_SECONDS,
  });
}

export async function getTwoFactorToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(TWO_FACTOR_COOKIE_NAME)?.value;
}

export async function clearTwoFactorCookie() {
  const cookieStore = await cookies();
  cookieStore.set({ ...twoFactorCookieBase, name: TWO_FACTOR_COOKIE_NAME, value: "", maxAge: 0 });
}

export async function revokeRefreshToken(refreshToken: string) {
  await fetch(`${process.env.BACKEND_API_URL}/api/v1/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ RefreshToken: refreshToken }),
  }).catch(() => {});
}

// Creates the real session after the second factor passes and returns where to send the user.
// The role is only known at this point, so a non-admin is rejected here and their tokens revoked.
export async function startSession(auth: BackendAuthResponse): Promise<string> {
  const role = auth.roles.find(isAdminRole);
  if (!role) {
    await revokeRefreshToken(auth.refreshToken);
    await clearTwoFactorCookie();
    throw new Error(NOT_ADMIN_MESSAGE);
  }

  const user: SessionUser = {
    id: auth.userId,
    email: auth.email,
    fullName: auth.fullName,
    role,
    backendToken: auth.token,
    backendTokenExpiresAt: auth.expiresAt,
    refreshToken: auth.refreshToken,
    refreshTokenExpiresAt: auth.refreshTokenExpiresAt,
  };

  const cookieStore = await cookies();
  cookieStore.set({ name: SESSION_COOKIE_NAME, value: await createSession(user), ...SESSION_COOKIE_OPTIONS });
  await clearTwoFactorCookie();
  return HOME_PATH;
}
