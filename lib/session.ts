import type { SessionUser } from "@/lib/types";

export const SESSION_COOKIE_NAME = "session_token";

const globalForSessions = globalThis as unknown as { __sessions?: Map<string, SessionUser> };
const sessions = globalForSessions.__sessions ?? (globalForSessions.__sessions = new Map());

export function createSession(user: SessionUser): string {
  const token = crypto.randomUUID();
  sessions.set(token, user);
  return token;
}

export function getSessionUser(token: string): SessionUser | undefined {
  return sessions.get(token);
}

export function deleteSession(token: string): void {
  sessions.delete(token);
}