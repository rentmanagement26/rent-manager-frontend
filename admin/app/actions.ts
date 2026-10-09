"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revokeRefreshToken } from "@/lib/auth-session";
import { SESSION_COOKIE_NAME, getSessionUser } from "@/lib/session";

export async function logoutAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const session = await getSessionUser(token);
    if (session?.refreshToken) {
      await revokeRefreshToken(session.refreshToken);
    }
  }
  cookieStore.delete(SESSION_COOKIE_NAME);

  redirect("/login");
}
