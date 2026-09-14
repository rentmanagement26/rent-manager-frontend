import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
  createSession,
  getSessionUser,
} from "@/lib/session";

// Refresh a little before actual expiry so a request never races it.
const REFRESH_BUFFER_MS = 60_000;

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

  const refreshResponse = await fetch(`${process.env.BACKEND_API_URL}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ RefreshToken: session.refreshToken }),
  });

  if (!refreshResponse.ok) {
    // Don't force logout here - a failure can be a harmless race (e.g. two
    // near-simultaneous requests both reading the same pre-refresh cookie),
    // not just a genuinely dead refresh token. Pass through with the
    // existing token; a losing race self-heals on the next request once the
    // winning request's refreshed cookie has propagated.
    return NextResponse.next();
  }

  const data = await refreshResponse.json();
  const newSessionToken = await createSession({
    ...session,
    backendToken: data.token,
    backendTokenExpiresAt: data.expiresAt,
    refreshToken: data.refreshToken,
    refreshTokenExpiresAt: data.refreshTokenExpiresAt,
  });

  const response = NextResponse.next();
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: newSessionToken,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
  return response;
}

export const config = {
  matcher: ["/landlord/:path*", "/tenant/:path*", "/contractor/:path*", "/admin/:path*"],
};