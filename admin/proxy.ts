import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, SESSION_COOKIE_OPTIONS, createSession, getSessionUser } from "@/lib/session";
import type { SessionUser } from "@/lib/types";

// Refresh a little before actual expiry so a request never races it.
const REFRESH_BUFFER_MS = 60_000;

// How long a finished refresh is remembered. A page often sends several requests at once (the page itself,
// link prefetches, a form action), and they all carry the same old cookie. Only the first may call the backend:
// refresh tokens work once, and the backend treats a second use as a stolen token. Later ones reuse the answer.
const SHARE_RESULT_MS = 15_000;

// The new session cookie value, or null when the backend refused to renew.
type Renewed = string | null;

// Refreshes in progress or just finished, keyed by the refresh token that was used. Held in memory only, never
// written anywhere, and each entry is removed after SHARE_RESULT_MS. Only a request that already holds the old
// refresh token (inside its own signed cookie) can hit an entry, so nothing is handed to anyone new.
const renewals = new Map<string, Promise<Renewed>>();

// Asks the backend for a new access token and refresh token, and builds the new session cookie from them.
async function renewSession(session: SessionUser & { refreshToken: string }): Promise<Renewed> {
  try {
    const response = await fetch(`${process.env.BACKEND_API_URL}/api/v1/admin/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ RefreshToken: session.refreshToken }),
    });
    if (!response.ok) return null;

    const data = await response.json();
    return await createSession({
      ...session,
      backendToken: data.token,
      backendTokenExpiresAt: data.expiresAt,
      refreshToken: data.refreshToken,
      refreshTokenExpiresAt: data.refreshTokenExpiresAt,
    });
  } catch {
    // The backend could not be reached: keep the current cookie, the next request tries again.
    return null;
  }
}

// Starts a refresh, or joins the one already running for the same refresh token.
function renewOnce(session: SessionUser & { refreshToken: string }): Promise<Renewed> {
  const key = session.refreshToken;
  const existing = renewals.get(key);
  if (existing) return existing;

  const renewal = renewSession(session);
  renewals.set(key, renewal);
  void renewal.finally(() => setTimeout(() => renewals.delete(key), SHARE_RESULT_MS).unref?.());
  return renewal;
}

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.next();
  }

  const session = await getSessionUser(token);
  if (!session?.backendToken || !session.backendTokenExpiresAt || !session.refreshToken) {
    return NextResponse.next();
  }

  const expiresAt = new Date(session.backendTokenExpiresAt).getTime();
  if (Date.now() < expiresAt - REFRESH_BUFFER_MS) {
    return NextResponse.next();
  }

  // Renew the session through the staff door.
  const newSessionToken = await renewOnce({ ...session, refreshToken: session.refreshToken });
  if (!newSessionToken) {
    // A failure can be a harmless race with another instance, so pass through; the page handles a dead session.
    return NextResponse.next();
  }

  // Two copies of the new cookie: one on the request, so the page rendered right now already uses the new token
  // (without this, the very request that triggers a refresh would still send the expired token to the backend),
  // and one on the response, so the browser keeps it for next time.
  request.cookies.set(SESSION_COOKIE_NAME, newSessionToken);
  const response = NextResponse.next({ request });
  response.cookies.set({ name: SESSION_COOKIE_NAME, value: newSessionToken, ...SESSION_COOKIE_OPTIONS });
  return response;
}

export const config = {
  // Everything except the sign-in pages, Next internals and static files.
  matcher: ["/((?!login|_next|favicon.ico|.*\\..*).*)"],
};
