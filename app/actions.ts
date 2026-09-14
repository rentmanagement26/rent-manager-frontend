"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { deleteSession, getSessionUser, SESSION_COOKIE_NAME } from "@/lib/session";

export async function logoutAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const session = await getSessionUser(token);
    if (session?.refreshToken) {
      await fetch(`${process.env.BACKEND_API_URL}/api/v1/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ RefreshToken: session.refreshToken }),
      }).catch(() => {});
    }
    deleteSession(token);
  }
  cookieStore.delete(SESSION_COOKIE_NAME);

  redirect("/login");
}