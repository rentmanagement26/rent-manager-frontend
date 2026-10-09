import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/session";

// Clears a dead session before sending the admin back to sign in. Going straight to /login would bounce them
// back here, because /login skips itself when a session cookie is still present.
export function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/login?error=Your session expired. Sign in again.", request.url));
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
