import { SignJWT, jwtVerify } from "jose";
import { isAdminRole } from "@/lib/types";
import type { SessionUser } from "@/lib/types";

// Different names from the landlord app: cookies are shared across ports on localhost.
export const SESSION_COOKIE_NAME = "admin_session";
// Admin sessions are short: 4 hours of inactivity. proxy.ts re-issues the cookie on every token refresh.
export const SESSION_DURATION_SECONDS = 60 * 60 * 4;

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: SESSION_DURATION_SECONDS,
};

function getSecretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function getSessionUser(token: string): Promise<SessionUser | undefined> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const { id, email, fullName, role, backendToken, backendTokenExpiresAt, refreshToken, refreshTokenExpiresAt } =
      payload as unknown as SessionUser;
    if (!isAdminRole(role)) return undefined;
    return { id, email, fullName, role, backendToken, backendTokenExpiresAt, refreshToken, refreshTokenExpiresAt };
  } catch {
    return undefined;
  }
}
