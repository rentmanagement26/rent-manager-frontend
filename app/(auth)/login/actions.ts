"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSession, SESSION_COOKIE_NAME } from "@/lib/session";
import { extractErrorMessage } from "@/lib/api-error";
import type { SessionUser } from "@/lib/types";
import { getDefaultDashboard } from "@/lib/auth-guard";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const response = await fetch(`${process.env.BACKEND_API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Email: email, Password: password }),
  });

  if (!response.ok) {
    const message = await extractErrorMessage(response);
    redirect(`/login?error=${encodeURIComponent(message)}`);
  }

  const data = await response.json();
  const user: SessionUser = {
    id: data.userId,
    email: data.email,
    name: data.name,
    role: data.roles[0],
  };

const token = await createSession(user);
  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  redirect(getDefaultDashboard(user.role));
}