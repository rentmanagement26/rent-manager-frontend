import { SignJWT, jwtVerify } from "jose";
import type { SessionUser } from "@/lib/types";

export const SESSION_COOKIE_NAME = "session_token";
export const SESSION_DURATION_SECONDS = 60 * 60 * 8; // 8 hours

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
    const { id, email, fullName, role, backendToken } = payload as unknown as SessionUser;
    return { id, email, fullName, role, backendToken };
  } catch {
    return undefined;
  }
}

export function deleteSession(_token: string): void {
  // Stateless sessions: nothing to clear server-side. The cookie itself
  // is deleted by the caller (see app/actions.ts).
}