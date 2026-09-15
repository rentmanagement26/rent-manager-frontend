"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSession, SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS } from "@/lib/session";
import { extractErrorMessage } from "@/lib/api-error";
import type { SessionUser } from "@/lib/types";
import { getDefaultDashboard, isSafeRedirectTarget } from "@/lib/auth-guard";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirect") ?? "");

  const response = await fetch(`${process.env.BACKEND_API_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Email: email, Password: password }),
  });

  if (!response.ok) {
    const message = await extractErrorMessage(response);
    const params = new URLSearchParams({ error: message });
    if (isSafeRedirectTarget(redirectTo)) params.set("redirect", redirectTo);
    redirect(`/login?${params.toString()}`);
  }

  const data = await response.json();
  const user: SessionUser = {
    id: data.userId,
    email: data.email,
    fullName: data.fullName,
    role: data.roles[0],
    backendToken: data.token,
    backendTokenExpiresAt: data.expiresAt,
    refreshToken: data.refreshToken,
    refreshTokenExpiresAt: data.refreshTokenExpiresAt,
  };

  const token = await createSession(user);
  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });

  if (isSafeRedirectTarget(redirectTo)) {
    redirect(redirectTo);
  }

  const pendingInvite = cookieStore.get("pending_tenant_invite")?.value;
  if (pendingInvite) {
    cookieStore.delete("pending_tenant_invite");
    redirect(`/register/tenant?token=${encodeURIComponent(pendingInvite)}`);
  }

  redirect(getDefaultDashboard(user.role));
}