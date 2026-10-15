import { cookies } from "next/headers";
import { getSession } from "@/lib/get-session";
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

// Staff accounts (DomusPRO admins) belong to the separate admin console, never to this portal.
const STAFF_ROLES = ["SuperAdmin", "Support", "Billing"];
export const STAFF_NOT_ALLOWED_MESSAGE = "Email or password is incorrect.";

// Writes the session cookie from a backend auth response and returns the session user.
export async function saveSession(auth: BackendAuthResponse): Promise<SessionUser> {
  // Safety net: the backend already refuses staff at this portal's sign-in. If one ever got this far anyway,
  // sign their refresh token out and refuse, rather than letting an admin act as a landlord here.
  if (auth.roles.some((role) => STAFF_ROLES.includes(role))) {
    await fetch(`${process.env.BACKEND_API_URL}/api/v1/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ RefreshToken: auth.refreshToken }),
    }).catch(() => {});
    await clearTwoFactorCookie();
    throw new Error(STAFF_NOT_ALLOWED_MESSAGE);
  }

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
  return user;
}

// Keeps the cached display name in the session cookie in step with a profile edit (tokens are untouched).
export async function updateSessionFullName(fullName: string) {
  const session = await getSession();
  if (!session) return;

  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: await createSession({ ...session, fullName }),
    ...SESSION_COOKIE_OPTIONS,
  });
}

// Creates the real session after the second factor passes and returns where to send the user.
export async function startSession(auth: BackendAuthResponse, redirectTo: string): Promise<string> {
  const user = await saveSession(auth);
  await clearTwoFactorCookie();

  if (isSafeRedirectTarget(redirectTo)) {
    return redirectTo;
  }

  const cookieStore = await cookies();
  const pendingInvite = cookieStore.get("pending_tenant_invite")?.value;
  if (pendingInvite) {
    cookieStore.delete("pending_tenant_invite");
    return `/register/tenant?token=${encodeURIComponent(pendingInvite)}`;
  }

  return getDefaultDashboard(user.role);
}
