import { SignJWT, jwtVerify } from "jose";
import { sessionSecret } from "@/lib/env";
import type { SessionUser } from "@/lib/types";

export const SESSION_COOKIE_NAME = "session_token";
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 days, sliding — middleware re-issues this on every refresh

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_DURATION_SECONDS,
};

function getSecretKey() {
  return new TextEncoder().encode(sessionSecret());
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
    return { id, email, fullName, role, backendToken, backendTokenExpiresAt, refreshToken, refreshTokenExpiresAt };
  } catch {
    return undefined;
  }
}

export function deleteSession(_token: string): void {
  // Stateless sessions: nothing to clear server-side. The cookie itself
  // is deleted by the caller (see app/actions.ts).
}